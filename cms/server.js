/**
 * WebsiteMo CMS — Main Express Server Entry Point
 */
require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');

// Import Database Initializer
const { initDatabase } = require('./database/db');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const termRoutes = require('./routes/termRoutes');
const commentRoutes = require('./routes/commentRoutes');
const mediaRoutes = require('./routes/mediaRoutes');
const userRoutes = require('./routes/userRoutes');
const optionRoutes = require('./routes/optionRoutes');
const pluginRoutes = require('./routes/pluginRoutes');
const statsRoutes = require('./routes/statsRoutes');

// Import Error Handler
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware Setup
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());
app.use(cors({
  origin: true,
  credentials: true
}));

// Static Folders
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
app.use('/admin', express.static(path.join(__dirname, '../admin')));
app.use(express.static(path.join(__dirname, '../')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/terms', termRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/users', userRoutes);
app.use('/api/options', optionRoutes);
app.use('/api/plugins', pluginRoutes);
app.use('/api/stats', statsRoutes);

// Admin SPA Fallback
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, '../admin/index.html'));
});

// Front-End Website Fallback
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({ error: 'Endpoint not found.' });
});

// Global Error Handler
app.use(errorHandler);

// Start Server
async function startServer() {
  await initDatabase();

  app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`🚀 WebsiteMo CMS Server running on port ${PORT}`);
    console.log(`🌐 Website Frontend: http://localhost:${PORT}`);
    console.log(`⚡ Admin Dashboard: http://localhost:${PORT}/admin`);
    console.log(`==================================================`);
  });
}

startServer();

module.exports = app;
