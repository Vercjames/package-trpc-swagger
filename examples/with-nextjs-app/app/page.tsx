import SwaggerUI from "swagger-ui-react"
import "swagger-ui-react/swagger-ui.css"

// Application Component || Define Exports
// =======================================================================================
// =======================================================================================
export default function RootPage() {
  return (
    <SwaggerUI url="/api/openapi" />
  )
}

// <SwaggerUI url="https://petstore.swagger.io/v2/swagger.json" />
