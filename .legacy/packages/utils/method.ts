import { OpenApiMethod } from "../types"

// Application Sectional || Define Exports
// =================================================================================================
// =================================================================================================
export const acceptsRequestBody = (method: OpenApiMethod) => {
  return !(method === "GET" || method === "DELETE")
}
