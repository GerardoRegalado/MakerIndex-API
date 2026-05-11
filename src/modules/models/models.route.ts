import type { FastifyPluginAsync } from 'fastify';
import {
  createErrorResponse,
  createSuccessResponse,
} from '../../lib/api-response.js';
import { mapModelDetail, mapModelSearchResult } from './models.mapper.js';
import {
  getModelByMakerWorldId,
  searchModels,
} from './models.service.js';
import {
  modelParamsSchema,
  searchModelsQuerySchema,
} from './models.schema.js';

export const modelsRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/models/search', async (request, reply) => {
    const queryResult = searchModelsQuerySchema.safeParse(request.query);

    if (!queryResult.success) {
      return reply.status(400).send(
        createErrorResponse(
          'INVALID_SEARCH_QUERY',
          'Invalid search query.',
          queryResult.error.flatten(),
        ),
      );
    }

    const { q, page, limit } = queryResult.data;
    const { total, models } = await searchModels({ q, page, limit });
    const totalPages = Math.ceil(total / limit);

    return reply.send(
      createSuccessResponse(
        {
          results: models.map(mapModelSearchResult),
        },
        {
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasMore: page * limit < total,
          },
        },
      ),
    );
  });

  fastify.get('/models/:makerWorldId', async (request, reply) => {
    const paramsResult = modelParamsSchema.safeParse(request.params);

    if (!paramsResult.success) {
      return reply.status(400).send(
        createErrorResponse(
          'INVALID_MODEL_ID',
          'MakerWorld model ID must be a positive integer.',
          paramsResult.error.flatten(),
        ),
      );
    }

    const model = await getModelByMakerWorldId(paramsResult.data.makerWorldId);

    if (!model) {
      return reply.status(404).send(
        createErrorResponse(
          'MODEL_NOT_FOUND',
          'MakerWorld model was not found.',
        ),
      );
    }

    return reply.send(createSuccessResponse(mapModelDetail(model)));
  });
};
