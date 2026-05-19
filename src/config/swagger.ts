import type { FastifyStaticSwaggerOptions } from '@fastify/swagger';
import type { FastifySwaggerUiOptions } from '@fastify/swagger-ui';
import { env } from './env.js';

type StaticSwaggerDocument = Extract<
  FastifyStaticSwaggerOptions['specification'],
  { document: unknown }
>['document'];
type OpenApiDocument = Extract<StaticSwaggerDocument, { openapi: string }>;
type OpenApiSchema = NonNullable<
  NonNullable<OpenApiDocument['components']>['schemas']
>[string];

const apiErrorResponse: OpenApiSchema = {
  type: 'object',
  required: ['success', 'data', 'error', 'metadata'],
  properties: {
    success: { type: 'boolean', example: false },
    data: { nullable: true, example: null },
    error: {
      $ref: '#/components/schemas/ApiError',
    },
    metadata: {
      type: 'object',
      required: ['apiVersion'],
      properties: {
        apiVersion: { type: 'string', example: 'v1' },
      },
      additionalProperties: true,
    },
  },
};

export const swaggerOptions: FastifyStaticSwaggerOptions = {
  mode: 'static',
  specification: {
    document: {
      openapi: '3.0.3',
      info: {
        title: 'MakerIndex API',
        description:
          'Unofficial REST API for public MakerWorld model metadata.',
        version: env.API_VERSION,
      },
      servers: [
        {
          url: 'http://localhost:3000',
          description: 'Local development server',
        },
      ],
      tags: [
        {
          name: 'Health',
          description: 'Infrastructure health checks.',
        },
        {
          name: 'Models',
          description:
            'Search, fetch, and resolve MakerWorld models already indexed in the local database. These endpoints do not scrape MakerWorld in real time and do not store or redistribute STL/3MF files.',
        },
      ],
      paths: {
        '/health': {
          get: {
            tags: ['Health'],
            summary: 'Health check',
            operationId: 'getHealth',
            responses: {
              '200': {
                description: 'API process is healthy.',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/HealthResponse',
                    },
                    example: {
                      status: 'ok',
                      uptime: 123.45,
                      timestamp: '2026-05-10T00:00:00.000Z',
                      version: env.API_VERSION,
                    },
                  },
                },
              },
            },
          },
        },
        '/api/v1/models/search': {
          get: {
            tags: ['Models'],
            summary: 'Search indexed MakerWorld models',
            description:
              'Searches models already indexed in the local database. This endpoint does not perform live scraping.',
            operationId: 'searchModels',
            parameters: [
              {
                name: 'q',
                in: 'query',
                required: true,
                description: 'Search term matched against model title, tags, and creator.',
                schema: { type: 'string', minLength: 1 },
                example: 'carabiner',
              },
              {
                name: 'page',
                in: 'query',
                required: false,
                schema: { type: 'integer', minimum: 1, default: 1 },
                example: 1,
              },
              {
                name: 'limit',
                in: 'query',
                required: false,
                schema: {
                  type: 'integer',
                  minimum: 1,
                  maximum: 50,
                  default: 20,
                },
                example: 20,
              },
            ],
            responses: {
              '200': {
                description: 'Search results.',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ModelSearchResponse',
                    },
                    example: {
                      success: true,
                      data: {
                        results: [
                          {
                            source: 'makerworld',
                            makerWorldId: 550165,
                            title:
                              'Utility Carabiner - Secure, Versatile Everyday Clip',
                            url: 'https://makerworld.com/en/models/550165-utility-carabiner-secure-versatile-everyday-clip',
                            thumbnailUrl:
                              'https://example.com/utility-carabiner.webp',
                            creator: {
                              username: 'polyverso-maker',
                              displayName: 'Polyverso Maker',
                            },
                            stats: {
                              downloads: 120,
                              likes: 24,
                              comments: 4,
                              boosts: 2,
                            },
                            tags: ['carabiner', 'clip', 'tools', 'utility'],
                            category: 'Tools',
                            bestProfile: {
                              sourceProfileId: 468516,
                              title: '0.2mm layer, 2 walls, 15% infill',
                              printTimeMinutes: 87,
                              filamentGrams: 22.4,
                              material: 'PLA',
                              printerCompatibility: ['A1', 'A1 mini', 'P1S'],
                            },
                          },
                        ],
                      },
                      error: null,
                      metadata: {
                        apiVersion: 'v1',
                        pagination: {
                          page: 1,
                          limit: 20,
                          total: 1,
                          totalPages: 1,
                          hasMore: false,
                        },
                      },
                    },
                  },
                },
              },
              '400': {
                $ref: '#/components/responses/InvalidSearchQuery',
              },
              '500': {
                $ref: '#/components/responses/InternalServerError',
              },
            },
          },
        },
        '/api/v1/models/{makerWorldId}': {
          get: {
            tags: ['Models'],
            summary: 'Get indexed model detail',
            description:
              'Fetches one MakerWorld model from the local database by makerWorldId. makerWorldId is the numeric model ID from the MakerWorld /models/:id URL segment.',
            operationId: 'getModelByMakerWorldId',
            parameters: [
              {
                name: 'makerWorldId',
                in: 'path',
                required: true,
                description: 'Positive integer MakerWorld model ID.',
                schema: { type: 'integer', minimum: 1 },
                example: 550165,
              },
            ],
            responses: {
              '200': {
                description: 'Model detail.',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ModelDetailResponse',
                    },
                  },
                },
              },
              '400': {
                $ref: '#/components/responses/InvalidModelId',
              },
              '404': {
                $ref: '#/components/responses/ModelNotFound',
              },
              '500': {
                $ref: '#/components/responses/InternalServerError',
              },
            },
          },
        },
        '/api/v1/models/resolve': {
          get: {
            tags: ['Models'],
            summary: 'Resolve a MakerWorld URL',
            description:
              'Resolves a MakerWorld model URL without scraping. The URL must be from makerworld.com or www.makerworld.com. makerWorldId is extracted from /models/:id. profileId is extracted from #profileId-:id when present. When sending a URL as a query parameter, encode # as %23.',
            operationId: 'resolveMakerWorldUrl',
            parameters: [
              {
                name: 'url',
                in: 'query',
                required: true,
                description:
                  'MakerWorld model URL. Encode # as %23 when passing a profile hash in the query string.',
                schema: { type: 'string', minLength: 1 },
                example:
                  'https://makerworld.com/en/models/550165-utility-carabiner-secure-versatile-everyday-clip%23profileId-468516',
              },
            ],
            responses: {
              '200': {
                description: 'Resolved indexed model and optional selected profile.',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ResolveModelResponse',
                    },
                    example: {
                      success: true,
                      data: {
                        makerWorldId: 550165,
                        profileId: 468516,
                        normalizedUrl:
                          'https://makerworld.com/en/models/550165-utility-carabiner-secure-versatile-everyday-clip',
                        indexed: true,
                        model: {
                          makerWorldId: 550165,
                          title:
                            'Utility Carabiner - Secure, Versatile Everyday Clip',
                          printProfiles: [],
                        },
                        selectedProfile: {
                          sourceProfileId: 468516,
                          title: '0.2mm layer, 2 walls, 15% infill',
                          url: 'https://makerworld.com/en/models/550165-utility-carabiner-secure-versatile-everyday-clip#profileId-468516',
                          printerCompatibility: ['A1', 'A1 mini', 'P1S'],
                          material: 'PLA',
                          layerHeightMm: 0.2,
                          walls: 2,
                          infillPercent: 15,
                          printTimeMinutes: 87,
                          filamentGrams: 22.4,
                          isEstimate: true,
                          scrapedAt: '2026-05-10T00:00:00.000Z',
                        },
                      },
                      error: null,
                      metadata: {
                        apiVersion: 'v1',
                        resolve: {
                          profileFound: true,
                        },
                      },
                    },
                  },
                },
              },
              '400': {
                $ref: '#/components/responses/InvalidMakerWorldUrl',
              },
              '404': {
                $ref: '#/components/responses/ModelNotIndexed',
              },
              '500': {
                $ref: '#/components/responses/InternalServerError',
              },
            },
          },
        },
      },
      components: {
        schemas: {
          ApiSuccessResponse: {
            type: 'object',
            required: ['success', 'data', 'error', 'metadata'],
            properties: {
              success: { type: 'boolean', example: true },
              data: { type: 'object', additionalProperties: true },
              error: { nullable: true, example: null },
              metadata: {
                type: 'object',
                required: ['apiVersion'],
                properties: {
                  apiVersion: { type: 'string', example: 'v1' },
                },
                additionalProperties: true,
              },
            },
          },
          ApiErrorResponse: apiErrorResponse,
          ApiError: {
            type: 'object',
            required: ['code', 'message', 'details'],
            properties: {
              code: { type: 'string', example: 'MODEL_NOT_FOUND' },
              message: { type: 'string', example: 'MakerWorld model was not found.' },
              details: { nullable: true },
            },
          },
          HealthResponse: {
            type: 'object',
            required: ['status', 'uptime', 'timestamp', 'version'],
            properties: {
              status: { type: 'string', example: 'ok' },
              uptime: { type: 'number', example: 123.45 },
              timestamp: {
                type: 'string',
                format: 'date-time',
                example: '2026-05-10T00:00:00.000Z',
              },
              version: { type: 'string', example: env.API_VERSION },
            },
          },
          PaginationMetadata: {
            type: 'object',
            required: ['page', 'limit', 'total', 'totalPages', 'hasMore'],
            properties: {
              page: { type: 'integer', example: 1 },
              limit: { type: 'integer', example: 20 },
              total: { type: 'integer', example: 1 },
              totalPages: { type: 'integer', example: 1 },
              hasMore: { type: 'boolean', example: false },
            },
          },
          Creator: {
            type: 'object',
            nullable: true,
            required: ['username', 'displayName'],
            properties: {
              username: { type: 'string', example: 'polyverso-maker' },
              displayName: { type: 'string', example: 'Polyverso Maker' },
            },
          },
          Stats: {
            type: 'object',
            required: ['downloads', 'likes', 'comments', 'boosts'],
            properties: {
              downloads: { type: 'integer', example: 120 },
              likes: { type: 'integer', example: 24 },
              comments: { type: 'integer', example: 4 },
              boosts: { type: 'integer', example: 2 },
            },
          },
          PrintProfile: {
            type: 'object',
            required: [
              'sourceProfileId',
              'title',
              'url',
              'printerCompatibility',
              'material',
              'layerHeightMm',
              'walls',
              'infillPercent',
              'printTimeMinutes',
              'filamentGrams',
              'isEstimate',
              'scrapedAt',
            ],
            properties: {
              sourceProfileId: { type: 'integer', example: 468516 },
              title: {
                type: 'string',
                example: '0.2mm layer, 2 walls, 15% infill',
              },
              url: {
                type: 'string',
                format: 'uri',
                example:
                  'https://makerworld.com/en/models/550165-utility-carabiner-secure-versatile-everyday-clip#profileId-468516',
              },
              printerCompatibility: {
                nullable: true,
                oneOf: [
                  {
                    type: 'array',
                    items: { type: 'string' },
                  },
                  {
                    type: 'object',
                    additionalProperties: true,
                  },
                ],
                example: ['A1', 'A1 mini', 'P1S'],
              },
              material: { type: 'string', nullable: true, example: 'PLA' },
              layerHeightMm: { type: 'number', nullable: true, example: 0.2 },
              walls: { type: 'integer', nullable: true, example: 2 },
              infillPercent: { type: 'integer', nullable: true, example: 15 },
              printTimeMinutes: { type: 'integer', nullable: true, example: 87 },
              filamentGrams: { type: 'number', nullable: true, example: 22.4 },
              isEstimate: { type: 'boolean', example: true },
              scrapedAt: {
                type: 'string',
                format: 'date-time',
                example: '2026-05-10T00:00:00.000Z',
              },
            },
          },
          BestProfile: {
            type: 'object',
            nullable: true,
            properties: {
              sourceProfileId: { type: 'integer', example: 468516 },
              title: {
                type: 'string',
                example: '0.2mm layer, 2 walls, 15% infill',
              },
              printTimeMinutes: { type: 'integer', nullable: true, example: 87 },
              filamentGrams: { type: 'number', nullable: true, example: 22.4 },
              material: { type: 'string', nullable: true, example: 'PLA' },
              printerCompatibility: { nullable: true, example: ['A1', 'A1 mini', 'P1S'] },
            },
          },
          ModelSearchResult: {
            type: 'object',
            required: [
              'source',
              'makerWorldId',
              'title',
              'url',
              'thumbnailUrl',
              'creator',
              'stats',
              'tags',
              'category',
              'bestProfile',
            ],
            properties: {
              source: { type: 'string', example: 'makerworld' },
              makerWorldId: { type: 'integer', example: 550165 },
              title: {
                type: 'string',
                example:
                  'Utility Carabiner - Secure, Versatile Everyday Clip',
              },
              url: {
                type: 'string',
                format: 'uri',
                example:
                  'https://makerworld.com/en/models/550165-utility-carabiner-secure-versatile-everyday-clip',
              },
              thumbnailUrl: {
                type: 'string',
                nullable: true,
                example: 'https://example.com/utility-carabiner.webp',
              },
              creator: { $ref: '#/components/schemas/Creator' },
              stats: { $ref: '#/components/schemas/Stats' },
              tags: {
                type: 'array',
                items: { type: 'string' },
                example: ['carabiner', 'clip', 'tools', 'utility'],
              },
              category: { type: 'string', nullable: true, example: 'Tools' },
              bestProfile: { $ref: '#/components/schemas/BestProfile' },
            },
          },
          ModelDetail: {
            allOf: [
              { $ref: '#/components/schemas/ModelSearchResult' },
              {
                type: 'object',
                required: [
                  'internalModelId',
                  'slug',
                  'description',
                  'license',
                  'printProfiles',
                  'metadata',
                ],
                properties: {
                  internalModelId: { type: 'string', nullable: true, example: 'MW-550165' },
                  slug: {
                    type: 'string',
                    nullable: true,
                    example:
                      'utility-carabiner-secure-versatile-everyday-clip',
                  },
                  description: {
                    type: 'string',
                    nullable: true,
                    example: 'Seed model used for MakerIndex API development.',
                  },
                  license: {
                    type: 'string',
                    nullable: true,
                    example: 'Standard Digital File License',
                  },
                  printProfiles: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/PrintProfile' },
                  },
                  metadata: {
                    type: 'object',
                    additionalProperties: true,
                  },
                },
              },
            ],
          },
          ModelSearchResponse: {
            allOf: [
              { $ref: '#/components/schemas/ApiSuccessResponse' },
              {
                type: 'object',
                properties: {
                  data: {
                    type: 'object',
                    required: ['results'],
                    properties: {
                      results: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/ModelSearchResult' },
                      },
                    },
                  },
                  metadata: {
                    type: 'object',
                    required: ['apiVersion', 'pagination'],
                    properties: {
                      apiVersion: { type: 'string', example: 'v1' },
                      pagination: {
                        $ref: '#/components/schemas/PaginationMetadata',
                      },
                    },
                  },
                },
              },
            ],
          },
          ModelDetailResponse: {
            allOf: [
              { $ref: '#/components/schemas/ApiSuccessResponse' },
              {
                type: 'object',
                properties: {
                  data: { $ref: '#/components/schemas/ModelDetail' },
                },
              },
            ],
          },
          ResolveModelResponse: {
            allOf: [
              { $ref: '#/components/schemas/ApiSuccessResponse' },
              {
                type: 'object',
                properties: {
                  data: {
                    type: 'object',
                    required: [
                      'makerWorldId',
                      'profileId',
                      'normalizedUrl',
                      'indexed',
                      'model',
                      'selectedProfile',
                    ],
                    properties: {
                      makerWorldId: { type: 'integer', example: 550165 },
                      profileId: { type: 'integer', nullable: true, example: 468516 },
                      normalizedUrl: {
                        type: 'string',
                        format: 'uri',
                        example:
                          'https://makerworld.com/en/models/550165-utility-carabiner-secure-versatile-everyday-clip',
                      },
                      indexed: { type: 'boolean', example: true },
                      model: { $ref: '#/components/schemas/ModelDetail' },
                      selectedProfile: {
                        nullable: true,
                        $ref: '#/components/schemas/PrintProfile',
                      },
                    },
                  },
                  metadata: {
                    type: 'object',
                    required: ['apiVersion', 'resolve'],
                    properties: {
                      apiVersion: { type: 'string', example: 'v1' },
                      resolve: {
                        type: 'object',
                        required: ['profileFound'],
                        properties: {
                          profileFound: { type: 'boolean', example: true },
                        },
                      },
                    },
                  },
                },
              },
            ],
          },
        },
        responses: {
          InvalidSearchQuery: {
            description: 'Invalid search query.',
            content: {
              'application/json': {
                schema: apiErrorResponse,
                example: {
                  success: false,
                  data: null,
                  error: {
                    code: 'INVALID_SEARCH_QUERY',
                    message: 'Invalid search query.',
                    details: {
                      fieldErrors: {
                        q: ['Search query is required.'],
                      },
                    },
                  },
                  metadata: { apiVersion: 'v1' },
                },
              },
            },
          },
          InvalidModelId: {
            description: 'Invalid MakerWorld model ID.',
            content: {
              'application/json': {
                schema: apiErrorResponse,
                example: {
                  success: false,
                  data: null,
                  error: {
                    code: 'INVALID_MODEL_ID',
                    message: 'MakerWorld model ID must be a positive integer.',
                    details: null,
                  },
                  metadata: { apiVersion: 'v1' },
                },
              },
            },
          },
          ModelNotFound: {
            description: 'Model not found in the local database.',
            content: {
              'application/json': {
                schema: apiErrorResponse,
                example: {
                  success: false,
                  data: null,
                  error: {
                    code: 'MODEL_NOT_FOUND',
                    message: 'MakerWorld model was not found.',
                    details: null,
                  },
                  metadata: { apiVersion: 'v1' },
                },
              },
            },
          },
          InvalidMakerWorldUrl: {
            description: 'Invalid or unsupported MakerWorld URL.',
            content: {
              'application/json': {
                schema: apiErrorResponse,
                example: {
                  success: false,
                  data: null,
                  error: {
                    code: 'INVALID_MAKERWORLD_URL',
                    message: 'A valid MakerWorld URL is required.',
                    details: null,
                  },
                  metadata: { apiVersion: 'v1' },
                },
              },
            },
          },
          ModelNotIndexed: {
            description: 'The MakerWorld model is valid but has not been indexed yet.',
            content: {
              'application/json': {
                schema: apiErrorResponse,
                example: {
                  success: false,
                  data: null,
                  error: {
                    code: 'MODEL_NOT_INDEXED',
                    message:
                      'This MakerWorld model has not been indexed yet.',
                    details: {
                      makerWorldId: 123456,
                      profileId: null,
                      normalizedUrl:
                        'https://makerworld.com/en/models/123456-example',
                    },
                  },
                  metadata: { apiVersion: 'v1' },
                },
              },
            },
          },
          InternalServerError: {
            description: 'Unexpected server error.',
            content: {
              'application/json': {
                schema: apiErrorResponse,
                example: {
                  success: false,
                  data: null,
                  error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Internal server error',
                    details: null,
                  },
                  metadata: { apiVersion: 'v1' },
                },
              },
            },
          },
        },
      },
    },
  },
};

export const swaggerUiOptions: FastifySwaggerUiOptions = {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'list',
    deepLinking: true,
  },
  staticCSP: true,
};
