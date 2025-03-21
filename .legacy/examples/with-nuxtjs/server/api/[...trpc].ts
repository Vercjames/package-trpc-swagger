import { createOpenApiNuxtHandler } from "trpc-swagger"

import { appRouter, createContext } from "../router"

export default createOpenApiNuxtHandler({
  router: appRouter,
  createContext
})
