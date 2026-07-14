const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function initDb() {
  const { readFileSync } = require("fs");
  const { join } = require("path");
  const sql = readFileSync(join(__dirname, "../migrations/init.sql"), "utf8");
  await pool.query(sql);
  console.log("✅ Auth DB tables ready");
}

module.exports = { pool, initDb };
