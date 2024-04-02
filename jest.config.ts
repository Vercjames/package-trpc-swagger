module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  rootDir: "./tests",
  snapshotFormat: {
    escapeString: true,
    printBasicPrototype: true
  }
}
