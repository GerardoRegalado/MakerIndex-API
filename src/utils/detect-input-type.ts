import { parseMakerWorldUrl } from './parse-makerworld-url.js';

export type InputType = 'makerworld_url' | 'makerworld_id' | 'search_query';

const POSITIVE_INTEGER_PATTERN = /^[1-9]\d*$/;
const HTTP_URL_PATTERN = /^https?:\/\//i;

export const detectInputType = (input: string): InputType => {
  const trimmedInput = input.trim();

  if (!trimmedInput) {
    throw new Error('Input cannot be empty');
  }

  if (HTTP_URL_PATTERN.test(trimmedInput)) {
    try {
      parseMakerWorldUrl(trimmedInput);
      return 'makerworld_url';
    } catch {
      throw new Error('Unsupported URL input');
    }
  }

  if (POSITIVE_INTEGER_PATTERN.test(trimmedInput)) {
    return 'makerworld_id';
  }

  return 'search_query';
};
