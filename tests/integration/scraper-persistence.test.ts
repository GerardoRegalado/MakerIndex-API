import { IndexStatus, Source } from '@prisma/client';
import { afterAll, describe, expect, it } from 'vitest';
import { prisma } from '../../src/lib/prisma.js';
import {
  normalizeTag,
  persistScrapedMakerModel,
} from '../../src/modules/scraper/scraper.persistence.js';
import type { ScrapedMakerModel } from '../../src/modules/scraper/scraper.types.js';

const makerWorldId = 880165;
const nullCreatorMakerWorldId = 880166;
const unstableCreatorMakerWorldId = 880167;
const firstScrapedAt = new Date('2026-05-10T00:00:00.000Z');
const secondScrapedAt = new Date('2026-05-11T00:00:00.000Z');

const buildScrapedModel = (
  overrides: Partial<ScrapedMakerModel> = {},
): ScrapedMakerModel => ({
  source: 'makerworld',
  makerWorldId,
  internalModelId: 'MW-880165',
  title: 'Persistence Test Model',
  slug: 'persistence-test-model',
  url: 'https://makerworld.com/en/models/880165-persistence-test-model',
  thumbnailUrl: 'https://example.com/persistence-test.webp',
  description: 'Integration test model for scraper persistence.',
  license: 'Standard Digital File License',
  category: 'Testing',
  downloadCount: 10,
  likeCount: 2,
  commentCount: 1,
  boostCount: 0,
  tags: ['Utility Test', 'utility test', 'Special & Weird!!'],
  creator: {
    username: 'scraper-persistence-maker',
    displayName: 'Scraper Persistence Maker',
    profileUrl: 'https://makerworld.com/en/@scraper-persistence-maker',
    avatarUrl: 'https://example.com/scraper-persistence-avatar.webp',
    fanCount: 12,
    followCount: 3,
    level: 2,
  },
  printProfiles: [
    {
      sourceProfileId: 880516,
      title: '0.2mm test profile',
      url: 'https://makerworld.com/en/models/880165-persistence-test-model#profileId-880516',
      printerCompatibility: ['A1', 'P1S'],
      material: 'PLA',
      layerHeightMm: 0.2,
      walls: 2,
      infillPercent: 15,
      printTimeMinutes: 42,
      filamentGrams: 11.5,
      isEstimate: true,
    },
    {
      sourceProfileId: 880517,
      title: '0.16mm test profile',
      url: 'https://makerworld.com/en/models/880165-persistence-test-model#profileId-880517',
      printerCompatibility: ['X1C'],
      material: 'PETG',
      layerHeightMm: 0.16,
      walls: 3,
      infillPercent: 20,
      printTimeMinutes: 55,
      filamentGrams: 14.2,
      isEstimate: true,
    },
  ],
  scrapedAt: firstScrapedAt,
  ...overrides,
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('scraper persistence', () => {
  it('normalizes tags into stable slugs', () => {
    expect(normalizeTag('  Special & Weird!!  ')).toEqual({
      name: 'Special & Weird!!',
      slug: 'special-weird',
    });
    expect(normalizeTag('   ')).toBeNull();
  });

  it('persists a new ScrapedMakerModel with relations', async () => {
    const model = await persistScrapedMakerModel(buildScrapedModel());

    expect(model.makerWorldId).toBe(makerWorldId);
    expect(model.title).toBe('Persistence Test Model');
    expect(model.creator?.username).toBe('scraper-persistence-maker');
    expect(model.printProfiles).toHaveLength(2);
    expect(model.tags.map((modelTag) => modelTag.tag.slug).sort()).toEqual([
      'special-weird',
      'utility-test',
    ]);
  });

  it('is idempotent for models, profiles, tags, and model tag relations', async () => {
    await persistScrapedMakerModel(buildScrapedModel());
    const model = await persistScrapedMakerModel(buildScrapedModel());

    const [modelCount, profileCount, creatorCount, modelTagCount] =
      await Promise.all([
        prisma.makerModel.count({
          where: { makerWorldId },
        }),
        prisma.printProfile.count({
          where: {
            source: Source.makerworld,
            sourceProfileId: {
              in: [880516, 880517],
            },
          },
        }),
        prisma.creator.count({
          where: {
            source: Source.makerworld,
            username: 'scraper-persistence-maker',
          },
        }),
        prisma.modelTag.count({
          where: {
            modelId: model.id,
            tag: {
              slug: {
                in: ['utility-test', 'special-weird'],
              },
            },
          },
        }),
      ]);

    expect(modelCount).toBe(1);
    expect(profileCount).toBe(2);
    expect(creatorCount).toBe(1);
    expect(modelTagCount).toBe(2);
  });

  it('updates stats while preserving firstScrapedAt and updating lastScrapedAt', async () => {
    await persistScrapedMakerModel(
      buildScrapedModel({
        scrapedAt: firstScrapedAt,
        downloadCount: 10,
        likeCount: 2,
        commentCount: 1,
        boostCount: 0,
      }),
    );

    const updated = await persistScrapedMakerModel(
      buildScrapedModel({
        scrapedAt: secondScrapedAt,
        downloadCount: 25,
        likeCount: 9,
        commentCount: 4,
        boostCount: 2,
      }),
    );

    expect(updated.downloadCount).toBe(25);
    expect(updated.likeCount).toBe(9);
    expect(updated.commentCount).toBe(4);
    expect(updated.boostCount).toBe(2);
    expect(updated.qualityScore).toBe(101);
    expect(updated.indexStatus).toBe(IndexStatus.indexed);
    expect(updated.firstScrapedAt?.toISOString()).toBe(
      firstScrapedAt.toISOString(),
    );
    expect(updated.lastScrapedAt?.toISOString()).toBe(
      secondScrapedAt.toISOString(),
    );
  });

  it('allows creator null without failing', async () => {
    const model = await persistScrapedMakerModel(
      buildScrapedModel({
        makerWorldId: nullCreatorMakerWorldId,
        internalModelId: 'MW-880166',
        title: 'Persistence Test Model Without Creator',
        slug: 'persistence-test-model-without-creator',
        url: 'https://makerworld.com/en/models/880166-persistence-test-model-without-creator',
        creator: null,
        tags: ['No Creator Test'],
        printProfiles: [
          {
            sourceProfileId: 880616,
            title: 'No creator profile',
            isEstimate: true,
          },
        ],
      }),
    );

    expect(model.makerWorldId).toBe(nullCreatorMakerWorldId);
    expect(model.creatorId).toBeNull();
    expect(model.creator).toBeNull();
  });

  it('does not persist creators without a stable identifier', async () => {
    const input = buildScrapedModel({
      makerWorldId: unstableCreatorMakerWorldId,
      internalModelId: 'MW-880167',
      title: 'Persistence Test Model With Unstable Creator',
      slug: 'persistence-test-model-with-unstable-creator',
      url: 'https://makerworld.com/en/models/880167-persistence-test-model-with-unstable-creator',
      creator: {
        username: null,
        displayName: 'Creator Without Stable Identifier',
        profileUrl: null,
        avatarUrl: 'https://example.com/no-stable-id.webp',
      },
      tags: ['Unstable Creator Test'],
      printProfiles: [
        {
          sourceProfileId: 880617,
          title: 'Unstable creator profile',
          isEstimate: true,
        },
      ],
    });

    await persistScrapedMakerModel(input);
    const model = await persistScrapedMakerModel(input);
    const creatorCount = await prisma.creator.count({
      where: {
        displayName: 'Creator Without Stable Identifier',
      },
    });

    expect(model.makerWorldId).toBe(unstableCreatorMakerWorldId);
    expect(model.creatorId).toBeNull();
    expect(model.creator).toBeNull();
    expect(creatorCount).toBe(0);
  });
});
