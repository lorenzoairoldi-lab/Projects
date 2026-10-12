import { redis } from './redis.js';
const defaultTtl = () => Math.max(1, Number(process.env.REDIS_CACHE_TTL || 60));
export const cacheGet = async (key) => { try { const v = await (await redis()).get(key); return v ? JSON.parse(v) : null; } catch { return null; } };
export const cacheSet = async (key, value, ttl = defaultTtl()) => { try { await (await redis()).set(key, JSON.stringify(value), { EX: ttl }); } catch { /* cache is best effort */ } return value; };
