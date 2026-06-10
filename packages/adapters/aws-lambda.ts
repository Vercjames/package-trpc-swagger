import { getErrorShape, TRPCError } from "@trpc/server"
import { AWSLambdaCreateContextFn } from "@trpc/server/adapters/aws-lambda"
import type { NodeHTTPRequest } from "@trpc/server/adapters/node-http"
import { EventEmitter } from "events"
import type { RequestMethod } from "node-mocks-http"
import { createRequest, createResponse } from "node-mocks-http"

// Application Sectional || Define Imports
// =================================================================================================
// =================================================================================================
import { HTTPErrorHandler, ResponseMetaFn, TRPCRequestInfo } from "@trpc/server/http"
import type { APIGatewayProxyEvent, APIGatewayProxyEventV2, APIGatewayProxyResult, APIGatewayProxyStructuredResultV2, Context as APIGWContext } from "aws-lambda"
import type { OpenApiErrorResponse, OpenApiRouter } from "../types"
import { TRPC_ERROR_CODE_HTTP_STATUS, getErrorFromUnknown } from "./node-http/errors"
import { createOpenApiNodeHttpHandler } from "./node-http/core"

type LambdaEvent = APIGatewayProxyEvent | APIGatewayProxyEventV2;

type inferAPIGWReturn<TEvent> = TEvent extends APIGatewayProxyEvent
  ? APIGatewayProxyResult
  : TEvent extends APIGatewayProxyEventV2
  ? APIGatewayProxyStructuredResultV2
  : never;

interface Processor<TEvent extends LambdaEvent> {
  getTRPCPath: (event: TEvent) => string;
  url(event: TEvent): Pick<URL, "hostname" | "pathname" | "search">;
  getHeaders: (event: TEvent) => Headers;
  getMethod: (event: TEvent) => string;
  toResult: (response: Response) => Promise<inferAPIGWReturn<TEvent>>;
}

const v1Processor: Processor<APIGatewayProxyEvent> = {
  // same as getPath above
  getTRPCPath: (event) => {
    if (!event.pathParameters) {
      // Then this event was not triggered by a resource denoted with {proxy+}
      return event.path.split("/").pop() ?? ""
    }
    const matches = event.resource.matchAll(/\{(.*?)\}/g)
    for (const match of matches) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const group = match[1]
      if (group.includes("+") && event.pathParameters) {
        return event.pathParameters[group.replace("+", "")] ?? ""
      }
    }
    return event.path.slice(1)
  },
  url(event) {
    const hostname: string = event.requestContext.domainName
      ?? event.headers.host
      ?? event.multiValueHeaders?.host?.[0]
      ?? "localhost"

    const searchParams = new URLSearchParams()

    for (const [key, value] of Object.entries(
      event.queryStringParameters ?? {}
    )) {
      if (value !== undefined) {
        searchParams.append(key, value)
      }
    }
    const qs = searchParams.toString()
    return {
      hostname,
      pathname: event.path,
      search: qs && `?${qs}`
    }
  },
  getHeaders: (event) => {
    const headers = new Headers()
    for (const [key, value] of Object.entries(event.headers ?? {})) {
      if (value !== undefined) {
        headers.append(key, value)
      }
    }

    for (const [k, values] of Object.entries(event.multiValueHeaders ?? {})) {
      if (values) {
        values.forEach((v) => headers.append(k, v))
      }
    }

    return headers
  },
  getMethod: (event) => event.httpMethod,
  toResult: async (response) => {
    const { headers, cookies } = getHeadersAndCookiesFromResponse(response)

    const result: APIGatewayProxyResult = {
      ...(cookies.length && { multiValueHeaders: { "set-cookie": cookies } }),
      statusCode: response.status,
      body: await response.text(),
      headers
    }

    return result
  }
}

