function createQueries(pool) {
  // ── Weekly Stats ──

  async function getWeeklyStats(userId, weeks = 4) {
    const { rows } = await pool.query(
      `SELECT * FROM weekly_stats WHERE user_id = $1 ORDER BY week_start DESC LIMIT $2`,
      [userId, weeks]
    );
    return rows;
  }

  async function upsertWeeklyStats(userId, weekStart, totals) {
    await pool.query(
      `INSERT INTO weekly_stats (user_id, week_start, total_distance_km, total_duration_min, workout_count)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, week_start) DO UPDATE
       SET total_distance_km = $3, total_duration_min = $4, workout_count = $5`,
      [userId, weekStart, totals.distanceKm, totals.durationMin, totals.count]
    );
  }

  async function deleteWeeklyStats(userId) {
    await pool.query("DELETE FROM weekly_stats WHERE user_id = $1", [userId]);
  }

  // ── Monthly Stats ──

  async function getMonthlyStats(userId, months = 3) {
    const { rows } = await pool.query(
      `SELECT * FROM monthly_stats WHERE user_id = $1 ORDER BY month_start DESC LIMIT $2`,
      [userId, months]
    );
    return rows;
  }

  async function upsertMonthlyStats(userId, monthStart, totals) {
    await pool.query(
      `INSERT INTO monthly_stats (user_id, month_start, total_distance_km, total_duration_min, workout_count)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, month_start) DO UPDATE
       SET total_distance_km = $3, total_duration_min = $4, workout_count = $5`,
      [userId, monthStart, totals.distanceKm, totals.durationMin, totals.count]
    );
  }

  async function deleteMonthlyStats(userId) {
    await pool.query("DELETE FROM monthly_stats WHERE user_id = $1", [userId]);
  }

  // ── Personal Bests ──

  async function getPersonalBests(userId) {
    const { rows } = await pool.query(
      "SELECT * FROM personal_bests WHERE user_id = $1 ORDER BY metric", [userId]
    );
    return rows;
  }

  async function upsertPersonalBest(userId, metric, value, achievedDate) {
    await pool.query(
      `INSERT INTO personal_bests (user_id, metric, value, achieved_date)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, metric) DO UPDATE
       SET value = $3, achieved_date = $4`,
      [userId, metric, value, achievedDate]
    );
  }

  async function deletePersonalBests(userId) {
    await pool.query("DELETE FROM personal_bests WHERE user_id = $1", [userId]);
  }

  return {
    getWeeklyStats, upsertWeeklyStats, deleteWeeklyStats,
    getMonthlyStats, upsertMonthlyStats, deleteMonthlyStats,
    getPersonalBests, upsertPersonalBest, deletePersonalBests,
  };
}

module.exports = { createQueries };
