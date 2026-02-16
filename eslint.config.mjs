import { defineConfig, globalIgnores } from "eslint/config"
import eslint from "@eslint/js"
import tseslint from "typescript-eslint"
import nextPlugin from "@next/eslint-plugin-next"
import reactPlugin from "eslint-plugin-react"
import reactHooksPlugin from "eslint-plugin-react-hooks"

export default defineConfig([
  // Base JS rules
  eslint.configs.recommended,

  // TypeScript rules for all TS/TSX files
  ...tseslint.configs.recommended,

  // Global style rules
  {
    rules: {
      quotes: ["error", "double"],
      semi: ["error", "never"],
    },
  },

  // Next.js + React rules — scoped to Next.js project directories
  {
    files: [
      "apps/trpc-swagger-next/**/*.{ts,tsx,js,jsx}",
      "examples/example-next/**/*.{ts,tsx,js,jsx}",
    ],
    plugins: {
      "@next/next": nextPlugin,
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
    settings: {
      next: {
        rootDir: ["apps/trpc-swagger-next/", "examples/example-next/"],
      },
    },
  },

  // Global ignores
  globalIgnores([
    "**/out/**",
    "**/dist/**",
    "**/build/**",
    "**/node_modules/**",
    "**/.next/**",
    ".legacy/**",
  ]),
])
