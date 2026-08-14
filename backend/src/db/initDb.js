const fs = require('fs');
const path = require('path');
const db = require('../config/db');

async function initDb() {
  console.log('[DB Init] Starting Database Setup...');
  try {
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    const seedSql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');

    console.log('[DB Init] Executing schema.sql...');
    await db.exec(schemaSql);

    console.log('[DB Init] Executing seed.sql...');
    await db.exec(seedSql);

    console.log('[DB Init] Database initialized and seeded successfully!');
  } catch (error) {
    console.error('[DB Init Error] Failed to initialize database:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  initDb();
}

module.exports = initDb;
