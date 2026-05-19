import { describe, expect, it } from 'vitest';
import { isPrismaConnectionError } from '../../src/lib/prisma-errors.js';

describe('isPrismaConnectionError', () => {
  it('detects PrismaClientInitializationError by name', () => {
    expect(
      isPrismaConnectionError({
        name: 'PrismaClientInitializationError',
        clientVersion: '6.19.3',
      }),
    ).toBe(true);
  });

  it('detects Prisma connection error codes with clientVersion', () => {
    expect(
      isPrismaConnectionError({
        code: 'P1001',
        clientVersion: '6.19.3',
      }),
    ).toBe(true);

    expect(
      isPrismaConnectionError({
        errorCode: 'P1017',
        clientVersion: '6.19.3',
      }),
    ).toBe(true);
  });

  it('ignores non-Prisma and non-connection errors', () => {
    expect(isPrismaConnectionError(new Error('plain error'))).toBe(false);
    expect(
      isPrismaConnectionError({
        code: 'P2002',
        clientVersion: '6.19.3',
      }),
    ).toBe(false);
  });
});
