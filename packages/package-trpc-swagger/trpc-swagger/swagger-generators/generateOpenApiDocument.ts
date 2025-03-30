import { OpenAPIV3 } from 'openapi-types'
import { AnyTRPCRouter } from '@trpc/server'

// Application Sectional || Define Imports
// =======================================================================================
// =======================================================================================
import { getOpenApiPathsObject } from './getOpenApiPathsObject'
import { errorResponseObject } from './errorResponseObject'

// Application Component || Define Variables
// =======================================================================================
// =======================================================================================
export const openApiVersion = '3.0.3'

// Application Component || Define Exports
// =======================================================================================
// =======================================================================================
export const generateOpenApiDocument = (appRouter: AnyTRPCRouter, opts: generateOpenApiDocumentProps): OpenAPIV3.Document => {
  const securitySchemes = opts.securitySchemes || {
    Authorization: {
      type: 'http',
      scheme: 'bearer',
    },
  }

  return {
    openapi: openApiVersion,
    info: {
      title: opts.title,
      description: opts.description,
      version: opts.version,
      termsOfService: opts.termsURL,
      contact: opts.contact ? { email: opts.contact.email } : undefined,
      license: opts.license
        ? {
          name: opts.license.name,
          url: opts.license.url,
        }
        : undefined,
    },
    servers: [
      {
        url: opts.baseUrl,
      },
    ],
    paths: getOpenApiPathsObject(appRouter, Object.keys(securitySchemes)),
    components: {
      securitySchemes,
      responses: {
        error: errorResponseObject,
      },
    },
    tags: opts.tags?.map((tag) => (typeof tag === 'string'
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
    externalDocs: opts.externalDocs
      ? {
        description: opts.externalDocs.description,
        url: opts.externalDocs.url,
      }
      : opts.docsUrl
        ? { url: opts.docsUrl }
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

export type generateOpenApiDocumentProps = {
  title: string;
  description?: string;
  version: string;
  baseUrl: string;
  docsUrl?: string;
  termsURL?: string;
  tags?: (string | TOpenApiTag)[];
  securitySchemes?: OpenAPIV3.ComponentsObject['securitySchemes'];
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
