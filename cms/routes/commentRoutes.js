/**
 * WebsiteMo CMS — Comments Routes
 */
const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const { authenticate, authorize } = require('../middleware/auth');
const hooks = require('../hooks/hooks');

// GET /api/comments — List comments with status filter
router.get('/', authenticate(), (req, res, next) => {
  try {
    const { status = 'all', postId = null, search = '', page = 1, limit = 20, orderBy = 'comment_date', order = 'DESC' } = req.query;

    const result = Comment.findAll({
      status,
      postId: postId ? parseInt(postId, 10) : null,
      search,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      orderBy,
      order
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/comments/stats — Comment counts by status
router.get('/stats', authenticate(), (req, res, next) => {
  try {
    const stats = Comment.getStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

// GET /api/comments/:id — Single comment
router.get('/:id', authenticate(), (req, res, next) => {
  try {
    const comment = Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Comment not found.' });
    res.json(comment);
  } catch (err) {
    next(err);
  }
});

// POST /api/comments — Create comment or admin reply
router.post('/', authenticate(), (req, res, next) => {
  try {
    const { postId, content, parent = 0, author, email, url } = req.body;
    if (!postId || !content) {
      return res.status(400).json({ error: 'Post ID and comment content are required.' });
    }

    const commentData = {
      postId: parseInt(postId, 10),
      content,
      parent: parseInt(parent, 10) || 0,
      author: req.user ? req.user.display_name : (author || 'Anonymous'),
      email: req.user ? (req.user.email || req.user.user_email) : (email || ''),
      url: url || '',
      ip: req.ip,
      userId: req.user ? req.user.id : 0,
      status: req.user && ['administrator', 'editor'].includes(req.user.role) ? '1' : '0' // auto-approve for admins/editors
    };

    const comment = Comment.create(commentData);
    hooks.doAction('cms_comment_created', comment, req.user);

    res.status(201).json(comment);
  } catch (err) {
    next(err);
  }
});

// PUT /api/comments/:id — Moderate or edit comment
router.put('/:id', authenticate(), authorize(['administrator', 'editor']), (req, res, next) => {
  try {
    const comment = Comment.update(req.params.id, req.body);
    if (!comment) return res.status(404).json({ error: 'Comment not found.' });

    hooks.doAction('cms_comment_updated', comment, req.user);
    res.json(comment);
  } catch (err) {
    next(err);
  }
});

// PUT /api/comments/:id/status — Quick status change (approve, unapprove, spam, trash)
router.put('/:id/status', authenticate(), authorize(['administrator', 'editor']), (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['0', '1', 'spam', 'trash'].includes(status)) {
      return res.status(400).json({ error: 'Invalid comment status.' });
    }

    const comment = Comment.setStatus(req.params.id, status);
    if (!comment) return res.status(404).json({ error: 'Comment not found.' });

    hooks.doAction('cms_comment_status_changed', comment, status, req.user);
    res.json(comment);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/comments/:id — Permanently delete comment
router.delete('/:id', authenticate(), authorize(['administrator', 'editor']), (req, res, next) => {
  try {
    const force = req.query.force === 'true';
    const success = Comment.delete(req.params.id, force);

    if (!success) return res.status(404).json({ error: 'Comment not found.' });
    hooks.doAction('cms_comment_deleted', req.params.id, force, req.user);

    res.json({ message: force ? 'Comment permanently deleted.' : 'Comment moved to trash.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
