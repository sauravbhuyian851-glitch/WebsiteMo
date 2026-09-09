/**
 * WebsiteMo CMS — User Model
 */
const { query, queryOne, run } = require('../database/db');
const bcrypt = require('bcryptjs');

const User = {
  findById(id) {
    return queryOne('SELECT id, username, email, display_name, role, status, created_at, updated_at FROM users WHERE id = ?', [id]);
  },

  findByUsername(username) {
    return queryOne('SELECT * FROM users WHERE username = ?', [username]);
  },

  findByEmail(email) {
    return queryOne('SELECT * FROM users WHERE email = ?', [email]);
  },

  findByUsernameOrEmail(loginOrEmail) {
    return queryOne('SELECT * FROM users WHERE username = ? OR email = ?', [loginOrEmail, loginOrEmail]);
  },

  sanitizeUser(user) {
    if (!user) return null;
    const { password_hash, ...sanitized } = user;
    return sanitized;
  },

  findAll({ page = 1, perPage = 20, role, search, orderBy = 'created_at', order = 'DESC' } = {}) {
    let sql = 'SELECT id, username, email, display_name, role, status, created_at, updated_at FROM users WHERE 1=1';
    const params = [];

    if (role) {
      sql += ' AND role = ?';
      params.push(role);
    }
    if (search) {
      sql += ' AND (username LIKE ? OR email LIKE ? OR display_name LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    // Count
    const countSql = sql.replace(/^SELECT .+ FROM/, 'SELECT COUNT(*) as count FROM');
    const countResult = queryOne(countSql, params);
    const total = countResult ? countResult.count : 0;

    // Order & paginate
    const validColumns = ['username', 'email', 'display_name', 'role', 'created_at'];
    const col = validColumns.includes(orderBy) ? orderBy : 'created_at';
    const dir = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    sql += ` ORDER BY ${col} ${dir}`;

    const offset = (page - 1) * perPage;
    sql += ' LIMIT ? OFFSET ?';
    params.push(perPage, offset);

    const users = query(sql, params);
    return { users, total, page, perPage };
  },

  async create({ username, email, password, display_name, role = 'subscriber' }) {
    const hash = await bcrypt.hash(password, 12);
    const result = run(
      `INSERT INTO users (username, email, password_hash, display_name, role, status)
       VALUES (?, ?, ?, ?, ?, 'active')`,
      [username, email, hash, display_name || username, role]
    );
    return this.findById(result.lastInsertRowid);
  },

  update(id, data) {
    const fields = [];
    const params = [];

    if (data.email !== undefined) { fields.push('email = ?'); params.push(data.email); }
    if (data.display_name !== undefined) { fields.push('display_name = ?'); params.push(data.display_name); }
    if (data.role !== undefined) { fields.push('role = ?'); params.push(data.role); }
    if (data.status !== undefined) { fields.push('status = ?'); params.push(data.status); }

    if (fields.length === 0) return this.findById(id);

    fields.push("updated_at = datetime('now')");
    params.push(id);

    run(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, params);
    return this.findById(id);
  },

  async updatePassword(id, newPassword) {
    const hash = await bcrypt.hash(newPassword, 12);
    run('UPDATE users SET password_hash = ?, updated_at = datetime(\'now\') WHERE id = ?', [hash, id]);
  },

  async verifyPassword(user, password) {
    return bcrypt.compare(password, user.password_hash);
  },

  delete(id) {
    run('DELETE FROM users WHERE id = ?', [id]);
  },

  getMeta(userId, key) {
    if (key) {
      const row = queryOne('SELECT meta_value FROM user_meta WHERE user_id = ? AND meta_key = ?', [userId, key]);
      return row ? row.meta_value : null;
    }
    return query('SELECT meta_key, meta_value FROM user_meta WHERE user_id = ?', [userId]);
  },

  setMeta(userId, key, value) {
    const existing = queryOne('SELECT meta_id FROM user_meta WHERE user_id = ? AND meta_key = ?', [userId, key]);
    if (existing) {
      run('UPDATE user_meta SET meta_value = ? WHERE user_id = ? AND meta_key = ?', [value, userId, key]);
    } else {
      run('INSERT INTO user_meta (user_id, meta_key, meta_value) VALUES (?, ?, ?)', [userId, key, value]);
    }
  },

  deleteMeta(userId, key) {
    run('DELETE FROM user_meta WHERE user_id = ? AND meta_key = ?', [userId, key]);
  },

  countByRole() {
    return query('SELECT role, COUNT(*) as count FROM users GROUP BY role');
  }
};

module.exports = User;
