import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { OpenAPIV3 } from "openapi-types"
import { StandardSchemaV1 } from "@standard-schema/spec"

// Application Component || Define Exports
// =======================================================================================
// =======================================================================================
import { TOpenApiContent } from "../types"
import {
  instanceofZodType, instanceofZodTypeCoercible, instanceofZodTypeLikeString, instanceofZodTypeLikeVoid, instanceofZodTypeObject, instanceofZodTypeOptional, unwrapZodType, zodSupportsCoerce,
} from "../utils/zod"

export const errorResponseObject: OpenAPIV3.ResponseObject = {
  description: "Error response",
  content: {
    "application/json": {
      schema: zodSchemaToOpenApiSchemaObject(
        z.object({
          message: z.string(),
          code: z.string(),
          issues: z.array(z.object({ message: z.string() })).optional(),
        }),
      ),
    },
  },
}
