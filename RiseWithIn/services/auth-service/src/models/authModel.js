import { row, rows, getPool } from '../../../../shared/postgres.js';

export const initAuth = async () => getPool().query(`
  CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL,
    plan TEXT NOT NULL DEFAULT 'FREE', created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY, user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT UNIQUE NOT NULL, expires_at TIMESTAMPTZ NOT NULL, revoked_at TIMESTAMPTZ
  );
  CREATE INDEX IF NOT EXISTS refresh_tokens_user_idx ON refresh_tokens(user_id);
`);
export const authModel = {
  byEmail: (email) => row('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]),
  byId: (id) => row('SELECT * FROM users WHERE id = $1', [id]),
  createUser: (id, email, passwordHash) => row('INSERT INTO users(id,email,password_hash) VALUES($1,$2,$3) RETURNING *', [id, email.toLowerCase(), passwordHash]),
  updatePlan: (userId, plan) => row('UPDATE users SET plan=$2 WHERE id=$1 RETURNING *', [userId, plan]),
  saveRefresh: (id, userId, hash, expiresAt) => row('INSERT INTO refresh_tokens(id,user_id,token_hash,expires_at) VALUES($1,$2,$3,$4) RETURNING *', [id, userId, hash, expiresAt]),
  validRefresh: (hash) => row('SELECT * FROM refresh_tokens WHERE token_hash=$1 AND revoked_at IS NULL AND expires_at > now()', [hash]),
  revoke: async (hash) => (await rows('UPDATE refresh_tokens SET revoked_at=now() WHERE token_hash=$1 AND revoked_at IS NULL RETURNING id', [hash])).length > 0
};
