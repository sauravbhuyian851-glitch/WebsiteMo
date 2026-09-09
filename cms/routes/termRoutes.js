/**
 * WebsiteMo CMS — Terms & Taxonomy Routes
 */
const express = require('express');
const router = express.Router();
const Term = require('../models/Term');
const { authenticate, authorize } = require('../middleware/auth');
const hooks = require('../hooks/hooks');

// GET /api/terms — List terms for a taxonomy (category, post_tag)
router.get('/', authenticate(), (req, res, next) => {
  try {
    const { taxonomy = 'category', search = '', orderBy = 'name', order = 'ASC' } = req.query;
    const terms = Term.findAll(taxonomy, { search, orderBy, order });
    res.json(terms);
  } catch (err) {
    next(err);
  }
});

// GET /api/terms/:id — Get term by ID
router.get('/:id', authenticate(), (req, res, next) => {
  try {
    const term = Term.findById(req.params.id);
    if (!term) return res.status(404).json({ error: 'Term not found.' });
    res.json(term);
  } catch (err) {
    next(err);
  }
});

// POST /api/terms — Create new term
router.post('/', authenticate(), authorize(['administrator', 'editor']), (req, res, next) => {
  try {
    const { name, slug, taxonomy = 'category', description = '', parent = 0 } = req.body;
    if (!name) return res.status(400).json({ error: 'Term name is required.' });

    const term = Term.create({ name, slug, taxonomy, description, parent: parseInt(parent, 10) || 0 });
    hooks.doAction('cms_term_created', term, req.user);

    res.status(201).json(term);
  } catch (err) {
    next(err);
  }
});

// PUT /api/terms/:id — Update term
router.put('/:id', authenticate(), authorize(['administrator', 'editor']), (req, res, next) => {
  try {
    const updated = Term.update(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Term not found.' });

    hooks.doAction('cms_term_updated', updated, req.user);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/terms/:id — Delete term
router.delete('/:id', authenticate(), authorize(['administrator', 'editor']), (req, res, next) => {
  try {
    const success = Term.delete(req.params.id);
    if (!success) return res.status(404).json({ error: 'Term not found or deletion failed.' });

    hooks.doAction('cms_term_deleted', req.params.id, req.user);
    res.json({ message: 'Term deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
