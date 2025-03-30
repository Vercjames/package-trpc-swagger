import { TOpenApiMethod } from "../types"

// Application Sectional || Define Exports
// =======================================================================================
// =======================================================================================
export const shouldIncludeRequestBody = (method: TOpenApiMethod): boolean => {
  return !(method === "GET" || method === "DELETE")
}
