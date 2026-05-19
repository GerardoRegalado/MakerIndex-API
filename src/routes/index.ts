import type { FastifyPluginAsync } from 'fastify';
import { healthDbRoute } from '../modules/health/health-db.route.js';
import { healthRoute } from '../modules/health/health.route.js';
import { modelsRoute } from '../modules/models/models.route.js';

export const registerRoutes: FastifyPluginAsync = async (fastify) => {
  await fastify.register(healthRoute);

  await fastify.register(
    async (apiV1) => {
      await apiV1.register(healthDbRoute);
      await apiV1.register(modelsRoute);
    },
    { prefix: '/api/v1' },
  );
};
