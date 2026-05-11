import 'dotenv/config';
import { IndexStatus, PrismaClient, Source } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['warn', 'error'],
});

const now = () => new Date();

const main = async () => {
  console.log('Seeding MakerIndex development data...');

  const creatorData = {
    source: Source.makerworld,
    username: 'polyverso-maker',
    displayName: 'Polyverso Maker',
    profileUrl: 'https://makerworld.com/en/@polyverso-maker',
    avatarUrl: 'https://example.com/avatar.webp',
    fanCount: 120,
    followCount: 10,
    level: 3,
    scrapedAt: now(),
  };

  const existingCreator = await prisma.creator.findFirst({
    where: {
      source: Source.makerworld,
      username: creatorData.username,
    },
  });

  const creator = existingCreator
    ? await prisma.creator.update({
        where: { id: existingCreator.id },
        data: creatorData,
      })
    : await prisma.creator.create({
        data: creatorData,
      });

  const model = await prisma.makerModel.upsert({
    where: {
      makerWorldId: 550165,
    },
    update: {
      source: Source.makerworld,
      internalModelId: 'MW-550165',
      title: 'Utility Carabiner - Secure, Versatile Everyday Clip',
      slug: 'utility-carabiner-secure-versatile-everyday-clip',
      url: 'https://makerworld.com/en/models/550165-utility-carabiner-secure-versatile-everyday-clip',
      thumbnailUrl: 'https://example.com/utility-carabiner.webp',
      description: 'Seed model used for MakerIndex API development.',
      license: 'Standard Digital File License',
      category: 'Tools',
      creatorId: creator.id,
      downloadCount: 120,
      likeCount: 24,
      commentCount: 4,
      boostCount: 2,
      qualityScore: 150,
      indexStatus: IndexStatus.indexed,
      firstScrapedAt: now(),
      lastScrapedAt: now(),
    },
    create: {
      source: Source.makerworld,
      makerWorldId: 550165,
      internalModelId: 'MW-550165',
      title: 'Utility Carabiner - Secure, Versatile Everyday Clip',
      slug: 'utility-carabiner-secure-versatile-everyday-clip',
      url: 'https://makerworld.com/en/models/550165-utility-carabiner-secure-versatile-everyday-clip',
      thumbnailUrl: 'https://example.com/utility-carabiner.webp',
      description: 'Seed model used for MakerIndex API development.',
      license: 'Standard Digital File License',
      category: 'Tools',
      creatorId: creator.id,
      downloadCount: 120,
      likeCount: 24,
      commentCount: 4,
      boostCount: 2,
      qualityScore: 150,
      indexStatus: IndexStatus.indexed,
      firstScrapedAt: now(),
      lastScrapedAt: now(),
    },
  });

  await prisma.printProfile.upsert({
    where: {
      source_sourceProfileId: {
        source: Source.makerworld,
        sourceProfileId: 468516,
      },
    },
    update: {
      modelId: model.id,
      title: '0.2mm layer, 2 walls, 15% infill',
      url: 'https://makerworld.com/en/models/550165-utility-carabiner-secure-versatile-everyday-clip#profileId-468516',
      printerCompatibility: ['A1', 'A1 mini', 'P1S'],
      material: 'PLA',
      layerHeightMm: 0.2,
      walls: 2,
      infillPercent: 15,
      printTimeMinutes: 87,
      filamentGrams: 22.4,
      isEstimate: true,
      scrapedAt: now(),
    },
    create: {
      source: Source.makerworld,
      sourceProfileId: 468516,
      modelId: model.id,
      title: '0.2mm layer, 2 walls, 15% infill',
      url: 'https://makerworld.com/en/models/550165-utility-carabiner-secure-versatile-everyday-clip#profileId-468516',
      printerCompatibility: ['A1', 'A1 mini', 'P1S'],
      material: 'PLA',
      layerHeightMm: 0.2,
      walls: 2,
      infillPercent: 15,
      printTimeMinutes: 87,
      filamentGrams: 22.4,
      isEstimate: true,
      scrapedAt: now(),
    },
  });

  await prisma.printProfile.upsert({
    where: {
      source_sourceProfileId: {
        source: Source.makerworld,
        sourceProfileId: 468517,
      },
    },
    update: {
      modelId: model.id,
      title: '0.16mm layer, stronger profile',
      url: 'https://makerworld.com/en/models/550165-utility-carabiner-secure-versatile-everyday-clip#profileId-468517',
      printerCompatibility: ['A1', 'P1S', 'X1C'],
      material: 'PETG',
      layerHeightMm: 0.16,
      walls: 3,
      infillPercent: 25,
      printTimeMinutes: 112,
      filamentGrams: 28.7,
      isEstimate: true,
      scrapedAt: now(),
    },
    create: {
      source: Source.makerworld,
      sourceProfileId: 468517,
      modelId: model.id,
      title: '0.16mm layer, stronger profile',
      url: 'https://makerworld.com/en/models/550165-utility-carabiner-secure-versatile-everyday-clip#profileId-468517',
      printerCompatibility: ['A1', 'P1S', 'X1C'],
      material: 'PETG',
      layerHeightMm: 0.16,
      walls: 3,
      infillPercent: 25,
      printTimeMinutes: 112,
      filamentGrams: 28.7,
      isEstimate: true,
      scrapedAt: now(),
    },
  });

  const tags = await Promise.all(
    [
      { name: 'utility', slug: 'utility' },
      { name: 'carabiner', slug: 'carabiner' },
      { name: 'clip', slug: 'clip' },
      { name: 'tools', slug: 'tools' },
    ].map((tag) =>
      prisma.tag.upsert({
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
      }),
    ),
  );

  await Promise.all(
    tags.map((tag) =>
      prisma.modelTag.upsert({
        where: {
          modelId_tagId: {
            modelId: model.id,
            tagId: tag.id,
          },
        },
        update: {},
        create: {
          modelId: model.id,
          tagId: tag.id,
        },
      }),
    ),
  );

  console.log('Seed completed successfully.');
};

main()
  .catch((error: unknown) => {
    console.error('Seed failed.', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
