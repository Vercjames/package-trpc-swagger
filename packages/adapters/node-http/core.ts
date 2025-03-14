import { AnyProcedure, callProcedure, procedureTypes, TRPCError, ProcedureType, Router, AnyRouterDef } from "@trpc/server"
import {
  NodeHTTPHandlerOptions,
  NodeHTTPRequest,
  NodeHTTPResponse
} from "@trpc/server/dist/adapters/node-http"
import cloneDeep from "lodash.clonedeep"
import { ZodError, z } from "zod"
import { createRecursiveProxy, getErrorShape } from "@trpc/server/shared"

import { AnyRootConfig, RouterCaller } from "@trpc/server/src"
import { generateOpenApiDocument } from "../../generator"
import {
  OpenApiErrorResponse,
  OpenApiMethod,
  OpenApiResponse,
  OpenApiRouter,
  OpenApiSuccessResponse
} from "../../types"
import { acceptsRequestBody } from "../../utils/method"
import { normalizePath } from "../../utils/path"
import { getInputOutputParsers } from "../../utils/procedure"
import {
  instanceofZodTypeCoercible,
  instanceofZodTypeLikeVoid,
  instanceofZodTypeObject,
  unwrapZodType,
  zodSupportsCoerce
} from "../../utils/zod"
import { TRPC_ERROR_CODE_HTTP_STATUS, getErrorFromUnknown } from "./errors"
import { getBody, getQuery } from "./input"
import { createProcedureCache } from "./procedures"

export type CreateOpenApiNodeHttpHandlerOptions<
  TRouter extends OpenApiRouter,
  TRequest extends NodeHTTPRequest,
  TResponse extends NodeHTTPResponse,
> = Pick<
  NodeHTTPHandlerOptions<TRouter & {
    getErrorShape: () => any;
    createCaller: () => any;
  }, TRequest, TResponse>,
  "router" | "createContext" | "responseMeta" | "onError" | "maxBodySize"
>;

export type OpenApiNextFunction = () => void;

/**
 * Temporary wrapper type for tRPC v11 compatibility
 */
function createCallerFactory<TConfig extends AnyRootConfig>() {
  return function createCallerInner<TRouter extends Router<AnyRouterDef<TConfig>>>(router: TRouter): RouterCaller<TRouter["_def"]> {
    const def = router._def
    return function createCaller(ctx) {
      const proxy = createRecursiveProxy(({ path, args }) => {
        // interop mode
        if (path.length === 1 && procedureTypes.includes(path[0] as ProcedureType)) {
          return callProcedure({
            procedures: def.procedures,
            path: args[0] as string,
            rawInput: args[1],
            ctx,
            type: path[0] as ProcedureType
          })
        }
        const fullPath = path.join(".")
        const procedure = def.procedures[fullPath]
        let type = "query"
        if (procedure._def.mutation) {
          type = "mutation"
        } else if (procedure._def.subscription) {
          type = "subscription"
        }
        return procedure({
          path: fullPath,
          rawInput: args[0],
          getRawInput: () => args[0],
          ctx,
          type
        })
      })
      return proxy as ReturnType<RouterCaller<any>>
    }
  }
}

export const createOpenApiNodeHttpHandler = <
  TRouter extends OpenApiRouter,
  TRequest extends NodeHTTPRequest,
  TResponse extends NodeHTTPResponse,
