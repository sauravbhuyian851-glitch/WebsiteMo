/**
 * WebsiteMo CMS — Auth Middleware
 * JWT verification + Role-Based Access Control
 */
const jwt = require('jsonwebtoken');
const { queryOne } = require('../database/db');

// RBAC capabilities matrix
const ROLE_CAPABILITIES = {
  administrator: [
    'manage_options', 'manage_users', 'install_plugins', 'install_themes',
    'edit_others_posts', 'publish_posts', 'edit_posts', 'delete_posts',
    'delete_others_posts', 'edit_pages', 'delete_pages', 'edit_others_pages',
    'upload_files', 'moderate_comments', 'manage_categories', 'manage_links',
    'edit_profile', 'read', 'edit_themes', 'export', 'import',
    'list_users', 'create_users', 'delete_users', 'edit_users',
    'manage_privacy', 'manage_site_health'
  ],
  editor: [
    'edit_others_posts', 'publish_posts', 'edit_posts', 'delete_posts',
    'delete_others_posts', 'edit_pages', 'delete_pages', 'edit_others_pages',
    'upload_files', 'moderate_comments', 'manage_categories', 'manage_links',
    'edit_profile', 'read'
  ],
  author: [
    'publish_posts', 'edit_posts', 'delete_posts',
    'upload_files', 'edit_profile', 'read'
  ],
  contributor: [
    'edit_posts', 'edit_profile', 'read'
  ],
  subscriber: [
    'edit_profile', 'read'
  ]
};

function doAuthenticate(req, res, next) {
  let token = null;

  // Check Authorization header
  const authHeader = req.headers ? req.headers.authorization : null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  }

  // Check cookie
  if (!token && req.cookies && req.cookies.cms_token) {
    token = req.cookies.cms_token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'websitemo-secret-key';
    const decoded = jwt.verify(token, secret);
    
    // Fetch user data
    const user = queryOne('SELECT id, user_login, user_email, display_name, role, user_status FROM users WHERE id = ?', [decoded.userId]);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (user.user_status !== 0) {
      return res.status(403).json({ error: 'Account suspended' });
    }

    req.user = user;
    req.user.capabilities = ROLE_CAPABILITIES[user.role] || [];
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

/**
 * Middleware: Verify JWT token from Authorization header or cookie
 */
function authenticate(req, res, next) {
  if (!req || typeof req !== 'object' || !req.headers) {
    return (reqObj, resObj, nextFn) => doAuthenticate(reqObj, resObj, nextFn);
  }
  return doAuthenticate(req, res, next);
}

/**
 * Middleware factory: Check if user role is included in allowed roles
 */
function authorize(roles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const allowed = Array.isArray(roles) ? roles : [roles];
    if (allowed.length > 0 && !allowed.includes(req.user.role)) {
      return res.status(403).json({ error: `Forbidden. Role '${req.user.role}' is not authorized.` });
    }

    next();
  };
}

/**
 * Middleware factory: Check if user has specific capability
 */
function requireCapability(capability) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!req.user.capabilities.includes(capability)) {
      return res.status(403).json({ error: `Insufficient permissions. Required: ${capability}` });
    }

    next();
  };
}

/**
 * Generate JWT token for a user
 */
function generateToken(user) {
  const secret = process.env.JWT_SECRET || 'websitemo-secret-key';
  return jwt.sign(
    { userId: user.id, username: user.user_login, role: user.role },
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

module.exports = {
  authenticate,
  authorize,
  requireCapability,
  generateToken,
  ROLE_CAPABILITIES
};
