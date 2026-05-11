# MakerIndex API

Unofficial REST API for public MakerWorld model metadata.

## Scripts

- `pnpm dev`: run the local development server.
- `pnpm build`: build the TypeScript server into `dist/`.
- `pnpm start`: run the built server.
- `pnpm test`: run Vitest once.
- `pnpm test:watch`: run Vitest in watch mode.

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

## Health check

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
