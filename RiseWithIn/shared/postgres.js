import pg from 'pg';

const pools = new Map();
export const getPool = (url = process.env.DATABASE_URL) => {
  if (!url) throw new Error('DATABASE_URL is required');
  if (!pools.has(url)) pools.set(url, new pg.Pool({ connectionString: url, max: 10, idleTimeoutMillis: 30000 }));
  return pools.get(url);
};

export const rows = async (sql, params = []) => (await getPool().query(sql, params)).rows;
export const row = async (sql, params = []) => (await getPool().query(sql, params)).rows[0] || null;
