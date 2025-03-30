import { OpenAPIV3 } from 'openapi-types'
import { TRPCProcedureType, AnyTRPCProcedure, AnyTRPCRouter } from '@trpc/server'

// Application Component || Define Typologies
// =======================================================================================
// =======================================================================================
export type TOpenApiMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export type TOpenApiContent =
  | 'application/json'
  | 'application/x-www-form-urlencoded'
  // eslint-disable-next-line @typescript-eslint/ban-types
  | (string & {});

// Application Component || Define Typologies
// =======================================================================================
// =======================================================================================
// export type TOpenApiRouter = Router<
//   CreateRootTypes<{
//     ctx: any;
//     meta: TRPCMeta;
//     errorShape: any;
//     transformer: any;
//   }>,
//   OpenApiProcedureRecord
// >;
