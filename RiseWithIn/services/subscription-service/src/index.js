import express from 'express';
import { startSubgraph } from '../../../shared/server.js';
import { requiredSecret } from '../../../shared/secrets.js';
import typeDefs from './schema.js';
import resolvers, { stripeClient } from './resolvers.js';
import { initSubscriptions, subscriptionModel } from './models/subscriptionModel.js';
import { publish } from '../../../shared/events.js';

const configureApp = (app) => app.post('/stripe/webhook', express.raw({ type: 'application/json', limit: '1mb' }), async (req, res) => {
  let event;
  try {
    event = stripeClient().webhooks.constructEvent(
      req.body,
      req.headers['stripe-signature'],
      requiredSecret('STRIPE_WEBHOOK_SECRET', 'whsec_development_placeholder')
    );
  } catch (error) {
    req.log.warn({ err: error }, 'stripe_webhook_rejected');
    return res.status(400).json({ error: 'Invalid webhook signature' });
  }
  const object = event.data.object;
  if (event.type.startsWith('customer.subscription.')) {
    const status = object.status === 'active' || object.status === 'trialing'
      ? 'ACTIVE'
      : object.status === 'past_due' ? 'PAST_DUE' : 'CANCELED';
    const plan = status === 'CANCELED' ? 'FREE' : object.metadata?.plan;
    const updated = await subscriptionModel.syncByCustomer(String(object.customer), {
      plan,
      status,
      subscriptionId: object.id,
      periodEnd: object.current_period_end ? new Date(object.current_period_end * 1000) : null
    });
    if (updated) await publish('subscription.updated', { userId: updated.user_id, plan: updated.plan, status: updated.status });
  }
  return res.json({ received: true });
});

startSubgraph({
  serviceName: 'subscription-service',
  port: Number(process.env.PORT || 4009),
  typeDefs,
  resolvers,
  initialize: initSubscriptions,
  configureApp
});
