const { pool } = require("./database");

async function findUserByEmail(email) {
  const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  return rows[0];
}

async function findUserById(id) {
  const { rows } = await pool.query("SELECT id, email, name, created_at FROM users WHERE id = $1", [id]);
  return rows[0];
}

async function createUser(email, passwordHash, name) {
  const { rows } = await pool.query(
    "INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name, created_at",
    [email, passwordHash, name]
  );
  return rows[0];
}

async function saveRefreshToken(userId, token, expiresAt) {
  await pool.query(
    "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)",
    [userId, token, expiresAt]
  );
}

async function findRefreshToken(token) {
  const { rows } = await pool.query("SELECT * FROM refresh_tokens WHERE token = $1", [token]);
  return rows[0];
}

async function deleteRefreshToken(token) {
  await pool.query("DELETE FROM refresh_tokens WHERE token = $1", [token]);
}

async function getProfile(userId) {
  const { rows } = await pool.query("SELECT * FROM profiles WHERE user_id = $1", [userId]);
  return rows[0];
}

async function upsertProfile(userId, data) {
  const fields = [];
  const values = [];
  let idx = 2;
  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined) {
      fields.push(`${key} = $${idx++}`);
      values.push(val);
    }
  }
  if (fields.length === 0) return getProfile(userId);
  values.push(userId);
  await pool.query(
    `INSERT INTO profiles (user_id, ${Object.keys(data).filter(k => data[k] !== undefined).join(", ")})
     VALUES ($1, ${Object.keys(data).filter(k => data[k] !== undefined).map((_, i) => `$${i + 2}`).join(", ")})
     ON CONFLICT (user_id) DO UPDATE SET ${fields.join(", ")}`,
    [userId, ...Object.values(data).filter(v => v !== undefined)]
  );
  return getProfile(userId);
}

module.exports = {
  findUserByEmail, findUserById, createUser,
  saveRefreshToken, findRefreshToken, deleteRefreshToken,
  getProfile, upsertProfile,
};
