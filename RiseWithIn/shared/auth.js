import jwt from 'jsonwebtoken';
import { requiredSecret } from './secrets.js';

export const accessTokenSecret = () => requiredSecret('JWT_ACCESS_SECRET', 'development-access-secret-change-me');

export const readIdentity = (authorization = '') => {
  if (!authorization.startsWith('Bearer ')) return null;
  try {
    const identity = jwt.verify(authorization.slice(7), accessTokenSecret(), { issuer: 'risewithin', algorithms: ['HS256'] });
    return identity.type === 'access' ? identity : null;
  } catch {
    return null;
  }
};

export const requireUser = (context) => {
  if (!context.user?.sub) {
    const error = new Error('Authentication required');
    error.extensions = { code: 'UNAUTHENTICATED' };
    throw error;
  }
  return context.user;
};

export const requirePlan = (context, plans) => {
  const user = requireUser(context);
  if (!plans.includes(user.plan || 'FREE')) {
    const error = new Error(`This feature requires: ${plans.join(' or ')}`);
    error.extensions = { code: 'FORBIDDEN' };
    throw error;
  }
  return user;
};
