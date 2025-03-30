import { TRPCProcedureType, AnyTRPCProcedure } from "@trpc/server"

// Application Component || Define Helpers
// =======================================================================================
// =======================================================================================
const isTRPCProcedureType = (value: unknown): value is TRPCProcedureType =>
  // VERC: Type Guard to Ensure Only TRPCProcedureType Values Are Accepted
  typeof value === "string" && ["query", "mutation", "subscription"].includes(value)

// Application Component || Define Exports
// =======================================================================================
// =======================================================================================
export const getProcedureType = (procedure: AnyTRPCProcedure): TRPCProcedureType => {
  if (!procedure._def) {
    throw new Error("Invalid procedure structure")
  }

  if (!isTRPCProcedureType(procedure)) {
    throw new Error("Invalid procedure type")
  }

  return procedure._def.type
}
