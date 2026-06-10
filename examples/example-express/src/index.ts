import { VERSION } from "trpc-swagger"
import express from "express"

const app = express()
const port = 3002

app.get("/", (_req, res) => {
  res.json({ message: `rawr example-express is running ${VERSION}` })
})

app.listen(port, () => {
  console.log(`trpc-swagger v${VERSION}`)
  console.log(`Express server listening on http://localhost:${port}`)
})
