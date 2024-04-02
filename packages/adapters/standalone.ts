import { IncomingMessage, ServerResponse } from "http"

// Application Sectional || Define Imports
// =================================================================================================
// =================================================================================================
import { OpenApiRouter } from "../types"
import { CreateOpenApiNodeHttpHandlerOptions, createOpenApiNodeHttpHandler } from "./node-http/core"

// Application Sectional || Define Export Type
// =================================================================================================
// =================================================================================================
export type CreateOpenApiHttpHandlerOptions<TRouter extends OpenApiRouter> =
// @ts-ignore - Expected Error: 'MockResponse<Response<any, Record<string, any>>>' is not assignable to parameter of type 'NodeHTTPResponse'.
  CreateOpenApiNodeHttpHandlerOptions<TRouter, IncomingMessage, ServerResponse>;

// Application Sectional || Define Export Handler
// =================================================================================================
// =================================================================================================
export const createOpenApiHttpHandler = <TRouter extends OpenApiRouter>(
  opts: CreateOpenApiHttpHandlerOptions<TRouter>
) => {
  const openApiHttpHandler = createOpenApiNodeHttpHandler(opts)
  return async (req: IncomingMessage, res: ServerResponse) => {
    await openApiHttpHandler(req, res)
  }
}
