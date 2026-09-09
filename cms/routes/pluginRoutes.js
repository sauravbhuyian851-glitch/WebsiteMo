/**
 * WebsiteMo CMS — Plugins & Extensibility Routes
 */
const express = require('express');
const router = express.Router();
const hooks = require('../hooks/hooks');
const Option = require('../models/Option');
const { authenticate, authorize } = require('../middleware/auth');

// Simulated built-in plugins list
const DEFAULT_PLUGINS = [
  {
    slug: 'akismet-antispam',
    name: 'Akismet Anti-Spam',
    version: '5.3',
    author: 'Automattic',
    description: 'Used by millions, Akismet is quite possibly the best way in the world to protect your blog from spam.',
    status: 'active'
  },
  {
    slug: 'hello-dolly',
    name: 'Hello Dolly',
    version: '1.7.2',
    author: 'Matt Mullenweg',
    description: 'This is not just a plugin, it symbolizes the hope and enthusiasm of an entire generation summed up in two words sung most famously by Louis Armstrong.',
    status: 'inactive'
  },
  {
    slug: 'gutenberg-blocks-plus',
    name: 'Gutenberg Blocks Plus',
    version: '2.1.0',
    author: 'WebsiteMo Team',
    description: 'Extends block editor with custom interactive widgets, sliders, and pricing tables.',
    status: 'active'
  },
  {
    slug: 'seo-optimizer-pro',
    name: 'SEO Optimizer Pro',
    version: '3.4.1',
    author: 'WebsiteMo Studio',
    description: 'Complete SEO suite with automated XML sitemaps, open-graph metadata, and schema.org markup.',
    status: 'active'
  }
];

// GET /api/plugins — List installed plugins & active hooks
router.get('/', authenticate(), (req, res, next) => {
  try {
    const activePlugins = Option.get('active_plugins', ['akismet-antispam', 'gutenberg-blocks-plus', 'seo-optimizer-pro']);

    const plugins = DEFAULT_PLUGINS.map(p => ({
      ...p,
      status: activePlugins.includes(p.slug) ? 'active' : 'inactive'
    }));

    res.json({
      plugins,
      hooksSummary: hooks.getRegisteredHooks()
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/plugins/:slug/toggle — Activate/Deactivate plugin
router.post('/:slug/toggle', authenticate(), authorize(['administrator']), (req, res, next) => {
  try {
    const { slug } = req.params;
    let activePlugins = Option.get('active_plugins', ['akismet-antispam', 'gutenberg-blocks-plus', 'seo-optimizer-pro']);

    if (typeof activePlugins === 'string') {
      try { activePlugins = JSON.parse(activePlugins); } catch (e) { activePlugins = []; }
    }

    let newStatus = 'inactive';
    if (activePlugins.includes(slug)) {
      activePlugins = activePlugins.filter(p => p !== slug);
      hooks.doAction('cms_plugin_deactivated', slug, req.user);
    } else {
      activePlugins.push(slug);
      newStatus = 'active';
      hooks.doAction('cms_plugin_activated', slug, req.user);
    }

    Option.set('active_plugins', activePlugins);

    res.json({ message: `Plugin ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully.`, slug, status: newStatus });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
