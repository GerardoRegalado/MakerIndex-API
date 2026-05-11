-- CreateEnum
CREATE TYPE "Source" AS ENUM ('makerworld');

-- CreateEnum
CREATE TYPE "IndexStatus" AS ENUM ('candidate', 'indexed', 'low_quality', 'discarded');

-- CreateTable
CREATE TABLE "Creator" (
    "id" TEXT NOT NULL,
    "source" "Source" NOT NULL DEFAULT 'makerworld',
    "username" TEXT,
    "displayName" TEXT,
    "profileUrl" TEXT,
    "avatarUrl" TEXT,
    "fanCount" INTEGER,
    "followCount" INTEGER,
    "level" INTEGER,
    "scrapedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Creator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MakerModel" (
    "id" TEXT NOT NULL,
    "source" "Source" NOT NULL DEFAULT 'makerworld',
    "makerWorldId" INTEGER NOT NULL,
    "internalModelId" TEXT,
    "title" TEXT NOT NULL,
    "slug" TEXT,
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "description" TEXT,
    "license" TEXT,
    "category" TEXT,
    "creatorId" TEXT,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "commentCount" INTEGER NOT NULL DEFAULT 0,
    "boostCount" INTEGER NOT NULL DEFAULT 0,
    "qualityScore" INTEGER NOT NULL DEFAULT 0,
    "indexStatus" "IndexStatus" NOT NULL DEFAULT 'candidate',
    "skipReason" TEXT,
    "firstScrapedAt" TIMESTAMP(3),
    "lastScrapedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MakerModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrintProfile" (
    "id" TEXT NOT NULL,
    "source" "Source" NOT NULL DEFAULT 'makerworld',
    "sourceProfileId" INTEGER NOT NULL,
    "modelId" TEXT NOT NULL,
    "title" TEXT,
    "url" TEXT,
    "printerCompatibility" JSONB,
    "material" TEXT,
    "layerHeightMm" DOUBLE PRECISION,
    "walls" INTEGER,
    "infillPercent" INTEGER,
    "printTimeMinutes" INTEGER,
    "filamentGrams" DOUBLE PRECISION,
    "isEstimate" BOOLEAN NOT NULL DEFAULT true,
    "scrapedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrintProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "source" "Source" NOT NULL DEFAULT 'makerworld',
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModelTag" (
    "modelId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModelTag_pkey" PRIMARY KEY ("modelId","tagId")
);

-- CreateIndex
CREATE INDEX "Creator_username_idx" ON "Creator"("username");

-- CreateIndex
CREATE INDEX "Creator_source_idx" ON "Creator"("source");

-- CreateIndex
CREATE UNIQUE INDEX "MakerModel_makerWorldId_key" ON "MakerModel"("makerWorldId");

-- CreateIndex
CREATE INDEX "MakerModel_source_idx" ON "MakerModel"("source");

-- CreateIndex
CREATE INDEX "MakerModel_title_idx" ON "MakerModel"("title");

-- CreateIndex
CREATE INDEX "MakerModel_category_idx" ON "MakerModel"("category");

-- CreateIndex
CREATE INDEX "MakerModel_indexStatus_idx" ON "MakerModel"("indexStatus");

-- CreateIndex
CREATE INDEX "MakerModel_creatorId_idx" ON "MakerModel"("creatorId");

-- CreateIndex
CREATE INDEX "PrintProfile_modelId_idx" ON "PrintProfile"("modelId");

-- CreateIndex
CREATE INDEX "PrintProfile_source_idx" ON "PrintProfile"("source");

-- CreateIndex
CREATE INDEX "PrintProfile_material_idx" ON "PrintProfile"("material");

-- CreateIndex
CREATE UNIQUE INDEX "PrintProfile_source_sourceProfileId_key" ON "PrintProfile"("source", "sourceProfileId");

-- CreateIndex
CREATE INDEX "Tag_name_idx" ON "Tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_source_slug_key" ON "Tag"("source", "slug");

-- CreateIndex
CREATE INDEX "ModelTag_tagId_idx" ON "ModelTag"("tagId");

-- AddForeignKey
ALTER TABLE "MakerModel" ADD CONSTRAINT "MakerModel_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrintProfile" ADD CONSTRAINT "PrintProfile_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "MakerModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModelTag" ADD CONSTRAINT "ModelTag_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "MakerModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModelTag" ADD CONSTRAINT "ModelTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
