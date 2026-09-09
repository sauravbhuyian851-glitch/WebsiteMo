/**
 * WebsiteMo CMS — Media Routes
 */
const express = require('express');
const router = express.Router();
const Media = require('../models/Media');
const upload = require('../middleware/upload');
const { authenticate, authorize } = require('../middleware/auth');
const hooks = require('../hooks/hooks');

// GET /api/media — List media attachments
router.get('/', authenticate(), (req, res, next) => {
  try {
    const { mimeType = '', search = '', month = '', page = 1, limit = 24 } = req.query;

    const result = Media.findAll({
      mimeType,
      search,
      month,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10)
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/media/:id — Get attachment details
router.get('/:id', authenticate(), (req, res, next) => {
  try {
    const attachment = Media.findById(req.params.id);
    if (!attachment) return res.status(404).json({ error: 'Media item not found.' });
    res.json(attachment);
  } catch (err) {
    next(err);
  }
});

// POST /api/media — Upload new file(s)
router.post('/', authenticate(), authorize(['administrator', 'editor', 'author']), upload.single('file'), (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const { title, caption, description, alt } = req.body;

    const attachment = Media.create({
      file: req.file,
      title,
      caption,
      description,
      alt,
      authorId: req.user.id
    });

    hooks.doAction('cms_media_uploaded', attachment, req.user);

    res.status(201).json(attachment);
  } catch (err) {
    next(err);
  }
});

// PUT /api/media/:id — Update attachment details (title, alt, caption, desc)
router.put('/:id', authenticate(), authorize(['administrator', 'editor', 'author']), (req, res, next) => {
  try {
    const updated = Media.update(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Media item not found.' });

    hooks.doAction('cms_media_updated', updated, req.user);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/media/:id — Permanently delete attachment and file
router.delete('/:id', authenticate(), authorize(['administrator', 'editor']), (req, res, next) => {
  try {
    const success = Media.delete(req.params.id);
    if (!success) return res.status(404).json({ error: 'Media item not found or deletion failed.' });

    hooks.doAction('cms_media_deleted', req.params.id, req.user);
    res.json({ message: 'Media item deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
