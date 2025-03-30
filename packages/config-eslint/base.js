const { resolve } = require("node:path");
const project = resolve(process.cwd(), "tsconfig.json");

// Application Structure || Define Exports
// =======================================================================================
/** @type {import("eslint").Linter.Config} ============================================ */
module.exports = {
  extends: [
    "eslint:recommended",
    "turbo",
    "airbnb"
  ],
  plugins: [
    "import-newlines"
  ],
  globals: {
    React: true,
    JSX: true,
  },
  env: {
    node: true,
  },
  settings: {
    "import/resolver": {
      typescript: {
        project,
      },
    },
  },
  ignorePatterns: [
    ".*.js",
    "out/",
    "dist/",
    "build/",
    "node_modules/",
  ],
  overrides: [
    {
      files: ["*.js?(x)", "*.ts?(x)"],
    },
  ],
  rules: {
    "no-var": ["error"],
    "no-tabs": ["error"],
    "comma-spacing": ["error"],
    "semi": ["error", "never"],
  }
};
