import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import Fastify, { type FastifyError } from 'fastify';
import { env } from './config/env.js';
import { loggerOptions } from './lib/logger.js';
import { registerRoutes } from './routes/index.js';

type ErrorResponse = {
  success: false;
  data: null;
  error: {
    code: string;
    message: string;
    details: unknown;
  };
  metadata: {
    apiVersion: string;
  };
};

const toErrorResponse = (
  error: Pick<FastifyError, 'code' | 'message' | 'validation'>,
): ErrorResponse => ({
  success: false,
  data: null,
  error: {
    code: error.code ?? 'INTERNAL_SERVER_ERROR',
    message: error.message || 'Internal server error',
    details: error.validation ?? null,
  },
  metadata: {
    apiVersion: env.API_ROUTE_VERSION,
  },
});

export const buildApp = async () => {
  const app = Fastify({
    logger: loggerOptions,
  });

  await app.register(helmet);
  await app.register(cors, {
    origin: true,
  });
  await app.register(rateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_WINDOW,
  });

  app.setErrorHandler((error, request, reply) => {
    request.log.error(error);

    const statusCode = error.statusCode ?? 500;
    const publicError =
      statusCode >= 500
        ? {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
            validation: undefined,
          }
        : error;

    void reply.status(statusCode).send(toErrorResponse(publicError));
  });

  app.setNotFoundHandler((request, reply) => {
    void reply.status(404).send(
      toErrorResponse({
        code: 'NOT_FOUND',
        message: `Route ${request.method} ${request.url} not found`,
        validation: undefined,
      }),
    );
  });

  await app.register(registerRoutes);

  return app;
};
