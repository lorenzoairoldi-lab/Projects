import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express4';
import { buildSubgraphSchema } from '@apollo/subgraph';
import { collectDefaultMetrics, register } from 'prom-client';
import { accessTokenSecret, readIdentity } from './auth.js';

let metricsStarted = false;
export const startSubgraph = async ({ serviceName, port, typeDefs, resolvers, initialize, configureApp }) => {
  accessTokenSecret();
  if (!metricsStarted) { collectDefaultMetrics({ prefix: 'risewithin_' }); metricsStarted = true; }
  if (initialize) await initialize();
  const app = express();
  app.disable('x-powered-by');
  app.use(pinoHttp({ name: serviceName }));
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','), credentials: true }));
  app.use(rateLimit({ windowMs: 60_000, limit: Number(process.env.RATE_LIMIT || 200), standardHeaders: true, legacyHeaders: false }));
  app.get('/health', (_req, res) => res.json({ status: 'ok', service: serviceName }));
  app.get('/ready', (_req, res) => res.json({ status: 'ready', service: serviceName }));
  app.get('/metrics', async (_req, res) => { res.type(register.contentType); res.send(await register.metrics()); });
  if (configureApp) await configureApp(app);
  const server = new ApolloServer({
    schema: buildSubgraphSchema([{ typeDefs, resolvers }]),
    formatError: (formatted, error) => {
      console.error(JSON.stringify({ level: 'error', service: serviceName, message: formatted.message, path: formatted.path, stack: process.env.NODE_ENV === 'development' ? error.stack : undefined }));
      return process.env.NODE_ENV === 'production' && formatted.extensions?.code === 'INTERNAL_SERVER_ERROR'
        ? { message: 'Internal server error', extensions: { code: 'INTERNAL_SERVER_ERROR' } } : formatted;
    }
  });
  await server.start();
  app.use('/graphql', express.json({ limit: '1mb' }), expressMiddleware(server, { context: async ({ req }) => ({ user: readIdentity(req.headers.authorization), requestId: req.id, timezone: req.headers['x-timezone'] || 'UTC' }) }));
  app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
  app.use((error, req, res, _next) => {
    req.log.error({ err: error }, 'unhandled_http_error');
    res.status(error.status || 500).json({ error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  });
  app.listen(port, '0.0.0.0', () => console.log(JSON.stringify({ level: 'info', message: 'service_started', service: serviceName, port })));
};
