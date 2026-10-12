import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { requiredSecret } from '../../../shared/secrets.js';

const accessSecret = () => requiredSecret('JWT_ACCESS_SECRET', 'development-access-secret-change-me');
const refreshSecret = () => requiredSecret('JWT_REFRESH_SECRET', 'development-refresh-secret-change-me');
export const verifyRefreshToken = (token) => jwt.verify(token, refreshSecret(), {
  issuer: 'risewithin',
  algorithms: ['HS256']
});

export const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
export const createTokens = (user) => ({
  accessToken: jwt.sign({ sub: user.id, email: user.email, plan: user.plan, type: 'access' }, accessSecret(), { expiresIn: process.env.JWT_ACCESS_TTL || '15m', issuer: 'risewithin', algorithms: ['HS256'] }),
  refreshToken: jwt.sign({ sub: user.id, type: 'refresh', jti: crypto.randomUUID() }, refreshSecret(), { expiresIn: process.env.JWT_REFRESH_TTL || '30d', issuer: 'risewithin', algorithms: ['HS256'] })
});
