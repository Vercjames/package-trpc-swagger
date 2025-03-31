/** Application Structure || Define Exports
 ** =================================================================================== */
/** @type {import("eslint").Linter.Config} ============================================ */
module.exports = {
  extends: ["@repo/eslint-config/eslint.js"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: true,
  },
}

