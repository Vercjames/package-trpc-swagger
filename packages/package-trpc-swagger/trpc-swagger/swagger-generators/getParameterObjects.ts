import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { OpenAPIV3 } from "openapi-types"
import { StandardSchemaV1 } from "@standard-schema/spec"

// Application Sectional || Define Imports
// =================================================================================================
import { TOpenApiContent } from "../types"
import { instanceofZodType, instanceofZodTypeCoercible, instanceofZodTypeLikeString, instanceofZodTypeLikeVoid, instanceofZodTypeObject, instanceofZodTypeOptional, unwrapZodType, zodSupportsCoerce } from "../utils/zod"

// Application Sectional || Define Helper Functions
// =================================================================================================
const zodSchemaToOpenApiSchemaObject = (zodSchema: z.ZodType): OpenAPIV3.SchemaObject => {
  if (!("~standard" in zodSchema)) {
    throw new Error("Schema does not comply with StandardSchemaV1 interface")
  }
  return zodSchema["~standard"].types as OpenAPIV3.SchemaObject;
}

// Application Sectional || Define Exports
// =================================================================================================
export const getParameterObjects = (
  schema: unknown,
  pathParameters: string[],
  inType: "all" | "path" | "query",
  example: Record<string, any> | undefined
): OpenAPIV3.ParameterObject[] | undefined => {
  if (!instanceofZodType(schema)) {
    throw new TRPCError({
      message: "Input parser expects a Zod validator",
      code: "INTERNAL_SERVER_ERROR"
    })
  }

  const isRequired = !schema.isOptional()
  const unwrappedSchema = unwrapZodType(schema, true)

  if (pathParameters.length === 0 && instanceofZodTypeLikeVoid(unwrappedSchema)) {
    return undefined
  }

  if (!instanceofZodTypeObject(unwrappedSchema)) {
    throw new TRPCError({
      message: "Input parser must be a ZodObject",
      code: "INTERNAL_SERVER_ERROR"
    })
  }

  const { shape } = unwrappedSchema
  const shapeKeys = Object.keys(shape)

  for (const pathParameter of pathParameters) {
    if (!shapeKeys.includes(pathParameter)) {
      throw new TRPCError({
        message: `Input parser expects key from path: "${pathParameter}"`,
        code: "INTERNAL_SERVER_ERROR"
      })
    }
  }

  return shapeKeys
    .filter((shapeKey) => {
      const isPathParameter = pathParameters.includes(shapeKey)
      if (inType === "path") {
        return isPathParameter
      } if (inType === "query") {
        return !isPathParameter
      }
      return true
    })
    .map((shapeKey) => {
      let shapeSchema = shape[shapeKey]
      const isShapeRequired = !shapeSchema.isOptional()
      const isPathParameter = pathParameters.includes(shapeKey)

      if (!instanceofZodTypeLikeString(shapeSchema)) {
        if (zodSupportsCoerce) {
          if (!instanceofZodTypeCoercible(shapeSchema)) {
            throw new TRPCError({
              message: `Input parser key: "${shapeKey}" must be ZodString, ZodNumber, ZodBoolean, ZodBigInt or ZodDate`,
              code: "INTERNAL_SERVER_ERROR"
            })
          }
        } else {
          throw new TRPCError({
            message: `Input parser key: "${shapeKey}" must be ZodString`,
            code: "INTERNAL_SERVER_ERROR"
          })
        }
      }

      if (instanceofZodTypeOptional(shapeSchema)) {
        if (isPathParameter) {
          throw new TRPCError({
            message: `Path parameter: "${shapeKey}" must not be optional`,
            code: "INTERNAL_SERVER_ERROR"
          })
        }
        shapeSchema = shapeSchema.unwrap()
      }

      const { description, ...openApiSchemaObject } = zodSchemaToOpenApiSchemaObject(shapeSchema)

      return {
        name: shapeKey,
        in: isPathParameter ? "path" : "query",
        required: isPathParameter || (isRequired && isShapeRequired),
        schema: openApiSchemaObject,
        description,
        example: example?.[shapeKey]
      }
    })
}


