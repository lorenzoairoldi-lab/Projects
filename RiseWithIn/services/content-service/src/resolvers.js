import { contentModel } from './models/contentModel.js';
import { requireUser } from './middleware/auth.js';
import { cacheGet, cacheSet } from '../../../shared/cache.js';

const paidPlans = new Set(['PRO', 'PREMIUM']);
const canReadBody = (content, user) => !content.premium || paidPlans.has(user?.plan);
const map = (content) => ({ ...content, publishedAt: content.publishedAt.toISOString() });

export default {
  Content: {
    // Field-level authorization prevents alternate queries from bypassing the paywall.
    body: (content, _args, context) => canReadBody(content, context.user) ? content.body : null
  },
  Query: {
    contents: async (_parent, args) => {
      const key = `content:list:${args.limit || 20}:${args.offset || 0}:${args.category || ''}:${args.type || ''}`;
      const result = await cacheGet(key) || await cacheSet(key, await contentModel.list(args));
      return { ...result, items: result.items.map(map) };
    },
    content: async (_parent, { slug }) => {
      const content = await cacheGet(`content:item:${slug}`) || await cacheSet(`content:item:${slug}`, await contentModel.get(slug), 120);
      return content && map(content);
    }
  },
  Mutation: {
    markContentViewed: (_parent, { id }, context) => contentModel.view(id, requireUser(context).sub)
  }
};
