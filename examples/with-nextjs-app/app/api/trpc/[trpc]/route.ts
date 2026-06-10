import { fetchRequestHandler } from "@trpc/server/adapters/fetch"
import { appRouter, createContext } from "@/server/router"

// Application Component || Define Handler
// =================================================================================================
// =================================================================================================
const handler = (req: Request) => {
  // Handle incoming tRPC requests
  return fetchRequestHandler({
    req,
    endpoint: "/api/trpc",
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
