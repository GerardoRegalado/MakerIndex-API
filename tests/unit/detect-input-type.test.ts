import { describe, expect, it } from 'vitest';
import { detectInputType } from '../../src/utils/detect-input-type.js';

describe('detectInputType', () => {
  it('detects a valid MakerWorld URL as makerworld_url', () => {
    expect(
      detectInputType('https://makerworld.com/en/models/550165-example'),
    ).toBe('makerworld_url');
  });

  it('detects a numeric ID as makerworld_id', () => {
    expect(detectInputType('550165')).toBe('makerworld_id');
  });

  it('detects text as search_query', () => {
    expect(detectInputType('utility carabiner')).toBe('search_query');
  });

  it('trims spaces before detecting', () => {
    expect(detectInputType('   utility carabiner   ')).toBe('search_query');
    expect(detectInputType('   550165   ')).toBe('makerworld_id');
  });

  it('throws for an empty string', () => {
    expect(() => detectInputType('')).toThrow('Input cannot be empty');
  });

  it('throws for a string with only spaces', () => {
    expect(() => detectInputType('   ')).toThrow('Input cannot be empty');
  });

  it('throws a clear error for unsupported URL inputs', () => {
    expect(() =>
      detectInputType('https://example.com/en/models/550165-example'),
    ).toThrow('Unsupported URL input');
  });

  it('does not confuse mixed alphanumeric text with numeric IDs', () => {
    expect(detectInputType('abc123')).toBe('search_query');
  });
});
