import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    ".": "trpc-swagger/index.ts",
  },
  banner: {
    js: "'use client'",
  },
  format: ["cjs", "esm"],
  external: ["react", "@trpc/client", "@trpc/server", "zod"],
  dts: true,
})
