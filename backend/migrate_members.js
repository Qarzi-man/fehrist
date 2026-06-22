require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS business_members (
        id          SERIAL PRIMARY KEY,
        business_id INTEGER REFERENCES businesses(id) ON DELETE CASCADE,
        user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
        role        VARCHAR(20) DEFAULT 'employee',
        invited_by  INTEGER REFERENCES users(id),
        status      VARCHAR(20) DEFAULT 'pending',
        created_at  TIMESTAMP DEFAULT NOW(),
        UNIQUE(business_id, user_id)
      )
    `);
    await pool.query('CREATE INDEX IF NOT EXISTS idx_business_members_user ON business_members(user_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_business_members_biz ON business_members(business_id)');
    console.log('Migration OK: business_members table created');
  } catch (err) {
    console.error('Migration error:', err.message, err.code);
  } finally {
    pool.end();
  }
}

run();
