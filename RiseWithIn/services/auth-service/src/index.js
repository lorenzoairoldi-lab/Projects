import { startSubgraph } from '../../../shared/server.js';
import typeDefs from './schema.js';
import resolvers from './resolvers.js';
import { authModel, initAuth } from './models/authModel.js';
import { subscribe } from '../../../shared/events.js';

const initialize = async () => {
  await initAuth();
  await subscribe(['subscription.updated'], async (_key, payload) => {
    if (!payload?.userId || !['FREE', 'PRO', 'PREMIUM'].includes(payload.plan)) return;
    await authModel.updatePlan(payload.userId, payload.plan);
  }, { queueName: 'risewithin.auth-plan-sync' });
};

startSubgraph({ serviceName: 'auth-service', port: Number(process.env.PORT || 4001), typeDefs, resolvers, initialize });
