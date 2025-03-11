import { ProcedureType } from "@trpc/server"
import { AnyZodObject, z } from "zod"

// Application Sectional || Define Imports
// =================================================================================================
// =================================================================================================
import { OpenApiMeta, OpenApiProcedure, OpenApiProcedureRecord } from "../types"

// Application Sectional || Define Functions
// =================================================================================================
// =================================================================================================
const mergeInputs = (inputParsers: AnyZodObject[]): AnyZodObject => {
  return inputParsers.reduce((acc, inputParser) => {
    return acc.merge(inputParser)
  }, z.object({}))
}

// `inputParser` & `outputParser` are private so this is a hack to access it
export const getInputOutputParsers = (procedure: OpenApiProcedure) => {
  const { inputs, output } = procedure._def
  return {
    inputParser: inputs.length >= 2 ? mergeInputs(inputs as AnyZodObject[]) : inputs[0],
    outputParser: output
  }
}

const getProcedureType = (procedure: OpenApiProcedure): ProcedureType => {
  if ("query" in procedure._def && procedure._def.query) return "query"
  if ("mutation" in procedure._def && procedure._def.mutation) return "mutation"
  if ("subscription" in procedure._def && procedure._def.subscription) return "subscription"
  if ("type" in procedure._def && typeof procedure._def.type === "string" && ["query", "mutation", "subscription"].includes(procedure._def.type)) return procedure._def.type as ProcedureType
  throw new Error("Unknown procedure type")
}

export const forEachOpenApiProcedure = (
  procedureRecord: OpenApiProcedureRecord,
  callback: (values: {
    path: string;
    type: ProcedureType;
    procedure: OpenApiProcedure;
    openapi: NonNullable<OpenApiMeta["openapi"]>;
  }) => void
) => {
  for (const [path, procedure] of Object.entries(procedureRecord)) {
    const { openapi } = procedure._def.meta ?? {}
    if (openapi && openapi.enabled !== false) {
      const type = getProcedureType(procedure)
      callback({ path, type, procedure, openapi })
    }
  }
}
