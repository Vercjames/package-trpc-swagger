import { H3Event } from "h3"
import { jest } from "@jest/globals"
import { initTRPC } from "@trpc/server"
import httpMocks, { RequestMethod } from "node-mocks-http"
import { z } from "zod"

// Application Sectional || Define Imports
// =================================================================================================
// =================================================================================================
import { CreateOpenApiNuxtHandlerOptions, OpenApiMeta, OpenApiResponse, OpenApiRouter, createOpenApiNuxtHandler } from "../../packages"

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
const createOpenApiNuxtHandlerCaller = <TRouter extends OpenApiRouter>(
  handlerOpts: CreateOpenApiNuxtHandlerOptions<TRouter>
) => {
  const openApiNuxtHandler = createOpenApiNuxtHandler({
    router: handlerOpts.router,
    createContext: handlerOpts.createContext ?? createContextMock,
    responseMeta: handlerOpts.responseMeta ?? responseMetaMock,
    onError: handlerOpts.onError ?? onErrorMock
  } as never)

  /* eslint-disable-next-line @typescript-eslint/no-misused-promises, no-async-promise-executor */
  return (req: {
    method: RequestMethod;
    params: Record<string, string>;
    url?: string;
    body?: any;
  }) =>
    new Promise<{
      statusCode: number;
      headers: Record<string, any>;
      body: OpenApiResponse | undefined;
      /* eslint-disable-next-line @typescript-eslint/no-misused-promises, no-async-promise-executor */
    }>(async (resolve, reject) => {
      const headers = new Map()
      let body: any

      const res: any = {
        statusCode: undefined,
        setHeader: (key: string, value: any) => headers.set(key, value),
        end: (data: string) => {
          body = JSON.parse(data)
        }
      }

      const mockReq = httpMocks.createRequest({
        body: req.body,
        method: req.method,
        url: req.url
      })
      const mockRes = httpMocks.createResponse({
        req: mockReq
      })
      mockRes.setHeader = res.setHeader
      mockRes.end = res.end
      const event = new H3Event(mockReq, mockRes)
      event.context.params = req.params
      try {
        await openApiNuxtHandler(event)
        resolve({
          statusCode: mockRes.statusCode,
          headers,
          body
        })
      } catch (error) {
        reject(error)
      }
    })
}

// Application Sectional || Define Test Scripts
// =================================================================================================
// =================================================================================================
describe("nuxt adapter", () => {
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

    const openApiNuxtHandlerCaller = createOpenApiNuxtHandlerCaller(
      { router: appRouter }
    )

    {
      const res = await openApiNuxtHandlerCaller({
        method: "GET",
        params: { trpc: "say-hello" },
        url: "/api/say-hello?name=Verc"
      })

      expect(res.statusCode).toBe(200)
      expect(res.body).toEqual({ greeting: "Hello Verc!" })
      expect(createContextMock).toHaveBeenCalledTimes(1)
      expect(responseMetaMock).toHaveBeenCalledTimes(1)
      expect(onErrorMock).toHaveBeenCalledTimes(0)

      clearMocks()
    }
    {
      const res = await openApiNuxtHandlerCaller({
        method: "POST",
        params: { trpc: "say-hello" },
        body: { name: "Verc" }
      })

      expect(res.statusCode).toBe(200)
      expect(res.body).toEqual({ greeting: "Hello Verc!" })
      expect(createContextMock).toHaveBeenCalledTimes(1)
      expect(responseMetaMock).toHaveBeenCalledTimes(1)
      expect(onErrorMock).toHaveBeenCalledTimes(0)

      clearMocks()
    }
    {
      const res = await openApiNuxtHandlerCaller({
        method: "GET",
        params: { trpc: "say/hello" },
        url: "/api/say/hello?name=Verc"
      })

      expect(res.statusCode).toBe(200)
      expect(res.body).toEqual({ greeting: "Hello Verc!" })
      expect(createContextMock).toHaveBeenCalledTimes(1)
      expect(responseMetaMock).toHaveBeenCalledTimes(1)
      expect(onErrorMock).toHaveBeenCalledTimes(0)
    }
  })

  test("with invalid path", async () => {
    const appRouter = t.router({})

    const openApiNuxtHandlerCaller = createOpenApiNuxtHandlerCaller(
      { router: appRouter }
    )

    const res = await openApiNuxtHandlerCaller({
      method: "GET",
      params: {}
    })

    expect(res.statusCode).toBe(500)
    expect(res.body).toEqual({
      message: "Query \"trpc\" not found - is the `trpc-swagger` file named `[...trpc].ts`?",
      code: "INTERNAL_SERVER_ERROR"
    })
    expect(createContextMock).toHaveBeenCalledTimes(0)
    expect(responseMetaMock).toHaveBeenCalledTimes(0)
    expect(onErrorMock).toHaveBeenCalledTimes(1)
  })
})
