/**
 * WebsiteMo CMS — Database Connection & Helpers (sql.js)
 * Pure JS SQLite — no native compilation required
 */
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', '..', 'data', 'cms.db');
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
  _SQL = await initSqlJsModule();
  return _SQL;
}

/**
 * Get or create the database connection (lazy singleton)
 */
async function getDb() {
  if (_db) return _db;

  const SQL = await initSqlJs();
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Load existing or create new
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    _db = new SQL.Database(buffer);
  } else {
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
  const data = _db.export();
  const buffer = Buffer.from(data);
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(DB_PATH, buffer);
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

  // Insert admin user if not exists
  const result = db.exec("SELECT id FROM users WHERE username = 'admin'");
  if (result.length === 0) {
    const bcrypt = require('bcryptjs');
    const hash = adminPasswordHash || bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123', 10);
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
