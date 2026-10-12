import Stripe from 'stripe';
import { subscriptionModel } from './models/subscriptionModel.js';
import { requireUser } from './middleware/auth.js';
import { requiredSecret } from '../../../shared/secrets.js';

export const stripeClient = () => new Stripe(requiredSecret('STRIPE_SECRET_KEY', 'sk_test_placeholder'));
const plans = [
  { id: 'FREE', name: 'Free', priceCents: 0, features: ['Abitudini', 'Obiettivi', 'Routine base'] },
  { id: 'PRO', name: 'Pro', priceCents: 999, features: ['Focus illimitato', 'Contenuti premium', 'Analytics avanzati'] },
  { id: 'PREMIUM', name: 'Premium', priceCents: 1999, features: ['Community', 'Coaching', 'Supporto prioritario'] }
];
const map = (subscription) => ({
  id: subscription.id,
  userId: subscription.user_id,
  plan: subscription.plan,
  status: subscription.status,
  currentPeriodEnd: subscription.current_period_end?.toISOString(),
  customerId: subscription.stripe_customer_id
});
const checkoutUrl = (value) => {
  const parsed = new URL(value);
  const allowedOrigins = new Set((process.env.CORS_ORIGINS || 'http://localhost:3000').split(',').map((origin) => origin.trim()));
  if (!['http:', 'https:'].includes(parsed.protocol) || !allowedOrigins.has(parsed.origin)) {
    throw new Error('Redirect URL is not allowed');
  }
  return parsed.toString();
};

export default {
  Query: {
    plans: () => plans,
    mySubscription: (_parent, _args, context) => subscriptionModel.get(requireUser(context).sub).then(map)
  },
  Mutation: {
    createCheckoutSession: async (_parent, { plan, successUrl, cancelUrl }, context) => {
      const user = requireUser(context);
      const subscription = await subscriptionModel.get(user.sub);
      if (plan === 'FREE') throw new Error('Free plan does not require checkout');
      let customer = subscription.stripe_customer_id;
      if (!customer) {
        const created = await stripeClient().customers.create({ email: user.email, metadata: { userId: user.sub } });
        customer = created.id;
        await subscriptionModel.customer(user.sub, customer);
      }
      const price = plan === 'PRO' ? process.env.STRIPE_PRO_PRICE_ID : process.env.STRIPE_PREMIUM_PRICE_ID;
      if (!price) throw new Error('Stripe price is not configured');
      const session = await stripeClient().checkout.sessions.create({
        mode: 'subscription',
        customer,
        line_items: [{ price, quantity: 1 }],
        success_url: checkoutUrl(successUrl),
        cancel_url: checkoutUrl(cancelUrl),
        metadata: { userId: user.sub, plan },
        subscription_data: { metadata: { userId: user.sub, plan } }
      });
      return { url: session.url };
    },
    createBillingPortal: async (_parent, { returnUrl }, context) => {
      const subscription = await subscriptionModel.get(requireUser(context).sub);
      if (!subscription.stripe_customer_id) throw new Error('No billing account found');
      const session = await stripeClient().billingPortal.sessions.create({
        customer: subscription.stripe_customer_id,
        return_url: checkoutUrl(returnUrl)
      });
      return { url: session.url };
    },
    cancelSubscription: async (_parent, _args, context) => {
      const subscription = await subscriptionModel.get(requireUser(context).sub);
      if (!subscription.stripe_subscription_id) return false;
      await stripeClient().subscriptions.cancel(subscription.stripe_subscription_id);
      return true;
    }
  }
};
