const app = require('../cms/server');
const { initDatabase } = require('../cms/database/db');

let isInitialized = false;

module.exports = async (req, res) => {
  if (!isInitialized) {
    try {
      await initDatabase();
      isInitialized = true;
    } catch (err) {
      console.error('[SERVERLESS INIT DB ERROR]', err);
    }
  }
  return app(req, res);
};
