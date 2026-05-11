import { describe, expect, it } from 'vitest';
import { parseMakerWorldUrl } from '../../src/utils/parse-makerworld-url.js';

describe('parseMakerWorldUrl', () => {
  it('parses a valid URL with makerWorldId and profileId', () => {
    expect(
      parseMakerWorldUrl(
        'https://makerworld.com/en/models/550165-utility-carabiner-secure-versatile-everyday-clip?from=recommend#profileId-468516',
      ),
    ).toEqual({
      makerWorldId: 550165,
      profileId: 468516,
      normalizedUrl:
        'https://makerworld.com/en/models/550165-utility-carabiner-secure-versatile-everyday-clip',
    });
  });

  it('parses a valid URL without profileId', () => {
    expect(
      parseMakerWorldUrl(
        'https://makerworld.com/en/models/550165-utility-carabiner-secure-versatile-everyday-clip',
      ),
    ).toEqual({
      makerWorldId: 550165,
      profileId: null,
      normalizedUrl:
        'https://makerworld.com/en/models/550165-utility-carabiner-secure-versatile-everyday-clip',
    });
  });

  it('removes query params and hash from normalizedUrl', () => {
    const parsed = parseMakerWorldUrl(
      'https://makerworld.com/en/models/550165-utility-carabiner-secure-versatile-everyday-clip?from=search#profileId-468516',
    );

    expect(parsed.normalizedUrl).toBe(
      'https://makerworld.com/en/models/550165-utility-carabiner-secure-versatile-everyday-clip',
    );
  });

  it('supports www.makerworld.com', () => {
    expect(
      parseMakerWorldUrl(
        'https://www.makerworld.com/en/models/550165-utility-carabiner-secure-versatile-everyday-clip#profileId-468516',
      ),
    ).toEqual({
      makerWorldId: 550165,
      profileId: 468516,
      normalizedUrl:
        'https://www.makerworld.com/en/models/550165-utility-carabiner-secure-versatile-everyday-clip',
    });
  });

  it('rejects an invalid domain', () => {
    expect(() =>
      parseMakerWorldUrl('https://example.com/en/models/550165-example'),
    ).toThrow('Invalid MakerWorld domain');
  });

  it('rejects fake MakerWorld subdomains or lookalikes', () => {
    expect(() =>
      parseMakerWorldUrl('https://fake-makerworld.com/en/models/550165-example'),
    ).toThrow('Invalid MakerWorld domain');

    expect(() =>
      parseMakerWorldUrl('https://makerworld.fake.com/en/models/550165-example'),
    ).toThrow('Invalid MakerWorld domain');
  });

  it('rejects URLs without /models/:id', () => {
    expect(() =>
      parseMakerWorldUrl('https://makerworld.com/en/collections/550165-example'),
    ).toThrow('MakerWorld model ID not found');
  });

  it('rejects malformed URLs', () => {
    expect(() => parseMakerWorldUrl('not a url')).toThrow(
      'Invalid MakerWorld URL',
    );
  });

  it('rejects non-numeric model IDs', () => {
    expect(() =>
      parseMakerWorldUrl('https://makerworld.com/en/models/not-a-number'),
    ).toThrow('Invalid MakerWorld model ID');
  });

  it('does not include query params or hash in normalizedUrl', () => {
    const parsed = parseMakerWorldUrl(
      'https://makerworld.com/en/models/550165-example?from=search&foo=bar#profileId-468516',
    );

    expect(parsed.normalizedUrl).not.toContain('?');
    expect(parsed.normalizedUrl).not.toContain('#');
  });
});
