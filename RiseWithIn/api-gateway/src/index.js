import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import { ApolloGateway, IntrospectAndCompose } from '@apollo/gateway';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express4';
import { serviceList } from './schema.js';
import { AuthenticatedDataSource } from './resolvers.js';
import { collectDefaultMetrics, Counter, Histogram, register } from 'prom-client';

collectDefaultMetrics({ prefix: 'risewithin_gateway_' });
const requests = new Counter({ name: 'risewithin_gateway_http_requests_total', help: 'HTTP requests received by the gateway', labelNames: ['method', 'route', 'status'] });
const latency = new Histogram({ name: 'risewithin_gateway_http_request_duration_seconds', help: 'Gateway request latency', labelNames: ['method', 'route'], buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5] });

const app = express();
app.disable('x-powered-by');
app.use(pinoHttp({ name: 'api-gateway' }));
app.use((req, res, next) => { const start = process.hrtime.bigint(); res.on('finish', () => { const route = req.path === '/graphql' ? '/graphql' : req.path; requests.inc({ method: req.method, route, status: String(res.statusCode) }); latency.observe({ method: req.method, route }, Number(process.hrtime.bigint() - start) / 1e9); }); next(); });
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','), credentials: true }));
app.use(rateLimit({ windowMs: 60_000, limit: Number(process.env.RATE_LIMIT || 300), standardHeaders: true, legacyHeaders: false }));
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'api-gateway' }));
app.get('/metrics', async (_req, res) => { res.type(register.contentType); res.send(await register.metrics()); });

const gateway = new ApolloGateway({
  supergraphSdl: new IntrospectAndCompose({
    subgraphs: serviceList,
    pollIntervalInMs: Number(process.env.FEDERATION_POLL_MS || 30_000)
  }),
  buildService: ({ url }) => new AuthenticatedDataSource({ url })
});
const server = new ApolloServer({ gateway, introspection: process.env.NODE_ENV !== 'production' });
await server.start();
app.use('/graphql', express.json({ limit: '1mb' }), expressMiddleware(server, {
  context: async ({ req }) => ({ authorization: req.headers.authorization, requestId: req.id, timezone: req.headers['x-timezone'] })
}));
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
app.use((error, req, res, _next) => {
  req.log.error({ err: error }, 'unhandled_gateway_error');
  res.status(error.status || 500).json({ error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
});

const port = Number(process.env.PORT || 4000);
app.listen(port, '0.0.0.0', () => console.log(JSON.stringify({ level: 'info', message: 'gateway_started', port })));
