import fetch from "node-fetch"
import fastify from "fastify"
import { jest } from "@jest/globals"
import { initTRPC } from "@trpc/server"
import { z } from "zod"

// Application Sectional || Define Imports
// =================================================================================================
// =================================================================================================
import { CreateOpenApiFastifyPluginOptions, OpenApiMeta, OpenApiRouter, fastifyTRPCOpenApiPlugin } from "../../packages"

// Application Sectional || Define Instance
// =================================================================================================
// =================================================================================================
const t = initTRPC.meta<OpenApiMeta>().context<any>().create()

// Application Sectional || Define Functions
// =================================================================================================
// =================================================================================================
const createContextMock = jest.fn()
const responseMetaMock = jest.fn()
const onErrorMock = jest.fn()

const clearMocks = () => {
  createContextMock.mockClear()
  responseMetaMock.mockClear()
  onErrorMock.mockClear()
}

// Application Sectional || Define Router Server
// =================================================================================================
// =================================================================================================
const createFastifyServerWithRouter = async <TRouter extends OpenApiRouter>(
  handler: CreateOpenApiFastifyPluginOptions<TRouter>,
  opts?: {
    serverOpts?: { basePath?: `/${string}` };
    prefix?: string;
  }
) => {
  const server = fastify()

  const openApiFastifyPluginOptions: any = {
    router: handler.router,
    createContext: handler.createContext ?? createContextMock,
    responseMeta: handler.responseMeta ?? responseMetaMock,
    onError: handler.onError ?? onErrorMock,
    maxBodySize: handler.maxBodySize,
    basePath: opts?.serverOpts?.basePath
  }

  await server.register(
    async (server) => {
      await server.register(fastifyTRPCOpenApiPlugin, openApiFastifyPluginOptions)
    },
    { prefix: opts?.prefix ?? "" }
  )

  const port = 0
  const url = await server.listen({ port })

  return {
    url,
    close: () => server.close()
  }
}

// Application Sectional || Define Test Scripts
// =================================================================================================
// =================================================================================================
describe("fastify adapter", () => {
  afterEach(() => {
    clearMocks()
  })

  test("with valid routes", async () => {
    const appRouter = t.router({
      sayHelloQuery: t.procedure
        .meta({ openapi: { method: "GET", path: "/say-hello" } })
        .input(z.object({ name: z.string() }))
        .output(z.object({ greeting: z.string() }))
        .query(({ input }) => ({ greeting: `Hello ${input.name}!` })),
      sayHelloMutation: t.procedure
        .meta({ openapi: { method: "POST", path: "/say-hello" } })
        .input(z.object({ name: z.string() }))
        .output(z.object({ greeting: z.string() }))
        .mutation(({ input }) => ({ greeting: `Hello ${input.name}!` })),
      sayHelloSlash: t.procedure
        .meta({ openapi: { method: "GET", path: "/say/hello" } })
        .input(z.object({ name: z.string() }))
        .output(z.object({ greeting: z.string() }))
        .query(({ input }) => ({ greeting: `Hello ${input.name}!` }))
    })

    const { url, close } = await createFastifyServerWithRouter(
      {
        router: appRouter,
        createContext: undefined,
        responseMeta: undefined,
        onError: undefined,
        maxBodySize: undefined
      }
    )

    {
      const res = await fetch(`${url}/say-hello?name=Verc`, { method: "GET" })
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body).toEqual({ greeting: "Hello Verc!" })
      expect(createContextMock).toHaveBeenCalledTimes(1)
      expect(responseMetaMock).toHaveBeenCalledTimes(1)
      expect(onErrorMock).toHaveBeenCalledTimes(0)

      clearMocks()
    }
    {
      const res = await fetch(`${url}/say-hello`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Verc" })
      })
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body).toEqual({ greeting: "Hello Verc!" })
      expect(createContextMock).toHaveBeenCalledTimes(1)
      expect(responseMetaMock).toHaveBeenCalledTimes(1)
      expect(onErrorMock).toHaveBeenCalledTimes(0)

      clearMocks()
    }
    {
      const res = await fetch(`${url}/say/hello?name=Verc`, { method: "GET" })
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body).toEqual({ greeting: "Hello Verc!" })
      expect(createContextMock).toHaveBeenCalledTimes(1)
      expect(responseMetaMock).toHaveBeenCalledTimes(1)
      expect(onErrorMock).toHaveBeenCalledTimes(0)
    }

    await close()
  })

  test("with basePath", async () => {
    const appRouter = t.router({
      echo: t.procedure
        .meta({ openapi: { method: "GET", path: "/echo" } })
        .input(z.object({ payload: z.string() }))
        .output(z.object({ payload: z.string(), context: z.undefined() }))
        .query(({ input }) => ({ payload: input.payload }))
    })

    const { url, close } = await createFastifyServerWithRouter(
      {
        router: appRouter,
        createContext: undefined,
        responseMeta: undefined,
        onError: undefined,
        maxBodySize: undefined
      },
      { serverOpts: { basePath: "/open-api" } }
    )

    const res = await fetch(`${url}/open-api/echo?payload=James`, { method: "GET" })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toEqual({
      payload: "James"
    })
    expect(createContextMock).toHaveBeenCalledTimes(1)
    expect(responseMetaMock).toHaveBeenCalledTimes(1)
    expect(onErrorMock).toHaveBeenCalledTimes(0)

    await close()
  })

  test("with prefix", async () => {
    const appRouter = t.router({
      echo: t.procedure
        .meta({ openapi: { method: "GET", path: "/echo" } })
        .input(z.object({ payload: z.string() }))
        .output(z.object({ payload: z.string(), context: z.undefined() }))
        .query(({ input }) => ({ payload: input.payload }))
    })

    const { url, close } = await createFastifyServerWithRouter(
      {
        router: appRouter,
        createContext: undefined,
        responseMeta: undefined,
        onError: undefined,
        maxBodySize: undefined
      },
      { prefix: "/api-prefix" }
    )

    const res = await fetch(`${url}/api-prefix/echo?payload=James`, {
      method: "GET"
    })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toEqual({
      payload: "James"
    })
    expect(createContextMock).toHaveBeenCalledTimes(1)
    expect(responseMetaMock).toHaveBeenCalledTimes(1)
    expect(onErrorMock).toHaveBeenCalledTimes(0)

    await close()
  })
})
