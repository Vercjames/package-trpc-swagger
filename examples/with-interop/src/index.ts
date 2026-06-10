import { initTRPC } from "@trpc/server"
import { OpenApiMeta } from "trpc-swagger"
import { z } from "zod"

const t = initTRPC.meta<OpenApiMeta>().create()

export const appRouter = t.router({
  echo: t.procedure
    .meta({ openapi: { enabled: true, method: "GET", path: "/echo" } })
    .input(z.object({ payload: z.string() }))
    .output(z.object({ payload: z.string() }))
    .query(({ input }) => input)
})

export type AppRouter = typeof appRouter

// Now add your `@trpc/server` && `trpc-swagger` handlers...
