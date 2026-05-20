import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import { scraperConfig } from './scraper.config.js';
import { ScraperTimeoutError } from './scraper.errors.js';
import { extractMakerWorldModelFromPage } from './makerworld.extractor.js';
import type { ScrapedMakerModel } from './scraper.types.js';

export type MakerWorldBrowserInput = {
  makerWorldId: number;
  normalizedUrl: string;
};

const HEAVY_RESOURCE_TYPES = new Set(['font', 'image', 'media']);

export const scrapeMakerWorldModelPage = async (
  input: MakerWorldBrowserInput,
): Promise<ScrapedMakerModel> => {
  let browser: Browser | null = null;
  let context: BrowserContext | null = null;
  let page: Page | null = null;

  try {
    browser = await chromium.launch({
      headless: true,
    });
    context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
    context.setDefaultTimeout(scraperConfig.timeoutMs);
    page = await context.newPage();
    await page.route('**/*', async (route) => {
      const resourceType = route.request().resourceType();

      if (HEAVY_RESOURCE_TYPES.has(resourceType)) {
        await route.abort();
        return;
      }

      await route.continue();
    });
    await page.goto(input.normalizedUrl, {
      waitUntil: 'domcontentloaded',
      timeout: scraperConfig.timeoutMs,
    });
    await page
      .waitForLoadState('networkidle', {
        timeout: Math.min(scraperConfig.timeoutMs, 5000),
      })
      .catch(() => undefined);

    return await extractMakerWorldModelFromPage(page, input);
  } catch (error) {
    if (
      error instanceof Error &&
      (error.name === 'TimeoutError' || /timeout/i.test(error.message))
    ) {
      throw new ScraperTimeoutError('MakerWorld scraping timed out.');
    }

    throw error;
  } finally {
    await page?.close().catch(() => undefined);
    await context?.close().catch(() => undefined);
    await browser?.close().catch(() => undefined);
  }
};
