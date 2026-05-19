# MakerIndex API

Unofficial REST API for public MakerWorld model metadata.

## Scripts

- `pnpm dev`: run the local development server.
- `pnpm build`: build the TypeScript server into `dist/`.
- `pnpm start`: run the built server.
- `pnpm test`: run Vitest once.
- `pnpm test:watch`: run Vitest in watch mode.
- `pnpm prisma:generate`: generate Prisma Client.
- `pnpm prisma:migrate`: create and apply a local/dev Prisma migration.
- `pnpm prisma:studio`: open Prisma Studio.
- `pnpm prisma:format`: format the Prisma schema.
- `pnpm prisma:seed`: seed local/dev data through Prisma.

## Local development

1. Install dependencies:

```bash
pnpm install
```

If `pnpm` is not available in your shell, use Corepack:

```bash
corepack pnpm install
```

2. Create a local environment file:

```bash
cp .env.example .env
```

3. Start the server:

```bash
pnpm dev
```

## Prisma and Supabase

MakerIndex API uses Prisma with Supabase Postgres.

Required database variables:

```env
DATABASE_URL=""
DIRECT_URL=""
```

- `DATABASE_URL` is used by the app at runtime.
- `DIRECT_URL` is used by Prisma for migrations when Supabase requires a direct database connection.
- Do not commit real database credentials or Supabase secrets.

Generate Prisma Client:

```bash
pnpm prisma:generate
```

Create the initial local/dev migration after setting real database URLs:

```bash
pnpm prisma:migrate --name init
```

Seed development data after migrations are applied:

```bash
pnpm prisma:seed
```

The seed data is fictitious development data for testing future API endpoints without scraping. It stores example metadata and example image URLs only; it does not download assets, store images, or download model files.

## Scraper foundation

The MakerWorld scraper is not active yet. This repository currently includes only conservative scraper contracts, types, config, and placeholder errors for a future implementation.

Default scraper configuration:

```env
SCRAPER_ENABLED=false
SCRAPER_TIMEOUT_MS=15000
SCRAPER_MAX_RETRIES=1
SCRAPER_MIN_DELAY_MS=3000
```

- `SCRAPER_ENABLED=false` is the default and the current service still refuses to scrape.
- No real scraping runs in this phase.
- No Playwright browser is launched.
- No external HTTP calls are made by the scraper placeholder.
- No STL, 3MF, model files, or images are downloaded.
- No images are stored.
- Future scraping should remain punctual, conservative, rate-limited, and separate from search.

## Health checks

`GET /health` validates that the API process is running. It does not touch the database, so it can still return `200` while Supabase/Postgres is paused or unreachable.

```bash
curl http://localhost:3000/health
```

Expected shape:

```json
{
  "status": "ok",
  "uptime": 123.45,
  "timestamp": "2026-05-10T00:00:00.000Z",
  "version": "0.1.0"
}
```

`GET /api/v1/health/db` validates the database connection with a minimal Prisma query.

```bash
curl http://localhost:3000/api/v1/health/db
```

Expected shape when the database is reachable:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "database": "reachable"
  },
  "error": null,
  "metadata": {
    "apiVersion": "v1"
  }
}
```

If the database is unavailable, the endpoint returns `503 DATABASE_UNAVAILABLE` without exposing connection strings, database hosts, stack traces, or internal Prisma details.

## API documentation

Swagger UI documents the current public endpoints:

- `GET /health`
- `GET /api/v1/health/db`
- `GET /api/v1/models/search`
- `GET /api/v1/models/:makerWorldId`
- `GET /api/v1/models/resolve`

Start the local server and open:

```text
http://localhost:3000/docs
```

The OpenAPI JSON is available at:

```text
http://localhost:3000/docs/json
```

For `GET /api/v1/models/resolve`, encode `#` as `%23` when passing a MakerWorld profile URL inside the `url` query parameter:

```text
http://localhost:3000/api/v1/models/resolve?url=https://makerworld.com/en/models/550165-utility-carabiner-secure-versatile-everyday-clip%23profileId-468516
```
