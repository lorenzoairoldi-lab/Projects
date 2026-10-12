import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { authModel } from './models/authModel.js';
import { createTokens, hashToken, verifyRefreshToken } from './tokens.js';
import { publish } from '../../../shared/events.js';

const credentials = z.object({ email: z.string().email().max(254), password: z.string().min(10).max(128) });
const expose = (user) => ({ id: user.id, email: user.email, plan: user.plan, createdAt: user.created_at.toISOString() });
const issue = async (user) => {
  const tokens = createTokens(user);
  const decoded = jwt.decode(tokens.refreshToken);
  await authModel.saveRefresh(randomUUID(), user.id, hashToken(tokens.refreshToken), new Date(decoded.exp * 1000));
  return { ...tokens, user: expose(user) };
};
const invalid = () => { const error = new Error('Invalid email or password'); error.extensions = { code: 'UNAUTHENTICATED' }; throw error; };

export default {
  User: { __resolveReference: ({ id }) => authModel.byId(id).then((u) => u && expose(u)) },
  Query: { me: (_p, _a, ctx) => ctx.user?.sub ? authModel.byId(ctx.user.sub).then((u) => u && expose(u)) : null },
  Mutation: {
    register: async (_p, args) => {
      const input = credentials.parse(args);
      if (await authModel.byEmail(input.email)) { const e = new Error('Email already registered'); e.extensions = { code: 'BAD_USER_INPUT' }; throw e; }
      const user = await authModel.createUser(randomUUID(), input.email, await bcrypt.hash(input.password, 12));
      await publish('user.registered', { userId: user.id, email: user.email });
      return issue(user);
    },
    login: async (_p, args) => {
      const input = credentials.parse(args); const user = await authModel.byEmail(input.email);
      if (!user || !(await bcrypt.compare(input.password, user.password_hash))) return invalid();
      return issue(user);
    },
    refreshToken: async (_p, { token }) => {
      try {
        const claims = verifyRefreshToken(token);
        if (claims.type !== 'refresh' || !claims.sub || !claims.jti) return invalid();
      } catch { return invalid(); }
      const stored = await authModel.validRefresh(hashToken(token)); if (!stored) return invalid();
      await authModel.revoke(hashToken(token)); const user = await authModel.byId(stored.user_id); return issue(user);
    },
    logout: (_p, { token }) => authModel.revoke(hashToken(token))
  }
};
