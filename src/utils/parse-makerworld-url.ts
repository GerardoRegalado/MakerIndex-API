export type ParsedMakerWorldUrl = {
  makerWorldId: number;
  profileId: number | null;
  normalizedUrl: string;
};

const VALID_MAKERWORLD_DOMAINS = new Set([
  'makerworld.com',
  'www.makerworld.com',
]);

const MODEL_ID_PATTERN = /^(\d+)(?:-|$)/;
const PROFILE_ID_PATTERN = /(?:^|[#&])profileId-(\d+)(?:$|[&-])/;

export const parseMakerWorldUrl = (input: string): ParsedMakerWorldUrl => {
  const trimmedInput = input.trim();
  let url: URL;

  try {
    url = new URL(trimmedInput);
  } catch {
    throw new Error('Invalid MakerWorld URL');
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Invalid MakerWorld URL');
  }

  if (!VALID_MAKERWORLD_DOMAINS.has(url.hostname.toLowerCase())) {
    throw new Error('Invalid MakerWorld domain');
  }

  const pathSegments = url.pathname.split('/').filter(Boolean);
  const modelsSegmentIndex = pathSegments.indexOf('models');
  const modelSegment =
    modelsSegmentIndex >= 0 ? pathSegments[modelsSegmentIndex + 1] : undefined;

  if (!modelSegment) {
    throw new Error('MakerWorld model ID not found');
  }

  const modelIdMatch = modelSegment.match(MODEL_ID_PATTERN);

  if (!modelIdMatch?.[1]) {
    throw new Error('Invalid MakerWorld model ID');
  }

  const makerWorldId = Number(modelIdMatch[1]);

  if (!Number.isSafeInteger(makerWorldId) || makerWorldId <= 0) {
    throw new Error('Invalid MakerWorld model ID');
  }

  const profileIdMatch = url.hash.match(PROFILE_ID_PATTERN);
  const profileId = profileIdMatch?.[1] ? Number(profileIdMatch[1]) : null;
  const normalizedPathname = url.pathname.replace(/\/+$/, '');

  return {
    makerWorldId,
    profileId,
    normalizedUrl: `${url.origin}${normalizedPathname}`,
  };
};
