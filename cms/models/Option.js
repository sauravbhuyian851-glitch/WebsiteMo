/**
 * WebsiteMo CMS — Option Model
 */
const { query, queryOne, run } = require('../database/db');

const Option = {
  get(name, defaultValue = null) {
    const row = queryOne('SELECT option_value FROM options WHERE option_name = ?', [name]);
    return row ? row.option_value : defaultValue;
  },

  set(name, value, autoload = 'yes') {
    const existing = queryOne('SELECT option_id FROM options WHERE option_name = ?', [name]);
    if (existing) {
      run('UPDATE options SET option_value = ? WHERE option_name = ?', [String(value), name]);
    } else {
      run('INSERT INTO options (option_name, option_value, autoload) VALUES (?, ?, ?)', [name, String(value), autoload]);
    }
  },

  delete(name) {
    run('DELETE FROM options WHERE option_name = ?', [name]);
  },

  getAll() {
    return query('SELECT option_name, option_value FROM options');
  },

  getAutoloaded() {
    return query("SELECT option_name, option_value FROM options WHERE autoload = 'yes'");
  },

  /**
   * Get multiple options as a key-value map
   */
  getMany(names) {
    if (!names || names.length === 0) return {};
    const placeholders = names.map(() => '?').join(', ');
    const rows = query(`SELECT option_name, option_value FROM options WHERE option_name IN (${placeholders})`, names);
    const map = {};
    rows.forEach(r => { map[r.option_name] = r.option_value; });
    return map;
  },

  /**
   * Set multiple options at once
   */
  setMany(options) {
    for (const [name, value] of Object.entries(options)) {
      this.set(name, value);
    }
  }
};

module.exports = Option;
