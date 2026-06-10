import { TRPCError } from "@trpc/server"

export const TRPC_ERROR_CODE_HTTP_STATUS: Record<TRPCError["code"], number> = {
  PARSE_ERROR: 400,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  PAYMENT_REQUIRED: 402,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_SUPPORTED: 405,
  TIMEOUT: 408,
  CONFLICT: 409,
  PRECONDITION_FAILED: 412,
  PAYLOAD_TOO_LARGE: 413,
  UNSUPPORTED_MEDIA_TYPE: 415,
  UNPROCESSABLE_CONTENT: 422,
  PRECONDITION_REQUIRED: 428,
  TOO_MANY_REQUESTS: 429,
  CLIENT_CLOSED_REQUEST: 499,

  // Server Errors
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
}

export function getErrorFromUnknown(cause: unknown): TRPCError {
  if (cause instanceof Error && cause.name === "TRPCError") {
    return cause as TRPCError
  }

  let errorCause: Error | undefined
  let stack: string | undefined

  if (cause instanceof Error) {
    errorCause = cause
    stack = cause.stack
  }

  const error = new TRPCError({
    message: "Internal server error",
    code: "INTERNAL_SERVER_ERROR",
    cause: errorCause
  })

  if (stack) {
    error.stack = stack
  }

  return error
}
