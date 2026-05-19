import type { FastifyPluginAsync } from 'fastify';
import {
  createErrorResponse,
  createSuccessResponse,
} from '../../lib/api-response.js';
import { prisma } from '../../lib/prisma.js';
import { isPrismaConnectionError } from '../../lib/prisma-errors.js';

export const healthDbRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/health/db', async (_request, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;

      return reply.send(
        createSuccessResponse({
          status: 'ok',
          database: 'reachable',
        }),
      );
    } catch (error) {
      if (!isPrismaConnectionError(error)) {
        throw error;
      }

      return reply.status(503).send(
        createErrorResponse(
          'DATABASE_UNAVAILABLE',
          'Database is currently unavailable.',
        ),
      );
    }
  });
};
