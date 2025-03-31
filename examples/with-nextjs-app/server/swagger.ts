import { generateOpenApiDocument } from "@repo/trpc-swagger"

// Application Component || Define Imports
// =======================================================================================
// =======================================================================================
// import { appRouter } from "./router"

// Application Component || Define Exports
// =======================================================================================
// Generate OpenAPI JSON schema ==========================================================
export const swaggerDocument = generateOpenApiDocument({
  options: {
    title: "Example CRUD API",
    description: "OpenAPI compliant REST API built using tRPC with Next.js",
    version: "1.0.0",
    baseUrl: "http://localhost:3000/api",
    docsUrl: "https://github.com/vercjames/package-trpc-swagger",
    tags: ["auth", "users", "posts"],
  },
})
