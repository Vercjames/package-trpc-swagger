# TRPC-Swagger Specification

## 1. High-Level Concept Clarification

What you are really building is three things, not one:

### Core Library (`trpc-swagger`)

- Reads tRPC router definitions
- Maps procedures to REST semantics
- Generates OpenAPI / Swagger spec
- Optionally provides runtime adapters (Express / Next / Fetch / etc.)

### Example / Playground Apps

- Show real integrations
- Serve as regression tests
- Prevent breaking changes

### Branding / Docs / Website

- Documentation
- Interactive Swagger viewer
- Possibly LLM helpers

> Treat these as separate packages inside one monorepo.

---

## 2. Recommended Monorepo Layout (npm workspaces)

A clean structure:

```
/package.json              (workspace root)

apps/
  website/                 ← Next.js marketing & documentation site
  
assets/                     (workspace graphics)
 
examples/
  example-next/
  example-express/
  example-fastify/
  
packages/
  trpc-swagger/            ← Core NPM package (IMPORTANT)
  trpc-swagger-next/       ← Optional adapter for Next.js
  trpc-swagger-express/    ← Optional Express adapter
  trpc-swagger-cli/        ← CLI generator (very valuable)
```

**Why this matters:**

- Core stays framework-agnostic
- Adapters evolve independently
- Examples double as regression tests
- App builds don't pollute library deps

---

## 3. Core Library Responsibilities

Your core package should **NOT** depend on servers. It should only:

- Understand tRPC router metadata
- Extract procedure definitions
- Convert input/output schemas to OpenAPI
- Provide a spec generator

```ts
import { generateOpenApiDocument } from "trpc-swagger";

const doc = generateOpenApiDocument({
  router,
  title: "My API",
  version: "1.0.0",
});
```
