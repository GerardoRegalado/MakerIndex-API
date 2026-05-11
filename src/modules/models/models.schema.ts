import { z } from 'zod';

export const searchModelsQuerySchema = z.object({
  q: z
    .string({
      required_error: 'Search query is required.',
      invalid_type_error: 'Search query must be a string.',
    })
    .trim()
    .min(1, 'Search query cannot be empty.'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

export const modelParamsSchema = z.object({
  makerWorldId: z.coerce.number().int().positive(),
});

export type SearchModelsQuery = z.infer<typeof searchModelsQuerySchema>;
export type ModelParams = z.infer<typeof modelParamsSchema>;
