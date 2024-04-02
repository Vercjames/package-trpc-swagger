import { TRPCError } from "@trpc/server"
import { NodeHTTPRequest } from "@trpc/server/dist/adapters/node-http"
import parse from "co-body"

export const getQuery = (req: NodeHTTPRequest, url: URL): Record<string, string> => {
  const query: Record<string, string> = {}

  if (!req.query) {
    const parsedQs: Record<string, string[]> = {}
    url.searchParams.forEach((value, key) => {
      if (!parsedQs[key]) {
        parsedQs[key] = []
      }
      parsedQs[key]!.push(value)
    })
    req.query = parsedQs
  }

  // normalize first value in array
  Object.keys(req.query).forEach((key) => {
    const value = req.query![key]
    if (Array.isArray(value)) {
      // Destructure to get the first element of the array
      const [firstValue] = value
      // Check if the first value is a string and assign it to query
      if (typeof firstValue === "string") {
        query[key] = firstValue
      }
    } else if (typeof value === "string") {
      // Directly assign the string value to query
      query[key] = value
    }
  })

  return query
}

const BODY_100_KB = 100000
export const getBody = async (req: NodeHTTPRequest, maxBodySize = BODY_100_KB): Promise<any> => {
  if ("body" in req) {
    return req.body
  }

  req.body = undefined

  const contentType = req.headers["content-type"]
  if (contentType === "application/json" || contentType === "application/x-www-form-urlencoded") {
    try {
      const { raw, parsed } = await parse(req, {
        limit: maxBodySize,
        strict: false,
        returnRawBody: true
      })
      req.body = raw ? parsed : undefined
    } catch (cause) {
      if (cause instanceof Error && cause.name === "PayloadTooLargeError") {
        throw new TRPCError({
          message: "Request body too large",
          code: "PAYLOAD_TOO_LARGE",
          cause
        })
      }

      let errorCause: Error | undefined
      if (cause instanceof Error) {
        errorCause = cause
      }

      throw new TRPCError({
        message: "Failed to parse request body",
        code: "PARSE_ERROR",
        cause: errorCause
      })
    }
  }

  return req.body
}
