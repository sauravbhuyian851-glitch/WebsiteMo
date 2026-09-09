/**
 * WebsiteMo CMS — Hook System (Actions & Filters)
 * Event-driven architecture for extensibility
 */

class HookSystem {
  constructor() {
    this.actions = {};
    this.filters = {};
  }

  /**
   * Register an action callback
   * @param {string} name - Hook name
   * @param {Function} callback - Function to call
   * @param {number} priority - Lower runs first (default 10)
   */
  addAction(name, callback, priority = 10) {
    if (!this.actions[name]) this.actions[name] = [];
    this.actions[name].push({ callback, priority });
    this.actions[name].sort((a, b) => a.priority - b.priority);
  }

  /**
   * Remove an action callback
   */
  removeAction(name, callback) {
    if (!this.actions[name]) return;
    this.actions[name] = this.actions[name].filter(h => h.callback !== callback);
  }

  /**
   * Fire all callbacks registered to an action
   * @param {string} name - Hook name
   * @param {...*} args - Arguments passed to callbacks
   */
  async doAction(name, ...args) {
    if (!this.actions[name]) return;
    for (const hook of this.actions[name]) {
      await hook.callback(...args);
    }
  }

  /**
   * Register a filter callback
   * @param {string} name - Filter name
   * @param {Function} callback - Function that receives value and returns modified value
   * @param {number} priority - Lower runs first (default 10)
   */
  addFilter(name, callback, priority = 10) {
    if (!this.filters[name]) this.filters[name] = [];
    this.filters[name].push({ callback, priority });
    this.filters[name].sort((a, b) => a.priority - b.priority);
  }

  /**
   * Remove a filter callback
   */
  removeFilter(name, callback) {
    if (!this.filters[name]) return;
    this.filters[name] = this.filters[name].filter(h => h.callback !== callback);
  }

  /**
   * Apply all filter callbacks to a value, piping output to next
   * @param {string} name - Filter name
   * @param {*} value - Initial value
   * @param {...*} args - Additional context arguments
   * @returns {*} Filtered value
   */
  async applyFilters(name, value, ...args) {
    if (!this.filters[name]) return value;
    let result = value;
    for (const hook of this.filters[name]) {
      result = await hook.callback(result, ...args);
    }
    return result;
  }

  /**
   * Check if an action has registered callbacks
   */
  hasAction(name) {
    return !!(this.actions[name] && this.actions[name].length > 0);
  }

  /**
   * Check if a filter has registered callbacks
   */
  hasFilter(name) {
    return !!(this.filters[name] && this.filters[name].length > 0);
  }
}

// Singleton instance
const hooks = new HookSystem();
module.exports = hooks;
