import { TRPCError } from "@trpc/server"
import type { NodeIncomingMessage, NodeServerResponse } from "h3"
import { defineEventHandler, getQuery } from "h3"
import { IncomingMessage } from "http"

// Application Sectional || Define Imports
// =================================================================================================
// =================================================================================================
import { normalizePath } from "../utils/path"
import { OpenApiErrorResponse, OpenApiRouter } from "../types"
import { CreateOpenApiNodeHttpHandlerOptions, createOpenApiNodeHttpHandler } from "./node-http/core"

// Application Sectional || Define Export Type
// =================================================================================================
// =================================================================================================
export type CreateOpenApiNuxtHandlerOptions<TRouter extends OpenApiRouter> = Omit<
  // @ts-ignore - Expected Error: 'MockResponse<Response<any, Record<string, any>>>' is not assignable to parameter of type 'NodeHTTPResponse'.
  CreateOpenApiNodeHttpHandlerOptions<TRouter, NodeIncomingMessage, NodeServerResponse>,
  "maxBodySize"
>;

type NuxtRequest = IncomingMessage & {
  query?: ReturnType<typeof getQuery>;
};

// Application Sectional || Define Export Handler
// =================================================================================================
// =================================================================================================
export const createOpenApiNuxtHandler = <TRouter extends OpenApiRouter>(
  opts: CreateOpenApiNuxtHandlerOptions<TRouter>
) => {
  const openApiHttpHandler = createOpenApiNodeHttpHandler(opts)

  return defineEventHandler(async (event) => {
    let pathname: string | null = null

    const { params } = event.context
    if (params && params?.trpc) {
      if (!params.trpc.includes("/")) {
        pathname = params.trpc
      } else {
        pathname = params.trpc
      }
    }

    if (pathname === null) {
      const error = new TRPCError({
        message: "Query \"trpc\" not found - is the `trpc-swagger` file named `[...trpc].ts`?",
        code: "INTERNAL_SERVER_ERROR"
      })

      opts.onError?.({
        error,
        type: "unknown",
        path: undefined,
        input: undefined,
        ctx: undefined,
        req: event.node.req
      })

      event.node.res.statusCode = 500
      event.node.res.setHeader("Content-Type", "application/json")
      const body: OpenApiErrorResponse = {
        message: error.message,
        code: error.code
      }
      event.node.res.end(JSON.stringify(body))

      return
    }

    (event.node.req as NuxtRequest).query = getQuery(event)
    event.node.req.url = normalizePath(pathname)
    await openApiHttpHandler(event.node.req, event.node.res)
  })
}