>(
  opts: CreateOpenApiNodeHttpHandlerOptions<TRouter, TRequest, TResponse>
) => {
  const router = cloneDeep(opts.router)

  // Validate router
  if (process.env.NODE_ENV !== "production") {
    generateOpenApiDocument(router, { title: "", version: "", baseUrl: "" })
  }

  const { createContext, responseMeta, onError, maxBodySize } = opts
  const getProcedure = createProcedureCache(router)

  return async (req: TRequest, res: TResponse, next?: OpenApiNextFunction) => {
    const sendResponse = (
      statusCode: number,
      headers: Record<string, string>,
      body: OpenApiResponse | undefined
    ) => {
      res.statusCode = statusCode
      res.setHeader("Content-Type", "application/json")
      for (const [key, value] of Object.entries(headers)) {
        if (typeof value !== "undefined") {
          res.setHeader(key, value)
        }
      }
      res.end(JSON.stringify(body))
    }

    const method = req.method! as OpenApiMethod & "HEAD"
    const reqUrl = req.url!
    const url = new URL(reqUrl.startsWith("/") ? `http://127.0.0.1${reqUrl}` : reqUrl)
    const path = normalizePath(url.pathname)
    const { procedure, pathInput } = getProcedure(method, path) ?? {}

    let input: any
    let ctx: any
    let data: any

    try {
      if (!procedure) {
        if (next) {
          return next()
        }

        // Can be used for warmup
        if (method === "HEAD") {
          sendResponse(204, {}, undefined)
          return
        }

        throw new TRPCError({
          message: "Not found",
          code: "NOT_FOUND"
        })
      }

      const useBody = acceptsRequestBody(method)
      const schema = getInputOutputParsers(procedure.procedure).inputParser as z.ZodTypeAny
      const unwrappedSchema = unwrapZodType(schema, true)

      // input should stay undefined if z.void()
      if (!instanceofZodTypeLikeVoid(unwrappedSchema)) {
        input = {
          ...(useBody ? await getBody(req, maxBodySize) : getQuery(req, url)),
          ...pathInput
        }
      }

      // if supported, coerce all string values to correct types
      if (zodSupportsCoerce) {
        if (instanceofZodTypeObject(unwrappedSchema)) {
          Object.values(unwrappedSchema.shape).forEach((shapeSchema) => {
            const unwrappedShapeSchema = unwrapZodType(shapeSchema, false)
            if (instanceofZodTypeCoercible(unwrappedShapeSchema)) {
              unwrappedShapeSchema._def.coerce = true
            }
          })
        }
      }

      ctx = await createContext?.({ req, res })
      const caller = createCallerFactory()(router)(ctx)

      const segments = procedure.path.split(".")
      const procedureFn = segments.reduce((acc, curr) => acc[curr], caller as any) as AnyProcedure

      data = await procedureFn(input)

      const meta = responseMeta?.({
        type: procedure.type,
        paths: [procedure.path],
        ctx,
        data: [data],
        errors: []
      })

      const statusCode = meta?.status ?? 200
      const headers = meta?.headers ?? {}
      const body: OpenApiSuccessResponse<typeof data> = data
      // @ts-ignore - Expected Error: 'HTTPHeaders' is not assignable to parameter of type 'Record<string, string>'
      sendResponse(statusCode, headers, body)
    } catch (cause) {
      const error = getErrorFromUnknown(cause)

      onError?.({
        error,
        type: procedure?.type ?? "unknown",
        path: procedure?.path,
        input,
        ctx,
        req
      })

      const meta = responseMeta?.({
        type: procedure?.type ?? "unknown",
        paths: procedure?.path ? [procedure?.path] : undefined,
        ctx,
        data: [data],
        errors: [error]
      })

      const errorShape = getErrorShape({
        config: router._def._config,
        error,
        type: procedure?.type ?? "unknown",
        path: procedure?.path,
        input,
        ctx
      })

      const isInputValidationError = error.code === "BAD_REQUEST"
        && error.cause instanceof Error
        && error.cause.name === "ZodError"

      const statusCode = meta?.status ?? TRPC_ERROR_CODE_HTTP_STATUS[error.code] ?? 500
      const headers = meta?.headers ?? {}
      const body: OpenApiErrorResponse = {
        message: isInputValidationError
          ? "Input validation failed"
          : errorShape?.message ?? error.message ?? "An error occurred",
        code: error.code,
        issues: isInputValidationError ? (error.cause as ZodError).errors : undefined
      }
      // @ts-ignore - Expected Error: 'HTTPHeaders' is not assignable to parameter of type 'Record<string, string>'
      sendResponse(statusCode, headers, body)
    }
  }
}
