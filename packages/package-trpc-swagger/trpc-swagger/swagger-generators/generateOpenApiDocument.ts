import { OpenAPIV3 } from "openapi-types"
import { AnyTRPCRouter } from "@trpc/server"

// Application Sectional || Define Imports
// =======================================================================================
// =======================================================================================
// import { getOpenApiPathsObject } from "./getOpenApiPathsObject"
// import { errorResponseObject } from "./errorResponseObject"

// Application Component || Define Variables
// =======================================================================================
// =======================================================================================
export const openApiVersion = "3.0.3"

// Application Component || Define Exports
// =======================================================================================
// =======================================================================================
export const generateOpenApiDocument = ({ router, options }: {
  router?: AnyTRPCRouter;
  options: generateOpenApiDocumentOptions
}): OpenAPIV3.Document => {
  const securitySchemes = options.securitySchemes || {
    Authorization: {
      type: "http",
      scheme: "bearer",
    },
  }

  return {
    openapi: openApiVersion,
    info: {
      title: options.title,
      description: options.description,
      version: options.version,
      termsOfService: options.termsURL,
      contact: options.contact ? { email: options.contact.email } : undefined,
      license: options.license
        ? {
          name: options.license.name,
          url: options.license.url,
        }
        : undefined,
    },
    servers: [
      {
        url: options.baseUrl,
      },
    ],
    paths: {},
    // paths: router ? getOpenApiPathsObject(router, Object.keys(securitySchemes)) : undefined,
    components: {
      securitySchemes,
      responses: {
        // error: errorResponseObject,
      },
    },
    tags: options.tags?.map((tag) => (typeof tag === "string"
      ? { name: tag } // Legacy support for string[]
      : {
        name: tag.name,
        description: tag.description,
        externalDocs: tag.externalDocs
          ? {
            description: tag.externalDocs.description,
            url: tag.externalDocs.url,
          }
          : undefined,
      })),
    // eslint-disable-next-line no-nested-ternary
    externalDocs: options.externalDocs
      ? {
        description: options.externalDocs.description,
        url: options.externalDocs.url,
      }
      : options.docsUrl
        ? { url: options.docsUrl }
        : undefined,
  }
}

// Application Component || Define Typologies
// =======================================================================================
// =======================================================================================
export type TOpenApiTag = {
  name: string;
  description?: string;
  externalDocs?: {
    description?: string;
    url: string;
  };
};

export type generateOpenApiDocumentOptions = {
  title: string;
  description?: string;
  version: string;
  baseUrl: string;
  docsUrl?: string;
  termsURL?: string;
  tags?: (string | TOpenApiTag)[];
  securitySchemes?: OpenAPIV3.ComponentsObject["securitySchemes"];
  contact?: {
    email: string;
  };
  license?: {
    name: string;
    url: string;
  };
  externalDocs?: {
    description: string;
    url: string;
  };
};
