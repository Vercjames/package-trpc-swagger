import { createOpenApiFetchHandler } from "trpc-swagger"
import { appRouter, createContext } from "@/server/router"

// Application Component || Define Handler
// =================================================================================================
// =================================================================================================
const handler = (req: Request) => {
  // Handle incoming swagger/openapi requests
  return createOpenApiFetchHandler({
    req,
    endpoint: "/api",
    router: appRouter,
    // createContext: () => { return {} },
    createContext
  })
}
// Application Component || Define Exports
// =================================================================================================
// =================================================================================================
export {
  handler as GET,
  handler as POST
}
