const Redis = require("ioredis");

const redis = new Redis({ host: process.env.REDIS_HOST || "redis", port: 6379 });

const CACHE_TTL = 300; // 5 minutes

async function getCached(key) {
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
}

async function setCache(key, value) {
  await redis.setex(key, CACHE_TTL, JSON.stringify(value));
}

module.exports = { redis, getCached, setCache, CACHE_TTL };
