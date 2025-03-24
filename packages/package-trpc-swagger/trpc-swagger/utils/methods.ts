import { TOpenApiMethod} from "../types"

// Application Sectional || Define Exports
// =======================================================================================
// =======================================================================================
export const acceptsRequestBody = (method: TOpenApiMethod) => {
  return !(method === "GET" || method === "DELETE")
}
