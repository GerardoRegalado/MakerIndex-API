import { IndexStatus } from '@prisma/client';

export type QualityScoringInput = {
  downloadCount?: number;
  likeCount?: number;
  commentCount?: number;
  boostCount?: number;
  tags?: string[];
  printProfiles?: unknown[];
  thumbnailUrl?: string | null;
  title?: string | null;
  category?: string | null;
  publishedAt?: Date | null;
  scrapedAt?: Date;
};

const hasText = (value: string | null | undefined): boolean =>
  typeof value === 'string' && value.trim().length > 0;

export const calculateQualityScore = (input: QualityScoringInput): number =>
  (input.downloadCount ?? 0) * 1 +
  (input.likeCount ?? 0) * 2 +
  (input.commentCount ?? 0) * 3 +
  (input.boostCount ?? 0) * 5 +
  (input.printProfiles?.length ?? 0) * 10 +
  (input.tags?.length ?? 0) * 1 +
  (hasText(input.thumbnailUrl) ? 5 : 0) +
  (hasText(input.category) ? 3 : 0) +
  (hasText(input.title) ? 5 : 0);

export const determineIndexStatus = (
  input: QualityScoringInput,
): IndexStatus => {
  if (!hasText(input.title)) {
    return IndexStatus.discarded;
  }

  if (!hasText(input.thumbnailUrl)) {
    return IndexStatus.low_quality;
  }

  const hasMinimumEngagement =
    (input.downloadCount ?? 0) >= 5 ||
    (input.likeCount ?? 0) >= 2 ||
    (input.commentCount ?? 0) >= 1 ||
    (input.boostCount ?? 0) >= 1;

  if (hasMinimumEngagement) {
    return IndexStatus.indexed;
  }

  const hasCandidateMetadata =
    hasText(input.category) && (input.printProfiles?.length ?? 0) > 0;

  if (hasCandidateMetadata) {
    return IndexStatus.candidate;
  }

  return IndexStatus.low_quality;
};
