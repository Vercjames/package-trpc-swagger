import { existsSync } from "fs"
import { script } from "chalk-scripts"

// Application Component || Define Setup
// =================================================================================================
// =================================================================================================
const buildFolder = "./build"

// Application Component || Define Tests
// =================================================================================================
// =================================================================================================
if (!existsSync(buildFolder)) {
  (async () => {
    const c = await script.start({ func: "prepublishOnly()" })
    script.config(c).mistake("build folder does not exist").log()
    process.exit(1)
  })()
}
