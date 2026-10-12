import jwt from 'jsonwebtoken';
import { createTokens, hashToken } from '../tokens.js';
test('creates a short-lived access token and hashes refresh tokens deterministically', () => {
  process.env.JWT_ACCESS_SECRET = 'test-access-secret-with-enough-entropy';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-with-enough-entropy';
  const tokens = createTokens({ id: '5c9ba268-2503-4c5e-8ca6-cd28169d4e13', email: 'test@example.com', plan: 'FREE' });
  expect(jwt.verify(tokens.accessToken, process.env.JWT_ACCESS_SECRET).sub).toBe('5c9ba268-2503-4c5e-8ca6-cd28169d4e13');
  expect(hashToken(tokens.refreshToken)).toHaveLength(64);
});
