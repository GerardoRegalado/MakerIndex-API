import { IndexStatus } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import {
  calculateQualityScore,
  determineIndexStatus,
} from '../../src/services/quality-scoring.service.js';

describe('calculateQualityScore', () => {
  it('sums engagement, tags, and print profiles', () => {
    expect(
      calculateQualityScore({
        downloadCount: 5,
        likeCount: 2,
        commentCount: 1,
        boostCount: 1,
        tags: ['utility', 'clip'],
        printProfiles: [{}, {}],
      }),
    ).toBe(39);
  });

  it('adds bonuses for thumbnailUrl, category, and title', () => {
    expect(
      calculateQualityScore({
        thumbnailUrl: 'https://example.com/thumb.webp',
        category: 'Tools',
        title: 'Utility Clip',
      }),
    ).toBe(13);
  });
});

describe('determineIndexStatus', () => {
  it('returns discarded without title', () => {
    expect(
      determineIndexStatus({
        thumbnailUrl: 'https://example.com/thumb.webp',
      }),
    ).toBe(IndexStatus.discarded);
  });

  it('returns low_quality without thumbnailUrl', () => {
    expect(
      determineIndexStatus({
        title: 'Utility Clip',
      }),
    ).toBe(IndexStatus.low_quality);
  });

  it('returns indexed when downloads >= 5', () => {
    expect(
      determineIndexStatus({
        title: 'Utility Clip',
        thumbnailUrl: 'https://example.com/thumb.webp',
        downloadCount: 5,
      }),
    ).toBe(IndexStatus.indexed);
  });

  it('returns indexed when likes >= 2', () => {
    expect(
      determineIndexStatus({
        title: 'Utility Clip',
        thumbnailUrl: 'https://example.com/thumb.webp',
        likeCount: 2,
      }),
    ).toBe(IndexStatus.indexed);
  });

  it('returns indexed when comments >= 1', () => {
    expect(
      determineIndexStatus({
        title: 'Utility Clip',
        thumbnailUrl: 'https://example.com/thumb.webp',
        commentCount: 1,
      }),
    ).toBe(IndexStatus.indexed);
  });

  it('returns indexed when boosts >= 1', () => {
    expect(
      determineIndexStatus({
        title: 'Utility Clip',
        thumbnailUrl: 'https://example.com/thumb.webp',
        boostCount: 1,
      }),
    ).toBe(IndexStatus.indexed);
  });

  it('returns candidate with basic metadata and a print profile but low engagement', () => {
    expect(
      determineIndexStatus({
        title: 'Utility Clip',
        thumbnailUrl: 'https://example.com/thumb.webp',
        category: 'Tools',
        printProfiles: [{}],
        downloadCount: 0,
        likeCount: 0,
        commentCount: 0,
        boostCount: 0,
      }),
    ).toBe(IndexStatus.candidate);
  });

  it('returns low_quality as fallback', () => {
    expect(
      determineIndexStatus({
        title: 'Utility Clip',
        thumbnailUrl: 'https://example.com/thumb.webp',
      }),
    ).toBe(IndexStatus.low_quality);
  });
});
