import type { JestConfigWithTsJest } from "ts-jest"

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const jestConfig: JestConfigWithTsJest = {
  preset: "ts-jest",
  rootDir: "./tests",
  testEnvironment: "node",
  snapshotFormat: {
    escapeString: true,
    printBasicPrototype: true
  }
}

// Export the configuration to be used by Jest
export default jestConfig
