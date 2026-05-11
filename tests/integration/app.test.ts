import { afterEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app.js';
import { env } from '../../src/config/env.js';

let app: FastifyInstance | undefined;

const getApp = async () => {
  app = await buildApp();
  return app;
};

afterEach(async () => {
  await app?.close();
  app = undefined;
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
});
