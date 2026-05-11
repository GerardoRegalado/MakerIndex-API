import type { FastifyInstance } from 'fastify';
import { afterAll, afterEach, describe, expect, it } from 'vitest';
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

describe('models routes', () => {
  it('responds to GET /api/v1/models/search?q=carabiner', async () => {
    const server = await getApp();

    const response = await server.inject({
      method: 'GET',
      url: '/api/v1/models/search?q=carabiner',
    });

    expect(response.statusCode).toBe(200);

    const body = response.json<{
      success: boolean;
      data: {
        results: Array<{
          makerWorldId: number;
          title: string;
          bestProfile: unknown;
        }>;
      };
      error: null;
    }>();

    expect(body.success).toBe(true);
    expect(body.error).toBeNull();
    expect(body.data.results.length).toBeGreaterThanOrEqual(1);
    expect(body.data.results[0]?.makerWorldId).toBe(550165);
    expect(body.data.results[0]?.title).toContain('Utility Carabiner');
    expect(body.data.results[0]?.bestProfile).toBeTruthy();
  });

  it('includes pagination metadata for search', async () => {
    const server = await getApp();

    const response = await server.inject({
      method: 'GET',
      url: '/api/v1/models/search?q=carabiner&page=1&limit=10',
    });

    expect(response.statusCode).toBe(200);

    const body = response.json<{
      metadata: {
        apiVersion: string;
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
          hasMore: boolean;
        };
      };
    }>();

    expect(body.metadata.apiVersion).toBe(env.API_ROUTE_VERSION);
    expect(body.metadata.pagination).toMatchObject({
      page: 1,
      limit: 10,
    });
    expect(typeof body.metadata.pagination.total).toBe('number');
    expect(typeof body.metadata.pagination.totalPages).toBe('number');
    expect(typeof body.metadata.pagination.hasMore).toBe('boolean');
  });

  it('returns 400 for search without q', async () => {
    const server = await getApp();

    const response = await server.inject({
      method: 'GET',
      url: '/api/v1/models/search',
    });

    expect(response.statusCode).toBe(400);

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
    expect(body.error.code).toBe('INVALID_SEARCH_QUERY');
    expect(body.metadata.apiVersion).toBe(env.API_ROUTE_VERSION);
  });

  it('returns 400 for search limit greater than 50', async () => {
    const server = await getApp();

    const response = await server.inject({
      method: 'GET',
      url: '/api/v1/models/search?q=carabiner&limit=51',
    });

    expect(response.statusCode).toBe(400);

    const body = response.json<{
      error: {
        code: string;
      };
    }>();

    expect(body.error.code).toBe('INVALID_SEARCH_QUERY');
  });

  it('responds to GET /api/v1/models/550165', async () => {
    const server = await getApp();

    const response = await server.inject({
      method: 'GET',
      url: '/api/v1/models/550165',
    });

    expect(response.statusCode).toBe(200);

    const body = response.json<{
      success: boolean;
      data: {
        makerWorldId: number;
        title: string;
        printProfiles: unknown[];
        tags: string[];
      };
      error: null;
    }>();

    expect(body.success).toBe(true);
    expect(body.error).toBeNull();
    expect(body.data.makerWorldId).toBe(550165);
    expect(body.data.title).toContain('Utility Carabiner');
    expect(body.data.printProfiles).toHaveLength(2);
    expect(body.data.tags).toEqual(
      expect.arrayContaining(['utility', 'carabiner', 'clip', 'tools']),
    );
  });

  it('returns 404 MODEL_NOT_FOUND for missing models', async () => {
    const server = await getApp();

    const response = await server.inject({
      method: 'GET',
      url: '/api/v1/models/999999',
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
    expect(body.error.code).toBe('MODEL_NOT_FOUND');
    expect(body.metadata.apiVersion).toBe(env.API_ROUTE_VERSION);
  });

  it('search uses local database results without external fetch dependency', async () => {
    const server = await getApp();
    const originalFetch = globalThis.fetch;

    globalThis.fetch = (() => {
      throw new Error('External HTTP calls are not allowed in model search.');
    }) as typeof fetch;

    try {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/models/search?q=polyverso',
      });

      expect(response.statusCode).toBe(200);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
