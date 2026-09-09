/**
 * WebsiteMo CMS — Options & Settings Routes
 */
const express = require('express');
const router = express.Router();
const Option = require('../models/Option');
const { authenticate, authorize } = require('../middleware/auth');
const hooks = require('../hooks/hooks');

// GET /api/options — Get list of key options or specific setting group
router.get('/', authenticate(), (req, res, next) => {
  try {
    const group = req.query.group || 'all';

    let options = {};
    if (group === 'general') {
      options = Option.getGroup(['site_title', 'site_tagline', 'site_url', 'admin_email', 'users_can_register', 'default_role', 'timezone_string', 'date_format', 'time_format']);
    } else if (group === 'writing') {
      options = Option.getGroup(['default_category', 'default_post_format', 'use_smilies', 'ping_sites']);
    } else if (group === 'reading') {
      options = Option.getGroup(['show_on_front', 'page_on_front', 'page_for_posts', 'posts_per_page', 'posts_per_rss', 'blog_public']);
    } else if (group === 'discussion') {
      options = Option.getGroup(['default_comment_status', 'require_name_email', 'comment_registration', 'close_comments_for_old_posts', 'comment_moderation', 'moderation_notify']);
    } else if (group === 'media') {
      options = Option.getGroup(['thumbnail_size_w', 'thumbnail_size_h', 'medium_size_w', 'medium_size_h', 'large_size_w', 'large_size_h', 'uploads_use_yearmonth_folders']);
    } else if (group === 'permalink') {
      options = Option.getGroup(['permalink_structure', 'category_base', 'tag_base']);
    } else {
      options = Option.getAllAutoload();
    }

    res.json(options);
  } catch (err) {
    next(err);
  }
});

// GET /api/options/:name — Get single option
router.get('/:name', authenticate(), (req, res, next) => {
  try {
    const val = Option.get(req.params.name, null);
    if (val === null) return res.status(404).json({ error: 'Option not found.' });
    res.json({ name: req.params.name, value: val });
  } catch (err) {
    next(err);
  }
});

// POST /api/options — Save batch settings (Admin only)
router.post('/', authenticate(), authorize(['administrator']), (req, res, next) => {
  try {
    const settings = req.body;
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Invalid settings payload.' });
    }

    // Apply hook filter before saving
    const filteredSettings = hooks.applyFilters('cms_pre_update_options', settings, req.user);

    Option.setMultiple(filteredSettings);

    hooks.doAction('cms_options_updated', filteredSettings, req.user);

    res.json({ message: 'Settings saved successfully.', settings: filteredSettings });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
