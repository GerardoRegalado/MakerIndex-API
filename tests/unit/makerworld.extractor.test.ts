import { describe, expect, it } from 'vitest';
import {
  parseFilamentGrams,
  parsePrintTimeToMinutes,
  safeNumberFromText,
} from '../../src/modules/scraper/makerworld.extractor.js';

describe('makerworld extractor helpers', () => {
  it('parses safe numbers from compact text', () => {
    expect(safeNumberFromText('1,234 downloads')).toBe(1234);
    expect(safeNumberFromText('1.2k likes')).toBe(1200);
    expect(safeNumberFromText('2m views')).toBe(2000000);
    expect(safeNumberFromText('no number')).toBeNull();
  });

  it('parses print time to minutes', () => {
    expect(parsePrintTimeToMinutes('1h 30m')).toBe(90);
    expect(parsePrintTimeToMinutes('2 hours 5 minutes')).toBe(125);
    expect(parsePrintTimeToMinutes('45 min')).toBe(45);
    expect(parsePrintTimeToMinutes('01:30')).toBe(90);
    expect(parsePrintTimeToMinutes('unknown')).toBeNull();
  });

  it('parses filament weight to grams', () => {
    expect(parseFilamentGrams('22.4 g')).toBe(22.4);
    expect(parseFilamentGrams('0.5 kg')).toBe(500);
    expect(parseFilamentGrams('1,234g')).toBe(1234);
    expect(parseFilamentGrams('unknown')).toBeNull();
  });
});
