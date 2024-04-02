import { NextResponse } from "next/server"
import { openApiDocument } from "@/server/openapi"

// // Application Component || Define Exports
// // =================================================================================================
// // =================================================================================================
export async function GET() {
  return NextResponse.json(openApiDocument)
}