function splitSetCookieString(
  cookiesString: string | string[]
): string[] {
  if (Array.isArray(cookiesString)) {
    return cookiesString.flatMap((c) => splitSetCookieString(c))
  }

  if (typeof cookiesString !== "string") {
    return []
  }

  const cookiesStrings: string[] = []
  let pos: number = 0
  let start: number
  let ch: string
  let lastComma: number
  let nextStart: number
  let cookiesSeparatorFound: boolean

  const skipWhitespace = () => {
    while (pos < cookiesString.length && /\s/.test(cookiesString.charAt(pos))) {
      pos += 1
    }
    return pos < cookiesString.length
  }

  const notSpecialChar = () => {
    ch = cookiesString.charAt(pos)
    return ch !== "=" && ch !== ";" && ch !== ","
  }

  while (pos < cookiesString.length) {
    start = pos
    cookiesSeparatorFound = false

    while (skipWhitespace()) {
      ch = cookiesString.charAt(pos)
      if (ch === ",") {
        // ',' is a cookie separator if we have later first '=', not ';' or ','
        lastComma = pos
        pos += 1

        skipWhitespace()
        nextStart = pos

        while (pos < cookiesString.length && notSpecialChar()) {
          pos += 1
        }

        // currently special character
        if (pos < cookiesString.length && cookiesString.charAt(pos) === "=") {
          // we found cookies separator
          cookiesSeparatorFound = true
          // pos is inside the next cookie, so back up and return it.
          pos = nextStart
          cookiesStrings.push(cookiesString.slice(start, lastComma))
          start = pos
        } else {
          // in param ',' or param separator ';',
          // we continue from that comma
          pos = lastComma + 1
        }
      } else {
        pos += 1
      }
    }

    if (!cookiesSeparatorFound || pos >= cookiesString.length) {
      cookiesStrings.push(cookiesString.slice(start))
    }
  }

  return cookiesStrings
}

function getHeadersAndCookiesFromResponse(response: Response) {
  const headers = Object.fromEntries(response.headers.entries())

  const cookies: string[] = splitSetCookieString(
    response.headers.getSetCookie()
  ).map((cookie) => cookie.trim())

  delete headers["set-cookie"]

  return { headers, cookies }
}

const v2Processor: Processor<APIGatewayProxyEventV2> = {
  getTRPCPath: (event) => {
    const matches = event.routeKey.matchAll(/\{(.*?)\}/g)
    for (const match of matches) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const group = match[1]
      if (group.includes("+") && event.pathParameters) {
        return event.pathParameters[group.replace("+", "")] ?? ""
      }
    }
    return event.rawPath.slice(1)
  },
  url(event) {
    return {
      hostname: event.requestContext.domainName,
      pathname: event.rawPath,
      search: event.rawQueryString && `?${event.rawQueryString}`
    }
  },
  getHeaders: (event) => {
    const headers = new Headers()
    for (const [key, value] of Object.entries(event.headers ?? {})) {
      if (value !== undefined) {
        headers.append(key, value)
      }
    }

    if (event.cookies) {
      headers.append("cookie", event.cookies.join("; "))
    }
    return headers
  },
  getMethod: (event) => event.requestContext.http.method,
  toResult: async (response) => {
    const { headers, cookies } = getHeadersAndCookiesFromResponse(response)

    const result: APIGatewayProxyStructuredResultV2 = {
      cookies,
      statusCode: response.status,
      body: await response.text(),
      headers
    }

    return result
  }
}

function determinePayloadFormat(event: LambdaEvent): string {
  // https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-develop-integrations-lambda.html
  // According to AWS support, version is is extracted from the version property in the event.
  // If there is no version property, then the version is implied as 1.0
  const unknownEvent = event as { version?: string }
  if (typeof unknownEvent.version === "undefined") {
    return "1.0"
  }
  return unknownEvent.version
}

