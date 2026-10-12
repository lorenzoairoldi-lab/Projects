import { createClient } from 'redis';

let client;
export const redis = async () => {
  if (!client) {
    client = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
    client.on('error', (error) => console.warn(JSON.stringify({ level: 'warn', message: 'redis_error', error: error.message })));
    await client.connect();
  }
  return client;
};
