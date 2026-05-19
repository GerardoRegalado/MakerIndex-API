import type { Prisma } from '@prisma/client';

export type ModelSearchRecord = Prisma.MakerModelGetPayload<{
  include: {
    creator: true;
    tags: {
      include: {
        tag: true;
      };
    };
    printProfiles: true;
  };
}>;

export type ModelDetailRecord = Prisma.MakerModelGetPayload<{
  include: {
    creator: true;
    tags: {
      include: {
        tag: true;
      };
    };
    printProfiles: true;
  };
}>;

const mapCreator = (creator: ModelSearchRecord['creator']) =>
  creator
    ? {
        username: creator.username,
        displayName: creator.displayName,
      }
    : null;

const mapStats = (model: ModelSearchRecord) => ({
  downloads: model.downloadCount,
  likes: model.likeCount,
  comments: model.commentCount,
  boosts: model.boostCount,
});

const mapTags = (model: Pick<ModelSearchRecord, 'tags'>) =>
  model.tags.map((modelTag) => modelTag.tag.name).sort();

const mapPrinterCompatibility = (printerCompatibility: unknown) =>
  printerCompatibility ?? null;

export const mapPrintProfile = (
  profile: ModelDetailRecord['printProfiles'][number],
) => ({
  sourceProfileId: profile.sourceProfileId,
  title: profile.title,
  url: profile.url,
  printerCompatibility: mapPrinterCompatibility(profile.printerCompatibility),
  material: profile.material,
  layerHeightMm: profile.layerHeightMm,
  walls: profile.walls,
  infillPercent: profile.infillPercent,
  printTimeMinutes: profile.printTimeMinutes,
  filamentGrams: profile.filamentGrams,
  isEstimate: profile.isEstimate,
  scrapedAt: profile.scrapedAt,
});

export const mapModelSearchResult = (model: ModelSearchRecord) => {
  // For the MVP, the earliest profile is treated as the representative profile.
  const bestProfile = model.printProfiles[0];

  return {
    source: model.source,
    makerWorldId: model.makerWorldId,
    title: model.title,
    url: model.url,
    thumbnailUrl: model.thumbnailUrl,
    creator: mapCreator(model.creator),
    stats: mapStats(model),
    tags: mapTags(model),
    category: model.category,
    bestProfile: bestProfile
      ? {
          sourceProfileId: bestProfile.sourceProfileId,
          title: bestProfile.title,
          printTimeMinutes: bestProfile.printTimeMinutes,
          filamentGrams: bestProfile.filamentGrams,
          material: bestProfile.material,
          printerCompatibility: mapPrinterCompatibility(
            bestProfile.printerCompatibility,
          ),
        }
      : null,
  };
};

export const mapModelDetail = (model: ModelDetailRecord) => ({
  source: model.source,
  makerWorldId: model.makerWorldId,
  internalModelId: model.internalModelId,
  title: model.title,
  slug: model.slug,
  url: model.url,
  thumbnailUrl: model.thumbnailUrl,
  description: model.description,
  license: model.license,
  category: model.category,
  creator: mapCreator(model.creator),
  stats: mapStats(model),
  tags: mapTags(model),
  printProfiles: model.printProfiles.map(mapPrintProfile),
  metadata: {
    indexStatus: model.indexStatus,
    qualityScore: model.qualityScore,
    firstScrapedAt: model.firstScrapedAt,
    lastScrapedAt: model.lastScrapedAt,
    createdAt: model.createdAt,
    updatedAt: model.updatedAt,
    isEstimate: true,
  },
});
