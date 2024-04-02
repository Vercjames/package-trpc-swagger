import { Request, Response } from "express"

// Application Sectional || Define Imports
// =================================================================================================
// =================================================================================================
import { OpenApiRouter } from "../types"
import { CreateOpenApiNodeHttpHandlerOptions, createOpenApiNodeHttpHandler } from "./node-http/core"

// Application Sectional || Define Export Type
// =================================================================================================
// =================================================================================================
export type CreateOpenApiExpressMiddlewareOptions<TRouter extends OpenApiRouter> =
  // @ts-ignore - Expected Error: 'MockResponse<Response<any, Record<string, any>>>' is not assignable to parameter of type 'NodeHTTPResponse'.
  CreateOpenApiNodeHttpHandlerOptions<TRouter, Request, Response>;

// Application Sectional || Define Export Handler
// =================================================================================================
// =================================================================================================
export const createOpenApiExpressMiddleware = <TRouter extends OpenApiRouter>(
  opts: CreateOpenApiExpressMiddlewareOptions<TRouter>
) => {
  const openApiHttpHandler = createOpenApiNodeHttpHandler(opts)

  return async (req: Request, res: Response) => {
    await openApiHttpHandler(req, res)
  }
}
