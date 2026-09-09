/**
 * WebsiteMo CMS — Posts & Pages Routes
 */
const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const Term = require('../models/Term');
const { authenticate, authorize } = require('../middleware/auth');
const hooks = require('../hooks/hooks');

// GET /api/posts — List posts with search, filter, pagination
router.get('/', authenticate(), (req, res, next) => {
  try {
    const { post_type = 'post', status = 'all', category = null, author = null, search = '', page = 1, limit = 20, orderBy = 'post_date', order = 'DESC' } = req.query;

    const result = Post.findAll({
      post_type,
      status,
      category,
      author,
      search,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      orderBy,
      order
    });

    // Run action hook
    hooks.doAction('cms_posts_listed', result.posts, req.user);

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/posts/stats — Count by status
router.get('/stats', authenticate(), (req, res, next) => {
  try {
    const post_type = req.query.post_type || 'post';
    const stats = Post.getStats(post_type);
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

// GET /api/posts/:id — Single post details
router.get('/:id', authenticate(), (req, res, next) => {
  try {
    const post = Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found.' });

    // Filter post data with hooks
    const filteredPost = hooks.applyFilters('cms_get_post', post);

    res.json(filteredPost);
  } catch (err) {
    next(err);
  }
});

// POST /api/posts — Create new post/page
router.post('/', authenticate(), authorize(['administrator', 'editor', 'author']), (req, res, next) => {
  try {
    const data = req.body;
    data.author_id = req.user.id;
    data.post_author = req.user.id;

    // Filter input data
    const filteredData = hooks.applyFilters('cms_pre_create_post', data);

    const post = Post.create(filteredData);

    // Save categories / tags if provided
    if (data.categories && Array.isArray(data.categories)) {
      Term.setPostTerms(post.id, data.categories, 'category');
    }
    if (data.tags && Array.isArray(data.tags)) {
      Term.setPostTerms(post.id, data.tags, 'post_tag');
    }

    hooks.doAction('cms_post_created', post, req.user);

    const fullPost = Post.findById(post.id);
    res.status(201).json(fullPost);
  } catch (err) {
    next(err);
  }
});

// PUT /api/posts/:id — Update post/page
router.put('/:id', authenticate(), authorize(['administrator', 'editor', 'author']), (req, res, next) => {
  try {
    const existing = Post.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Post not found.' });

    // Authors can only edit their own posts
    if (req.user.role === 'author' && existing.post_author !== req.user.id) {
      return res.status(403).json({ error: 'You do not have permission to edit this post.' });
    }

    const data = req.body;
    const filteredData = hooks.applyFilters('cms_pre_update_post', data, existing);

    const updated = Post.update(req.params.id, filteredData);

    // Update categories / tags if provided
    if (data.categories && Array.isArray(data.categories)) {
      Term.setPostTerms(req.params.id, data.categories, 'category');
    }
    if (data.tags && Array.isArray(data.tags)) {
      Term.setPostTerms(req.params.id, data.tags, 'post_tag');
    }

    hooks.doAction('cms_post_updated', updated, req.user);

    const fullPost = Post.findById(req.params.id);
    res.json(fullPost);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/posts/:id — Trash or permanently delete
router.delete('/:id', authenticate(), authorize(['administrator', 'editor', 'author']), (req, res, next) => {
  try {
    const existing = Post.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Post not found.' });

    if (req.user.role === 'author' && existing.post_author !== req.user.id) {
      return res.status(403).json({ error: 'You do not have permission to delete this post.' });
    }

    const force = req.query.force === 'true';
    const result = Post.delete(req.params.id, force);

    hooks.doAction('cms_post_deleted', req.params.id, force, req.user);

    res.json({ message: force ? 'Post permanently deleted.' : 'Post moved to trash.', success: result });
  } catch (err) {
    next(err);
  }
});

// GET /api/posts/:id/revisions — Get revision history
router.get('/:id/revisions', authenticate(), (req, res, next) => {
  try {
    const revisions = Post.getRevisions(req.params.id);
    res.json(revisions);
  } catch (err) {
    next(err);
  }
});

// POST /api/posts/:id/restore/:revisionId — Restore a revision
router.post('/:id/restore/:revisionId', authenticate(), authorize(['administrator', 'editor']), (req, res, next) => {
  try {
    const restored = Post.restoreRevision(req.params.id, req.params.revisionId);
    if (!restored) return res.status(400).json({ error: 'Failed to restore revision.' });

    hooks.doAction('cms_post_revision_restored', req.params.id, req.params.revisionId, req.user);

    res.json(restored);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
