import { AnyRouter } from "@trpc/server"
import { FastifyInstance } from "fastify"

// Application Sectional || Define Imports
// =================================================================================================
// =================================================================================================
import { OpenApiRouter } from "../types"
import { CreateOpenApiNodeHttpHandlerOptions, createOpenApiNodeHttpHandler } from "./node-http/core"

// Application Sectional || Define Export Type
// =================================================================================================
// =================================================================================================
export type CreateOpenApiFastifyPluginOptions<TRouter extends OpenApiRouter> =
  CreateOpenApiNodeHttpHandlerOptions<TRouter, any, any> & {
    basePath?: `/${string}`;
  };

// Application Sectional || Define Export Handler
// =================================================================================================
// =================================================================================================
export function fastifyTRPCOpenApiPlugin<TRouter extends AnyRouter>(
  fastify: FastifyInstance,
  opts: CreateOpenApiFastifyPluginOptions<TRouter>,
  done: (err?: Error) => void
) {
  let prefix = opts.basePath ?? ""

  // if prefix ends with a slash, remove it
  if (prefix.endsWith("/")) {
    prefix = prefix.slice(0, -1)
  }

  const openApiHttpHandler = createOpenApiNodeHttpHandler(opts)

  fastify.all(`${prefix}/*`, async (request, reply) => {
    const prefixRemovedFromUrl = request.url.replace(fastify.prefix, "").replace(prefix, "")
    request.raw.url = prefixRemovedFromUrl
    return openApiHttpHandler(
      request,
      Object.assign(reply, {
        setHeader: (key: string, value: string | number | readonly string[]) => {
          if (Array.isArray(value)) {
            value.forEach((v) => reply.header(key, v))
            return reply
          }

          return reply.header(key, value)
        },
        end: (body: any) => reply.send(body) // eslint-disable-line @typescript-eslint/no-explicit-any
      })
    )
  })

  done()
}