function getPlanner<TEvent extends LambdaEvent>(event: TEvent) {
  const version = determinePayloadFormat(event)
  let processor: Processor<TEvent>
  switch (version) {
    case "1.0":
      processor = v1Processor as Processor<TEvent>
      break
    case "2.0":
      processor = v2Processor as Processor<TEvent>
      break
    default:
      throw new Error(`Unsupported version: ${version}`)
  }

  const urlParts = processor.url(event)
  const url = `https://${urlParts.hostname}${urlParts.pathname}${urlParts.search}`

  const init: RequestInit = {
    headers: processor.getHeaders(event),
    method: processor.getMethod(event),
    // @ts-expect-error this is fine
    duplex: "half"
  }
  if (event.body) {
    init.body = event.isBase64Encoded
      ? Buffer.from(event.body, "base64")
      : event.body
  }

  const request = new Request(url, init)

  return {
    path: processor.getTRPCPath(event),
    request,
    toResult: processor.toResult
  }
}

// Application Sectional || Define Export Type
// =================================================================================================
// =================================================================================================
export type AWSHandlerOptionsWrapper<TRouter extends OpenApiRouter, TEvent extends LambdaEvent> =
  | {
    router: TRouter;
    batching?: {
      enabled: boolean;
    };
    onError?: HTTPErrorHandler<TRouter, TEvent>;
    responseMeta?: ResponseMetaFn<TRouter>;
  } & (
    | {
      createContext?: AWSLambdaCreateContextFn<TRouter, TEvent>;
    }
  );

export type CreateOpenApiAwsLambdaHandlerOptions<TRouter extends OpenApiRouter, TEvent extends LambdaEvent> = Pick<
  AWSHandlerOptionsWrapper<TRouter, TEvent>,
  "router" | "createContext" | "responseMeta" | "onError"
>;

// Application Sectional || Define Helper Functions
// =================================================================================================
// =================================================================================================
const createMockNodeHTTPPath = (event: LambdaEvent) => {
  const planner = getPlanner(event)
  let { path } = planner
  if (!path.startsWith("/")) {
    path = `/${path}`
  }
  return path
}

// VERC: Handle the request
const createMockNodeHTTPRequest = (path: string, event: LambdaEvent): NodeHTTPRequest => {
  const url = event.requestContext.domainName
    ? `https://${event.requestContext.domainName}${path}`
    : path

  const planner = getPlanner(event)
  const method = planner.request.method.toUpperCase() as RequestMethod

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
  }) as NodeHTTPRequest
}

// VERC: Handle the response
const createMockNodeHTTPResponse = () => {
  return createResponse({ eventEmitter: EventEmitter })
}

// Application Sectional || Define Export Handler
// =================================================================================================
// =================================================================================================
export const createOpenApiAwsLambdaHandler = <TRouter extends OpenApiRouter, TEvent extends LambdaEvent>(
  opts: CreateOpenApiAwsLambdaHandlerOptions<TRouter, TEvent>
) => {
  return async (event: TEvent, context: APIGWContext) => {
    let path: string | undefined
    const info = {
      accept: "application/jsonl",
      type: "unknown",
      isBatchCall: false,
      calls: [],
      connectionParams: null,
      signal: new AbortController().signal,
      url: null
    } as TRPCRequestInfo
    try {
      const createContext = async () => opts.createContext?.({
        event,
        context,
        info
      })
      const openApiHttpHandler = createOpenApiNodeHttpHandler({ ...opts, createContext } as any)

      path = createMockNodeHTTPPath(event)
      const req = createMockNodeHTTPRequest(path, event)
      const res = createMockNodeHTTPResponse()

      // @ts-ignore - Expected Error: 'MockResponse<Response<any, Record<string, any>>>' is not assignable to parameter of type 'NodeHTTPResponse'.
      await openApiHttpHandler(req, res)

      return {
        statusCode: res.statusCode,
        headers: res._getHeaders(),
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
        errors: [error],
        info,
        eagerGeneration: false
      })

      // TODO: This is deprecated but the called out funciton of getTRPCErrorShape is not found
      const errorShape = getErrorShape({
        config: opts.router._def._config,
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
