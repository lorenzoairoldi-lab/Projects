import 'dotenv/config';

export const env = (name, fallback) => {
  const value = process.env[name] ?? fallback;
  if (value === undefined) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};

export const pagination = ({ limit = 20, offset = 0 } = {}) => ({
  limit: Math.min(Math.max(Number(limit) || 20, 1), 100),
  offset: Math.max(Number(offset) || 0, 0)
});
