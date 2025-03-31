/** Application Structure || Define Exports
 ** =================================================================================== */
/** @type {import("eslint").Linter.Config} ============================================ */
module.exports = {
  extends: [
    "@repo/eslint-config/eslint.js",
    require.resolve("@vercel/style-guide/eslint/next"),
  ],
  globals: {
    React: true,
    JSX: true,
  },
  env: {
    node: true,
  },
  rules: {
    "react/jsx-filename-extension": [1, { "extensions": [".js", ".jsx", ".ts", ".tsx"] }],
  }
}
