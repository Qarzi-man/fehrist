require('dotenv').config();
const fs = require('fs');
const path = require('path');
const app = require('./src/app');
const pool = require('./src/config/db');

const PORT = process.env.PORT || 3000;

async function start() {
  const schema = fs.readFileSync(path.join(__dirname, 'src/models/schema.sql'), 'utf8');
  await pool.query(schema);
  console.log('Database schema ready');
  app.listen(PORT, () => console.log(`Daftarcha backend running on port ${PORT}`));
}

start().catch((err) => {
  console.error('Startup error:', err.message);
  process.exit(1);
});
