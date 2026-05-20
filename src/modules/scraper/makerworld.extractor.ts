import type { Locator, Page } from 'playwright';
import { ScraperParseError, ScraperRateLimitedError } from './scraper.errors.js';
import type {
  ScrapedCreator,
  ScrapedMakerModel,
  ScrapedPrintProfile,
} from './scraper.types.js';

export type MakerWorldExtractionInput = {
  makerWorldId: number;
  normalizedUrl: string;
};

const RATE_LIMIT_PATTERNS = [
  /too many requests/i,
  /rate limit/i,
  /access denied/i,
  /captcha/i,
  /verify you are human/i,
];

export const safeText = async (locator: Locator): Promise<string | null> => {
  try {
    const text = await locator.first().textContent({ timeout: 1000 });
    const trimmedText = text?.trim();
    return trimmedText ? trimmedText : null;
  } catch {
    return null;
  }
};

export const safeNumberFromText = (text: string | null | undefined): number | null => {
  if (!text) {
    return null;
  }

  const match = text
    .replace(/,/g, '')
    .match(/(-?\d+(?:\.\d+)?)\s*([km])?/i);

  if (!match?.[1]) {
    return null;
  }

  const number = Number(match[1]);

  if (!Number.isFinite(number)) {
    return null;
  }

  const suffix = match[2]?.toLowerCase();
  const multiplier = suffix === 'k' ? 1000 : suffix === 'm' ? 1000000 : 1;

  return Math.round(number * multiplier);
};

export const parsePrintTimeToMinutes = (
  text: string | null | undefined,
): number | null => {
  if (!text) {
    return null;
  }

  const normalizedText = text.trim().toLowerCase();
  const clockMatch = normalizedText.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);

  if (clockMatch?.[1] && clockMatch[2]) {
    return Number(clockMatch[1]) * 60 + Number(clockMatch[2]);
  }

  const hourMatch = normalizedText.match(/(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)/);
  const minuteMatch = normalizedText.match(
    /(\d+(?:\.\d+)?)\s*(?:m|min|mins|minute|minutes)/,
  );

  if (!hourMatch && !minuteMatch) {
    return null;
  }

  const hours = hourMatch?.[1] ? Number(hourMatch[1]) : 0;
  const minutes = minuteMatch?.[1] ? Number(minuteMatch[1]) : 0;

  return Math.round(hours * 60 + minutes);
};

export const parseFilamentGrams = (
  text: string | null | undefined,
): number | null => {
  if (!text) {
    return null;
  }

  const match = text.replace(/,/g, '').match(/(\d+(?:\.\d+)?)\s*(kg|g)\b/i);

  if (!match?.[1] || !match[2]) {
    return null;
  }

  const amount = Number(match[1]);

  if (!Number.isFinite(amount)) {
    return null;
  }

  return match[2].toLowerCase() === 'kg' ? amount * 1000 : amount;
};

const getMetaContent = async (
  page: Page,
  selectors: string[],
): Promise<string | null> =>
  page.evaluate((metaSelectors) => {
    const documentRef = (
      globalThis as unknown as {
        document: {
          querySelector: (selector: string) =>
            | {
                getAttribute: (name: string) => string | null;
              }
            | null;
        };
      }
    ).document;

    for (const selector of metaSelectors) {
      const content = documentRef
        .querySelector(selector)
        ?.getAttribute('content')
        ?.trim();

      if (content) {
        return content;
      }
    }

    return null;
  }, selectors);

