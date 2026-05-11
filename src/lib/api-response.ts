import { env } from '../config/env.js';

export type ApiError = {
  code: string;
  message: string;
  details: unknown;
};

export type ApiMetadata = {
  apiVersion: string;
  [key: string]: unknown;
};

export const createSuccessResponse = <Data>(
  data: Data,
  metadata: Record<string, unknown> = {},
) => ({
  success: true as const,
  data,
  error: null,
  metadata: {
    apiVersion: env.API_ROUTE_VERSION,
    ...metadata,
  },
});

export const createErrorResponse = (
  code: string,
  message: string,
  details: unknown = null,
) => ({
  success: false as const,
  data: null,
  error: {
    code,
    message,
    details,
  },
  metadata: {
    apiVersion: env.API_ROUTE_VERSION,
  },
});
