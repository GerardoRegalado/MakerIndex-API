export type ScraperSource = 'makerworld';

export type ScraperInput = {
  source: ScraperSource;
  makerWorldId?: number;
  url?: string;
};

export type ScrapedCreator = {
  username?: string | null;
  displayName?: string | null;
  profileUrl?: string | null;
  avatarUrl?: string | null;
  fanCount?: number | null;
  followCount?: number | null;
  level?: number | null;
};

export type ScrapedPrintProfile = {
  sourceProfileId: number;
  title?: string | null;
  url?: string | null;
  printerCompatibility?: unknown;
  material?: string | null;
  layerHeightMm?: number | null;
  walls?: number | null;
  infillPercent?: number | null;
  printTimeMinutes?: number | null;
  filamentGrams?: number | null;
  isEstimate: true;
};

export type ScrapedMakerModel = {
  source: ScraperSource;
  makerWorldId: number;
  internalModelId?: string | null;
  title: string;
  slug?: string | null;
  url: string;
  thumbnailUrl?: string | null;
  description?: string | null;
  license?: string | null;
  category?: string | null;
  downloadCount?: number;
  likeCount?: number;
  commentCount?: number;
  boostCount?: number;
  tags: string[];
  creator?: ScrapedCreator | null;
  printProfiles: ScrapedPrintProfile[];
  scrapedAt: Date;
};
