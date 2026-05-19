import { afterAll, afterEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app.js';
import { env } from '../../src/config/env.js';
import { prisma } from '../../src/lib/prisma.js';

let app: FastifyInstance | undefined;

const getApp = async () => {
  app = await buildApp();
  return app;
};

afterEach(async () => {
  await app?.close();
  app = undefined;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('base app routes', () => {
  it('responds to GET /health', async () => {
    const server = await getApp();

    const response = await server.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);

    const body = response.json<{
      status: string;
      uptime: number;
      timestamp: string;
      version: string;
    }>();

    expect(body.status).toBe('ok');
    expect(typeof body.uptime).toBe('number');
    expect(typeof body.timestamp).toBe('string');
    expect(body.version).toBe(env.API_VERSION);
  });

  it('uses the standard error contract for not found routes', async () => {
    const server = await getApp();

    const response = await server.inject({
      method: 'GET',
      url: '/missing-route',
    });

    expect(response.statusCode).toBe(404);

    const body = response.json<{
      success: boolean;
      data: null;
      error: {
        code: string;
      };
      metadata: {
        apiVersion: string;
      };
    }>();

    expect(body.success).toBe(false);
    expect(body.data).toBeNull();
    expect(body.error.code).toBe('NOT_FOUND');
    expect(body.metadata.apiVersion).toBe(env.API_ROUTE_VERSION);
  });

  it('serves Swagger UI at GET /docs', async () => {
    const server = await getApp();

    const response = await server.inject({
      method: 'GET',
      url: '/docs',
    });

    expect(response.statusCode).toBe(200);
  });

  it('serves OpenAPI JSON at GET /docs/json', async () => {
    const server = await getApp();

    const response = await server.inject({
      method: 'GET',
      url: '/docs/json',
    });

    expect(response.statusCode).toBe(200);

    const body = response.json<{
      openapi: string;
      info: {
        title: string;
        version: string;
      };
      paths: Record<string, unknown>;
      components: {
        schemas: Record<
          string,
          {
            allOf?: Array<{
              $ref?: string;
              required?: string[];
              properties?: Record<string, unknown>;
            }>;
            required?: string[];
            properties?: Record<string, unknown>;
          }
        >;
      };
    }>();

    expect(body.openapi).toBe('3.0.3');
    expect(body.info.title).toBe('MakerIndex API');
    expect(body.info.version).toBe(env.API_VERSION);
    expect(body.paths['/health']).toBeTruthy();
    expect(body.paths['/api/v1/health/db']).toBeTruthy();
    expect(body.paths['/api/v1/models/search']).toBeTruthy();
    expect(body.paths['/api/v1/models/{makerWorldId}']).toBeTruthy();
    expect(body.paths['/api/v1/models/resolve']).toBeTruthy();
    expect(body.components.schemas.ModelDetail).toBeTruthy();
    expect(body.components.schemas.ModelDetail?.required ?? []).not.toContain(
      'bestProfile',
    );
    expect(
      body.components.schemas.ModelDetail?.allOf?.some(
        (schema) => schema.$ref === '#/components/schemas/ModelSearchResult',
      ),
    ).toBe(false);
    expect(JSON.stringify(body.components.schemas.ModelDetail)).not.toContain(
      '"bestProfile"',
    );
    expect(JSON.stringify(body.components.schemas.ModelSearchResult)).toContain(
      '"bestProfile"',
    );
  });

  it('responds to GET /api/v1/health/db when the database is reachable', async () => {
    const server = await getApp();

    const response = await server.inject({
      method: 'GET',
      url: '/api/v1/health/db',
    });

    expect(response.statusCode).toBe(200);

    const body = response.json<{
      success: boolean;
      data: {
        status: string;
        database: string;
      };
      error: null;
      metadata: {
        apiVersion: string;
      };
    }>();

    expect(body.success).toBe(true);
    expect(body.data).toEqual({
      status: 'ok',
      database: 'reachable',
    });
    expect(body.error).toBeNull();
    expect(body.metadata.apiVersion).toBe(env.API_ROUTE_VERSION);
  });
});
