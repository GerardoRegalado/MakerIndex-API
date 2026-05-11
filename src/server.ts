import { buildApp } from './app.js';
import { env } from './config/env.js';

const app = await buildApp();

const shutdown = async (signal: NodeJS.Signals) => {
  app.log.info({ signal }, 'Shutting down server');

  try {
    await app.close();
    process.exit(0);
  } catch (error) {
    app.log.error({ error }, 'Error while shutting down server');
    process.exit(1);
  }
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

try {
  await app.listen({
    port: env.PORT,
    host: '0.0.0.0',
  });

  app.log.info(`MakerIndex API listening at http://localhost:${env.PORT}`);
} catch (error) {
  app.log.error({ error }, 'Failed to start server');
  process.exit(1);
}
