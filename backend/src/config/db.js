const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();

// Determine whether to use PostgreSQL or SQLite fallback
const usePostgres = process.env.USE_POSTGRES === 'true' || Boolean(process.env.DATABASE_URL);

let pool = null;
let sqliteDb = null;

if (usePostgres) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/smart_ration',
  });
  console.log('[DB] Configured for PostgreSQL');
} else {
  const dbPath = path.join(__dirname, '../../smart_ration.sqlite');
  sqliteDb = new sqlite3.Database(dbPath);
  console.log(`[DB] Using SQLite database fallback at: ${dbPath}`);
}

/**
 * Universal query runner supporting both PostgreSQL ($1, $2) and SQLite (? conversion)
 */
async function query(text, params = []) {
  if (usePostgres) {
    const res = await pool.query(text, params);
    return res;
  }

  // SQLite Fallback query translator
  return new Promise((resolve, reject) => {
    // Convert $1, $2 parameters to ? for SQLite
    let paramIndex = 1;
    let convertedText = text.replace(/\$(\d+)/g, () => '?');
    
    // SQLite doesn't natively support TIMESTAMP DEFAULT CURRENT_TIMESTAMP in exact PG format or JSON types, adjust if needed
    if (convertedText.trim().toLowerCase().startsWith('select')) {
      sqliteDb.all(convertedText, params, (err, rows) => {
        if (err) return reject(err);
        resolve({ rows, rowCount: rows.length });
      });
    } else {
      sqliteDb.run(convertedText, params, function (err) {
        if (err) return reject(err);
        resolve({ rows: [], rowCount: this.changes, lastID: this.lastID });
      });
    }
  });
}

/**
 * Execute multiple SQL statements (for schema/seed initialization)
 */
async function exec(text) {
  if (usePostgres) {
    return await pool.query(text);
  }
  return new Promise((resolve, reject) => {
    sqliteDb.exec(text, (err) => {
      if (err) return reject(err);
      resolve(true);
    });
  });
}

module.exports = {
  query,
  exec,
  usePostgres
};
