/** Application Structure || Define Modules
 ** =================================================================================== */
/** @type {import("eslint").Linter.Config} ============================================ */
module.exports = {
  extends: ["@repo/eslint-config/nextjs.js"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: true,
  },
}

