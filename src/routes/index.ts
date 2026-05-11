import type { FastifyPluginAsync } from 'fastify';
import { healthRoute } from '../modules/health/health.route.js';

export const registerRoutes: FastifyPluginAsync = async (fastify) => {
  await fastify.register(healthRoute);

  await fastify.register(
    async () => {
      // Public API v1 routes will be registered here in later phases.
    },
    { prefix: '/api/v1' },
  );
};
