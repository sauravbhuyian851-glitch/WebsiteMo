/**
 * WebsiteMo CMS — Database Connection & Helpers (sql.js)
 * Pure JS SQLite — no native compilation required
 */
const path = require('path');
const fs = require('fs');

const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const DB_PATH = isServerless
  ? path.join('/tmp', 'cms.db')
  : path.join(__dirname, '..', '..', 'data', 'cms.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');
const SEED_PATH = path.join(__dirname, 'seed.sql');

let _db = null;
let _SQL = null;

/**
 * Initialize sql.js and load/create database
 */
async function initSqlJs() {
  if (_SQL) return _SQL;
  const initSqlJsModule = require('sql.js');
  const wasmPath = path.join(require.resolve('sql.js'), '..', 'sql-wasm.wasm');
  _SQL = await initSqlJsModule({
    locateFile: () => wasmPath
  });
  return _SQL;
}

/**
 * Get or create the database connection (lazy singleton)
 */
async function getDb() {
  if (_db) return _db;

  const SQL = await initSqlJs();
  const dataDir = path.dirname(DB_PATH);
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  } catch (err) {
    console.warn('[DB] mkdir warning:', err.message);
  }

  // Load existing or create new
  try {
    if (fs.existsSync(DB_PATH)) {
      const buffer = fs.readFileSync(DB_PATH);
      _db = new SQL.Database(buffer);
    } else {
      _db = new SQL.Database();
    }
  } catch (err) {
    _db = new SQL.Database();
  }

  // Enable foreign keys
  _db.run('PRAGMA foreign_keys = ON');

  return _db;
}

/**
 * Save database to disk
 */
function saveDb() {
  if (!_db) return;
  try {
    const data = _db.export();
    const buffer = Buffer.from(data);
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, buffer);
  } catch (err) {
    console.warn('[DB] Read-only filesystem save skipped:', err.message);
  }
}

/**
 * Auto-save every 30 seconds
 */
let _saveInterval = null;
function startAutoSave() {
  if (_saveInterval) return;
  _saveInterval = setInterval(() => {
    saveDb();
  }, 30000);
}

/**
 * Initialize database: create tables + seed defaults
 */
async function initDb(adminPasswordHash) {
  const db = await getDb();

  // Run schema
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
  db.run(schema);

  // Insert or update admin user
  const bcrypt = require('bcryptjs');
  const targetPassword = process.env.ADMIN_PASSWORD || '123456';
  const hash = adminPasswordHash || bcrypt.hashSync(targetPassword, 10);

  const result = db.exec("SELECT id FROM users WHERE username = 'admin'");
  if (result.length === 0) {
    db.run(
      `INSERT INTO users (username, email, password_hash, display_name, role, status)
       VALUES (?, ?, ?, ?, ?, 'active')`,
      [
        process.env.ADMIN_USERNAME || 'admin',
        process.env.ADMIN_EMAIL || 'admin@websitemo.com',
        hash,
        'Administrator',
        'administrator'
      ]
    );
  } else {
    db.run(
      `UPDATE users SET password_hash = ? WHERE username = 'admin'`,
      [hash]
    );
  }

  // Run seed
  if (fs.existsSync(SEED_PATH)) {
    const seed = fs.readFileSync(SEED_PATH, 'utf-8');
    db.run(seed);
  }

  // Save to disk
  saveDb();
  startAutoSave();

  console.log('[DB] Database initialized successfully');

  // Supabase Integration Check
  const { testSupabaseConnection } = require('./supabase');
  const supaStatus = await testSupabaseConnection();
  if (supaStatus.connected) {
    console.log('⚡ [SUPABASE] Successfully connected to Supabase Cloud Database!');
  } else {
    console.log(`ℹ️  [SUPABASE] Integration ready. (${supaStatus.reason})`);
  }

  return db;
}

/**
 * Helper: Run a query that returns rows
 * Returns array of plain objects
 */
function query(sql, params = []) {
  if (!_db) throw new Error('Database not initialized');
  const stmt = _db.prepare(sql);
  if (params.length) stmt.bind(params);

  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

/**
 * Helper: Get a single row
 */
function queryOne(sql, params = []) {
  const rows = query(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Helper: Run an INSERT/UPDATE/DELETE
 * Returns { changes, lastInsertRowid }
 */
function run(sql, params = []) {
  if (!_db) throw new Error('Database not initialized');
  _db.run(sql, params);
  const info = _db.exec('SELECT changes() as changes, last_insert_rowid() as lastId');
  const changes = info.length > 0 ? info[0].values[0][0] : 0;
  const lastId = info.length > 0 ? info[0].values[0][1] : 0;
  // Auto-save on writes
  saveDb();
  return { changes, lastInsertRowid: lastId };
}

/**
 * Close database connection
 */
function closeDb() {
  if (_saveInterval) {
    clearInterval(_saveInterval);
    _saveInterval = null;
  }
  if (_db) {
    saveDb();
    _db.close();
    _db = null;
  }
}

module.exports = { getDb, initDb, initDatabase: initDb, closeDb, query, queryOne, run, saveDb };
