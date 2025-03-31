import { NextResponse, NextRequest } from "next/server"
import { swaggerDocument } from "@/server/swagger"

// Application Component || Define Exports
// =======================================================================================
// =======================================================================================
export async function GET(req: NextRequest) {
  const forwardedHost = req.headers.get("x-forwarded-host")
  const forwardedProto = req.headers.get("x-forwarded-proto")
  const updatedDocument = {
    ...swaggerDocument,
    baseUrl: `${forwardedProto}://${forwardedHost}/api`,
    servers: [{ url: `${forwardedProto}://${forwardedHost}/api` }],
  }
  return NextResponse.json(updatedDocument)
}
