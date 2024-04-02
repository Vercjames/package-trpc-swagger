import { TRPCError } from "@trpc/server"
import { APIGatewayEvent, AWSLambdaOptions, UNKNOWN_PAYLOAD_FORMAT_VERSION_ERROR_MESSAGE, getHTTPMethod, getPath, isPayloadV1, isPayloadV2, transformHeaders } from "@trpc/server/adapters/aws-lambda"
import type { NodeHTTPRequest } from "@trpc/server/dist/adapters/node-http"
import type { Context as APIGWContext } from "aws-lambda"
import { EventEmitter } from "events"
import type { RequestMethod } from "node-mocks-http"
import { createRequest, createResponse } from "node-mocks-http"

// Application Sectional || Define Imports
// =================================================================================================
// =================================================================================================
import type { OpenApiErrorResponse, OpenApiRouter } from "../types"
import { TRPC_ERROR_CODE_HTTP_STATUS, getErrorFromUnknown } from "./node-http/errors"
import { createOpenApiNodeHttpHandler } from "./node-http/core"

// Application Sectional || Define Export Type
// =================================================================================================
// =================================================================================================
export type CreateOpenApiAwsLambdaHandlerOptions<TRouter extends OpenApiRouter, TEvent extends APIGatewayEvent> = Pick<
  AWSLambdaOptions<TRouter, TEvent>,
  "router" | "createContext" | "responseMeta" | "onError"
>;

// Application Sectional || Define Helper Functions
// =================================================================================================
// =================================================================================================
const createMockNodeHTTPPath = (event: APIGatewayEvent) => {
  let path = getPath(event)
  if (!path.startsWith("/")) {
    path = `/${path}`
  }
  return path
}

// VERC: Handle the request
const createMockNodeHTTPRequest = (path: string, event: APIGatewayEvent): NodeHTTPRequest => {
  const url = event.requestContext.domainName
    ? `https://${event.requestContext.domainName}${path}`
    : path

  const method = getHTTPMethod(event).toUpperCase() as RequestMethod

  let body
  const contentType = event.headers[
    Object.keys(event.headers).find((key) => key.toLowerCase() === "content-type") ?? ""
  ]
  if (contentType === "application/json") {
    try {
      if (event.body) {
        body = JSON.parse(event.body)
      }
    } catch (cause) {
      throw new TRPCError({
        message: "Failed to parse request body",
        code: "PARSE_ERROR",
        cause
      })
    }
  }
  if (contentType === "application/x-www-form-urlencoded") {
    try {
      if (event.body) {
        const searchParamsString = event.isBase64Encoded
          ? Buffer.from(event.body, "base64").toString("utf-8")
          : event.body
        const searchParams = new URLSearchParams(searchParamsString)
        body = {} as Record<string, unknown>
        for (const [key, value] of searchParams.entries()) {
          body[key] = value
        }
      }
    } catch (cause) {
      throw new TRPCError({
        message: "Failed to parse request body",
        code: "PARSE_ERROR",
        cause
      })
    }
  }

  return createRequest({
    url,
    method,
    query: event.queryStringParameters || undefined,
    headers: event.headers,
    body
  })
}

// VERC: Handle the response
const createMockNodeHTTPResponse = () => {
  return createResponse({ eventEmitter: EventEmitter })
}

// Application Sectional || Define Export Handler
// =================================================================================================
// =================================================================================================
export const createOpenApiAwsLambdaHandler = <TRouter extends OpenApiRouter, TEvent extends APIGatewayEvent>(
  opts: CreateOpenApiAwsLambdaHandlerOptions<TRouter, TEvent>
) => {
  return async (event: TEvent, context: APIGWContext) => {
    let path: string | undefined
    try {
      if (!isPayloadV1(event) && !isPayloadV2(event)) {
        throw new TRPCError({
          message: UNKNOWN_PAYLOAD_FORMAT_VERSION_ERROR_MESSAGE,
          code: "INTERNAL_SERVER_ERROR"
        })
      }
      const createContext = async () => opts.createContext?.({ event, context })
      const openApiHttpHandler = createOpenApiNodeHttpHandler({ ...opts, createContext } as any)

      path = createMockNodeHTTPPath(event)
      const req = createMockNodeHTTPRequest(path, event)
      const res = createMockNodeHTTPResponse()

      // @ts-ignore - Expected Error: 'MockResponse<Response<any, Record<string, any>>>' is not assignable to parameter of type 'NodeHTTPResponse'.
      await openApiHttpHandler(req, res)

      return {
        statusCode: res.statusCode,
        headers: transformHeaders(res._getHeaders() || {}),
        body: res._getData()
      }
    } catch (cause) {
      const error = getErrorFromUnknown(cause)

      opts.onError?.({
        error,
        type: "unknown",
        path,
        input: undefined,
        ctx: undefined,
        req: event
      })

      const meta = opts.responseMeta?.({
        type: "unknown",
        paths: [path as unknown as string],
        ctx: undefined,
        data: [undefined as unknown as any],
        errors: [error]
      })

      const errorShape = opts.router.getErrorShape({
        error,
        type: "unknown",
        path,
        input: undefined,
        ctx: undefined
      })

      const statusCode = meta?.status ?? TRPC_ERROR_CODE_HTTP_STATUS[error.code] ?? 500
      const headers = { "content-type": "application/json", ...(meta?.headers ?? {}) }
      const body: OpenApiErrorResponse = {
        message: errorShape?.message ?? error.message ?? "An error occurred",
        code: error.code
      }

      return {
        statusCode,
        headers,
        body: JSON.stringify(body)
      }
    }
  }
}
