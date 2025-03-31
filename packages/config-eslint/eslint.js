const { resolve } = require("node:path");
const project = resolve(process.cwd(), "tsconfig.json");

/** Application Structure || Define Exports
/** =================================================================================== */
/** @type {import("eslint").Linter.Config} ============================================ */
module.exports = {
  env: {
    node: true,
  },
  extends: [
    "eslint:recommended",
    "airbnb"
  ],
  plugins: [
    "import-newlines"
  ],
  settings: {
    "import/resolver": {
      typescript: {
        project,
      },
    },
  },
  ignorePatterns: [
    "out/",
    "dist/",
    "build/",
    "node_modules/",
  ],
  overrides: [{
    files: ["*.js?(x)", "*.ts?(x)"],
  }],
  rules: {
    "no-var": ["error"],
    "no-tabs": ["error"],
    "comma-spacing": ["error"],
    "semi": ["error", "never"],
    "quotes": ["error", "double"],
    // NOTE: "_" function variables use this unused placeholder
    "no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],
    "import/prefer-default-export": ["off"],
    // NOTE: Typologies are often placed at the bottom of the file
    "no-use-before-define": ["off"],
    "object-curly-newline": ["off"],
    "no-underscore-dangle": ["off"],
    "import/extensions": ["off"],
    "arrow-body-style": ["off"],
    "max-len": ["off"]
  }
};
