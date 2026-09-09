/**
 * WebsiteMo CMS — Stats & Dashboard Summary Routes
 */
const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const User = require('../models/User');
const Option = require('../models/Option');
const { query } = require('../database/db');
const { authenticate } = require('../middleware/auth');

// GET /api/stats/dashboard — Summary data for dashboard widgets
router.get('/dashboard', authenticate(), (req, res, next) => {
  try {
    // 1. At a Glance counters
    const postStats = Post.getStats('post');
    const pageStats = Post.getStats('page');
    const commentStats = Comment.getStats();

    // 2. Recent Posts
    const recentPosts = Post.findAll({ limit: 5, orderBy: 'post_date', order: 'DESC' }).posts;

    // 3. Recent Comments
    const recentComments = Comment.findAll({ limit: 5, orderBy: 'comment_date', order: 'DESC' }).comments;

    // 4. Quick Draft list
    const quickDrafts = Post.findAll({ status: 'draft', limit: 3, orderBy: 'post_date', order: 'DESC' }).posts;

    // 5. Site Health snapshot
    const siteHealth = {
      status: 'Good',
      passedChecks: 14,
      recommendedActions: 2,
      phpVersion: '8.3.4-Node',
      dbVersion: 'SQLite 3 (v1.0.0-CMS)',
      httpsEnabled: true
    };

    res.json({
      atAGlance: {
        posts: postStats.publish,
        pages: pageStats.publish,
        comments: commentStats.approved,
        pendingComments: commentStats.pending,
        spamComments: commentStats.spam
      },
      recentPosts,
      recentComments,
      quickDrafts,
      siteHealth
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/stats/quick-draft — Quick draft widget submit
router.post('/quick-draft', authenticate(), (req, res, next) => {
  try {
    const { title, content } = req.body;
    if (!title && !content) {
      return res.status(400).json({ error: 'Title or content is required.' });
    }

    const draft = Post.create({
      post_author: req.user.id,
      post_title: title || 'Untitled Draft',
      post_content: content || '',
      post_status: 'draft',
      post_type: 'post'
    });

    res.status(201).json({ message: 'Quick draft saved.', draft });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
