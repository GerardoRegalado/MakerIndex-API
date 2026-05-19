import { IndexStatus, Prisma, Source } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import type { ScrapedMakerModel, ScrapedPrintProfile } from './scraper.types.js';

const MODEL_INCLUDE = {
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
} satisfies Prisma.MakerModelInclude;

export type PersistedScrapedMakerModel = Prisma.MakerModelGetPayload<{
  include: typeof MODEL_INCLUDE;
}>;

type ScraperTransaction = Omit<
  Prisma.TransactionClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export const calculateQualityScore = (model: ScrapedMakerModel): number =>
  (model.downloadCount ?? 0) +
  (model.likeCount ?? 0) * 2 +
  (model.commentCount ?? 0) * 3 +
  (model.boostCount ?? 0) * 5 +
  model.printProfiles.length * 10 +
  model.tags.length;

export const normalizeTag = (
  tag: string,
): { name: string; slug: string } | null => {
  const name = tag.trim();

  if (!name) {
    return null;
  }

  const slug = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!slug) {
    return null;
  }

  return { name, slug };
};

const getUniqueNormalizedTags = (tags: string[]) => {
  const tagsBySlug = new Map<string, { name: string; slug: string }>();

  for (const tag of tags) {
    const normalizedTag = normalizeTag(tag);

    if (normalizedTag && !tagsBySlug.has(normalizedTag.slug)) {
      tagsBySlug.set(normalizedTag.slug, normalizedTag);
    }
  }

  return [...tagsBySlug.values()];
};

const toNullableJsonInput = (
  value: unknown,
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput =>
  value === undefined || value === null
    ? Prisma.JsonNull
    : (value as Prisma.InputJsonValue);

const upsertCreator = async (
  tx: ScraperTransaction,
  scrapedModel: ScrapedMakerModel,
) => {
  const creator = scrapedModel.creator;

  if (!creator) {
    return null;
  }

  const existingCreator =
    creator.username || creator.profileUrl
      ? await tx.creator.findFirst({
          where: creator.username
            ? {
                source: Source.makerworld,
                username: creator.username,
              }
            : {
                source: Source.makerworld,
                profileUrl: creator.profileUrl,
              },
        })
      : null;

  const data = {
    source: Source.makerworld,
    username: creator.username ?? null,
    displayName: creator.displayName ?? null,
    profileUrl: creator.profileUrl ?? null,
    avatarUrl: creator.avatarUrl ?? null,
    fanCount: creator.fanCount ?? null,
    followCount: creator.followCount ?? null,
    level: creator.level ?? null,
    scrapedAt: scrapedModel.scrapedAt,
  };

  if (existingCreator) {
    return tx.creator.update({
      where: {
        id: existingCreator.id,
      },
      data,
    });
  }

  return tx.creator.create({ data });
};

const upsertPrintProfile = async (
  tx: ScraperTransaction,
  modelId: string,
  profile: ScrapedPrintProfile,
  scrapedAt: Date,
) =>
  tx.printProfile.upsert({
    where: {
      source_sourceProfileId: {
        source: Source.makerworld,
        sourceProfileId: profile.sourceProfileId,
      },
    },
    update: {
      modelId,
      title: profile.title ?? null,
      url: profile.url ?? null,
      printerCompatibility: toNullableJsonInput(profile.printerCompatibility),
      material: profile.material ?? null,
      layerHeightMm: profile.layerHeightMm ?? null,
      walls: profile.walls ?? null,
      infillPercent: profile.infillPercent ?? null,
      printTimeMinutes: profile.printTimeMinutes ?? null,
      filamentGrams: profile.filamentGrams ?? null,
      isEstimate: profile.isEstimate,
      scrapedAt,
    },
    create: {
      source: Source.makerworld,
      sourceProfileId: profile.sourceProfileId,
      modelId,
      title: profile.title ?? null,
      url: profile.url ?? null,
      printerCompatibility: toNullableJsonInput(profile.printerCompatibility),
      material: profile.material ?? null,
      layerHeightMm: profile.layerHeightMm ?? null,
      walls: profile.walls ?? null,
      infillPercent: profile.infillPercent ?? null,
      printTimeMinutes: profile.printTimeMinutes ?? null,
      filamentGrams: profile.filamentGrams ?? null,
      isEstimate: profile.isEstimate,
      scrapedAt,
    },
  });

const upsertTags = async (
  tx: ScraperTransaction,
  modelId: string,
  tags: string[],
) => {
  const normalizedTags = getUniqueNormalizedTags(tags);

  for (const tag of normalizedTags) {
    const persistedTag = await tx.tag.upsert({
      where: {
        source_slug: {
          source: Source.makerworld,
          slug: tag.slug,
        },
      },
      update: {
        name: tag.name,
      },
      create: {
        source: Source.makerworld,
        name: tag.name,
        slug: tag.slug,
      },
    });

    await tx.modelTag.upsert({
      where: {
        modelId_tagId: {
          modelId,
          tagId: persistedTag.id,
        },
      },
      update: {},
      create: {
        modelId,
        tagId: persistedTag.id,
      },
    });
  }
};

export const persistScrapedMakerModel = async (
  scrapedModel: ScrapedMakerModel,
): Promise<PersistedScrapedMakerModel> =>
  prisma.$transaction(async (tx) => {
    const creator = await upsertCreator(tx, scrapedModel);
    const modelData = {
      source: Source.makerworld,
      internalModelId: scrapedModel.internalModelId ?? null,
      title: scrapedModel.title,
      slug: scrapedModel.slug ?? null,
      url: scrapedModel.url,
      thumbnailUrl: scrapedModel.thumbnailUrl ?? null,
      description: scrapedModel.description ?? null,
      license: scrapedModel.license ?? null,
      category: scrapedModel.category ?? null,
      creatorId: creator?.id ?? null,
      downloadCount: scrapedModel.downloadCount ?? 0,
      likeCount: scrapedModel.likeCount ?? 0,
      commentCount: scrapedModel.commentCount ?? 0,
      boostCount: scrapedModel.boostCount ?? 0,
      qualityScore: calculateQualityScore(scrapedModel),
      indexStatus: IndexStatus.indexed,
      lastScrapedAt: scrapedModel.scrapedAt,
    };

    const model = await tx.makerModel.upsert({
      where: {
        makerWorldId: scrapedModel.makerWorldId,
      },
      update: modelData,
      create: {
        ...modelData,
        makerWorldId: scrapedModel.makerWorldId,
        firstScrapedAt: scrapedModel.scrapedAt,
      },
    });

    for (const profile of scrapedModel.printProfiles) {
      await upsertPrintProfile(tx, model.id, profile, scrapedModel.scrapedAt);
    }

    await upsertTags(tx, model.id, scrapedModel.tags);

    return tx.makerModel.findUniqueOrThrow({
      where: {
        makerWorldId: scrapedModel.makerWorldId,
      },
      include: MODEL_INCLUDE,
    });
  });
