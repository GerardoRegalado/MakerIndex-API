import { IndexStatus, Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import type { SearchModelsQuery } from './models.schema.js';

const buildSearchWhere = (q: string): Prisma.MakerModelWhereInput => ({
  indexStatus: IndexStatus.indexed,
  OR: [
    {
      title: {
        contains: q,
        mode: 'insensitive',
      },
    },
    {
      tags: {
        some: {
          tag: {
            OR: [
              {
                name: {
                  contains: q,
                  mode: 'insensitive',
                },
              },
              {
                slug: {
                  contains: q,
                  mode: 'insensitive',
                },
              },
            ],
          },
        },
      },
    },
    {
      creator: {
        is: {
          OR: [
            {
              username: {
                contains: q,
                mode: 'insensitive',
              },
            },
            {
              displayName: {
                contains: q,
                mode: 'insensitive',
              },
            },
          ],
        },
      },
    },
  ],
});

export const searchModels = async ({ q, page, limit }: SearchModelsQuery) => {
  const where = buildSearchWhere(q);
  const skip = (page - 1) * limit;

  const [total, models] = await prisma.$transaction([
    prisma.makerModel.count({ where }),
    prisma.makerModel.findMany({
      where,
      include: {
        creator: true,
        tags: {
          include: {
            tag: true,
          },
        },
        printProfiles: {
          orderBy: {
            createdAt: 'asc',
          },
          take: 1,
        },
      },
      orderBy: [
        {
          qualityScore: 'desc',
        },
        {
          createdAt: 'desc',
        },
      ],
      skip,
      take: limit,
    }),
  ]);

  return {
    total,
    models,
  };
};

export const getModelByMakerWorldId = async (makerWorldId: number) =>
  prisma.makerModel.findUnique({
    where: {
      makerWorldId,
    },
    include: {
      creator: true,
      tags: {
        include: {
          tag: true,
        },
      },
      printProfiles: {
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  });
