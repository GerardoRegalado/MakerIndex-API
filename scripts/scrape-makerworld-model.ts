import { fetchMakerWorldModelMetadata } from '../src/modules/scraper/scraper.service.js';

const url = process.argv[2];

if (!url) {
  console.error('Usage: pnpm scraper:debug "<makerworld-model-url>"');
  process.exit(1);
}

try {
  const model = await fetchMakerWorldModelMetadata({
    source: 'makerworld',
    url,
  });

  console.log(JSON.stringify(model, null, 2));
} catch (error) {
  if (error instanceof Error) {
    console.error(`${error.name}: ${error.message}`);
  } else {
    console.error('Unknown scraper error.');
  }

  process.exit(1);
}