const cleanTitle = (title: string | null): string | null => {
  const cleanedTitle = title
    ?.replace(/\s*[-|]\s*MakerWorld\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  return cleanedTitle || null;
};

const extractTagsFromJsonLd = async (page: Page): Promise<string[]> =>
  page.evaluate(() => {
    const documentRef = (
      globalThis as unknown as {
        document: {
          querySelectorAll: (
            selector: string,
          ) => Iterable<{ textContent: string | null }>;
        };
      }
    ).document;
    const tags = new Set<string>();

    for (const script of documentRef.querySelectorAll(
      'script[type="application/ld+json"]',
    )) {
      try {
        const parsedJson = JSON.parse(script.textContent ?? 'null') as unknown;
        const entries = Array.isArray(parsedJson) ? parsedJson : [parsedJson];

        for (const entry of entries) {
          if (!entry || typeof entry !== 'object') {
            continue;
          }

          const keywords = (entry as { keywords?: unknown }).keywords;

          if (typeof keywords === 'string') {
            keywords.split(',').forEach((tag) => {
              const trimmedTag = tag.trim();

              if (trimmedTag) {
                tags.add(trimmedTag);
              }
            });
          }

          if (Array.isArray(keywords)) {
            keywords.forEach((tag) => {
              if (typeof tag === 'string' && tag.trim()) {
                tags.add(tag.trim());
              }
            });
          }
        }
      } catch {
        // Ignore invalid JSON-LD blocks from the page.
      }
    }

    return [...tags];
  });

const extractStat = (pageText: string, labels: string[]): number | undefined => {
  for (const label of labels) {
    const afterLabel = pageText.match(
      new RegExp(`${label}\\s*:?\\s*([\\d,.]+\\s*[km]?)`, 'i'),
    );
    const beforeLabel = pageText.match(
      new RegExp(`([\\d,.]+\\s*[km]?)\\s*${label}`, 'i'),
    );
    const parsedValue = safeNumberFromText(afterLabel?.[1] ?? beforeLabel?.[1]);

    if (parsedValue !== null) {
      return parsedValue;
    }
  }

  return undefined;
};

const extractCreator = async (page: Page): Promise<ScrapedCreator | null> => {
  const creatorUrl = await page
    .locator('a[href*="/@"]')
    .first()
    .getAttribute('href', { timeout: 1000 })
    .catch(() => null);
  const displayName = await safeText(page.locator('a[href*="/@"]'));

  if (!creatorUrl && !displayName) {
    return null;
  }

  const absoluteProfileUrl = creatorUrl
    ? new URL(creatorUrl, 'https://makerworld.com').toString()
    : null;
  const username = absoluteProfileUrl?.match(/\/@([^/?#]+)/)?.[1] ?? null;

  return {
    username,
    displayName,
    profileUrl: absoluteProfileUrl,
  };
};

const extractPrintProfiles = async (
  page: Page,
): Promise<ScrapedPrintProfile[]> =>
  page.evaluate(() => {
    const documentRef = (
      globalThis as unknown as {
        document: {
          querySelectorAll: (
            selector: string,
          ) => Iterable<{
            href: string;
            textContent: string | null;
          }>;
        };
      }
    ).document;
    const profileMap = new Map<number, ScrapedPrintProfile>();

    for (const link of documentRef.querySelectorAll('a[href*="profileId-"]')) {
      const href = link.href;
      const sourceProfileId = Number(href.match(/profileId-(\d+)/)?.[1]);

      if (!Number.isSafeInteger(sourceProfileId) || sourceProfileId <= 0) {
        continue;
      }

      const title = link.textContent?.trim() || null;
      profileMap.set(sourceProfileId, {
        sourceProfileId,
        title,
        url: href,
        isEstimate: true,
      });
    }

    return [...profileMap.values()];
  });

export const extractMakerWorldModelFromPage = async (
  page: Page,
  input: MakerWorldExtractionInput,
): Promise<ScrapedMakerModel> => {
  const pageText = (await page.locator('body').textContent().catch(() => '')) ?? '';

  if (RATE_LIMIT_PATTERNS.some((pattern) => pattern.test(pageText))) {
    throw new ScraperRateLimitedError('MakerWorld page appears rate limited.');
  }

  const title = cleanTitle(
    (await safeText(page.locator('h1'))) ??
      (await getMetaContent(page, [
        'meta[property="og:title"]',
        'meta[name="twitter:title"]',
      ])) ??
      (await page.title().catch(() => null)),
  );

  if (!title || !Number.isSafeInteger(input.makerWorldId)) {
    throw new ScraperParseError('MakerWorld model title or ID could not be parsed.');
  }

  const thumbnailUrl = await getMetaContent(page, [
    'meta[property="og:image"]',
    'meta[name="twitter:image"]',
  ]);
  const description = await getMetaContent(page, [
    'meta[property="og:description"]',
    'meta[name="description"]',
  ]);
  const category = await safeText(page.locator('a[href*="/categories/"]'));
  const tags = await extractTagsFromJsonLd(page);
  const creator = await extractCreator(page);
  const printProfiles = await extractPrintProfiles(page);

  return {
    source: 'makerworld',
    makerWorldId: input.makerWorldId,
    title,
    url: input.normalizedUrl,
    thumbnailUrl,
    description,
    category,
    downloadCount: extractStat(pageText, ['downloads?', 'downloaded']),
    likeCount: extractStat(pageText, ['likes?']),
    commentCount: extractStat(pageText, ['comments?']),
    boostCount: extractStat(pageText, ['boosts?']),
    tags,
    creator,
    printProfiles,
    scrapedAt: new Date(),
  };
};
