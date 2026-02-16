import express from "express"

const app = express()
const port = 3001

app.get("/", (_req, res) => {
  res.json({ message: "example-express is running" })
})

app.listen(port, () => {
  console.log(`Express server listening on http://localhost:${port}`)
})
