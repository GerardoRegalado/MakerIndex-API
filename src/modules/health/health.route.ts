import type { FastifyPluginAsync } from 'fastify';
import { env } from '../../config/env.js';
import type { HealthResponse } from './health.schema.js';

export const healthRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/health', async (): Promise<HealthResponse> => {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      version: env.API_VERSION,
    };
  });
};
