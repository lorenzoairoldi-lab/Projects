const { pool } = require("./database");

async function create(userId, data) {
  const { date, distanceKm, durationMin, elevationM, notes } = data;
  const pace = data.pace || (distanceKm > 0 ? (durationMin / distanceKm).toFixed(2) : null);
  const { rows } = await pool.query(
    `INSERT INTO workouts (user_id, date, distance_km, duration_min, pace_min_per_km, elevation_m, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [userId, date || new Date(), distanceKm, durationMin, pace, elevationM || 0, notes || null]
  );
  return rows[0];
}

async function list(userId, page = 1, limit = 20, from, to) {
  const offset = (page - 1) * limit;
  let where = "WHERE user_id = $1";
  const params = [userId];
  let idx = 2;

  if (from) { where += ` AND date >= $${idx++}`; params.push(from); }
  if (to)   { where += ` AND date <= $${idx++}`; params.push(to); }

  const count = await pool.query(`SELECT COUNT(*) FROM workouts ${where}`, params);
  const { rows } = await pool.query(
    `SELECT * FROM workouts ${where} ORDER BY date DESC, created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, limit, offset]
  );
  return { workouts: rows, total: parseInt(count.rows[0].count), page, limit };
}

async function getById(userId, id) {
  const { rows } = await pool.query("SELECT * FROM workouts WHERE id = $1 AND user_id = $2", [id, userId]);
  return rows[0];
}

async function update(userId, id, data) {
  const fields = [];
  const values = [];
  let idx = 3;
  const fieldMap = { distanceKm: "distance_km", durationMin: "duration_min", elevationM: "elevation_m" };

  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined && key !== "pace") {
      const col = fieldMap[key] || key;
      fields.push(`${col} = $${idx++}`);
      values.push(val);
    }
  }

  // Recompute pace if distance or duration changed
  if (data.distanceKm || data.durationMin) {
    const current = await getById(userId, id);
    if (current) {
      const dist = data.distanceKm || current.distance_km;
      const dur = data.durationMin || current.duration_min;
      if (dist > 0) {
        fields.push(`pace_min_per_km = $${idx++}`);
        values.push((dur / dist).toFixed(2));
      }
    }
  }

  if (fields.length === 0) return getById(userId, id);
  values.push(userId, id);
  const { rows } = await pool.query(
    `UPDATE workouts SET ${fields.join(", ")}, updated_at = NOW() WHERE user_id = $${idx} AND id = $${idx + 1} RETURNING *`,
    values
  );
  return rows[0];
}

async function remove(userId, id) {
  const { rowCount } = await pool.query("DELETE FROM workouts WHERE id = $1 AND user_id = $2", [id, userId]);
  return rowCount > 0;
}

async function getByUserAndDateRange(userId, from, to, limit = 10000) {
  const { rows } = await pool.query(
    "SELECT * FROM workouts WHERE user_id = $1 AND date >= $2 AND date <= $3 ORDER BY date ASC LIMIT $4",
    [userId, from, to, limit]
  );
  return rows;
}

module.exports = { create, list, getById, update, remove, getByUserAndDateRange };
