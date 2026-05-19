export class ScraperDisabledError extends Error {
  constructor(message = 'Scraper is disabled.') {
    super(message);
    this.name = 'ScraperDisabledError';
  }
}

export class UnsupportedScraperInputError extends Error {
  constructor(message = 'Unsupported scraper input.') {
    super(message);
    this.name = 'UnsupportedScraperInputError';
  }
}

export class ScraperTimeoutError extends Error {
  constructor(message = 'Scraper timed out.') {
    super(message);
    this.name = 'ScraperTimeoutError';
  }
}

export class ScraperParseError extends Error {
  constructor(message = 'Scraper could not parse the source content.') {
    super(message);
    this.name = 'ScraperParseError';
  }
}

export class ScraperRateLimitedError extends Error {
  constructor(message = 'Scraper request was rate limited.') {
    super(message);
    this.name = 'ScraperRateLimitedError';
  }
}
