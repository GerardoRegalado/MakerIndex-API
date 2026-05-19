const PRISMA_CONNECTION_ERROR_CODES = new Set([
  'P1000',
  'P1001',
  'P1002',
  'P1017',
]);

type PrismaLikeError = {
  name?: unknown;
  code?: unknown;
  errorCode?: unknown;
  clientVersion?: unknown;
};

export const isPrismaConnectionError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const prismaError = error as PrismaLikeError;

  if (prismaError.name === 'PrismaClientInitializationError') {
    return true;
  }

  const code =
    typeof prismaError.errorCode === 'string'
      ? prismaError.errorCode
      : typeof prismaError.code === 'string'
        ? prismaError.code
        : null;

  return (
    typeof prismaError.clientVersion === 'string' &&
    code !== null &&
    PRISMA_CONNECTION_ERROR_CODES.has(code)
  );
};
