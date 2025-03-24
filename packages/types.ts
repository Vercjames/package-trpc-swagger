import { AnyTRPCProcedure, AnyTRPCRouter, TRPCProcedureType } from "@trpc/server"
import { TRPC_ERROR_CODE_KEY } from "@trpc/server/rpc"
import { OpenAPIV3 } from "openapi-types"
import { ZodIssue } from "zod"

export type OpenApiMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
export type TRPCMeta = Record<string, unknown>;

export type OpenApiContentType =
  | "application/json"
  | "application/x-www-form-urlencoded"
  // eslint-disable-next-line @typescript-eslint/ban-types
  | (string & {});

export type OpenApiMeta<TMeta = TRPCMeta> = TMeta & {
  openapi?: {
    enabled?: boolean;
    method: OpenApiMethod;
    path: `/${string}`;
    summary?: string;
    description?: string;
    protect?: boolean;
    tags?: string[];
    headers?: (OpenAPIV3.ParameterBaseObject & { name: string; in?: "header" })[];
    contentTypes?: OpenApiContentType[];
    deprecated?: boolean;
    example?: {
      request?: Record<string, any>;
      response?: Record<string, any>;
    };
    responseHeaders?: Record<string, OpenAPIV3.HeaderObject | OpenAPIV3.ReferenceObject>;
  };
};

export type OpenApiProcedure = AnyTRPCProcedure

export type OpenApiProcedureRecord = Record<string, any>;

export type OpenApiRouter = AnyTRPCRouter

export type OpenApiSuccessResponse<D = any> = D;

export type OpenApiErrorResponse = {
  message: string;
  code: TRPC_ERROR_CODE_KEY;
  issues?: ZodIssue[];
};

export type OpenApiResponse<D = any> = OpenApiSuccessResponse<D> | OpenApiErrorResponse;
