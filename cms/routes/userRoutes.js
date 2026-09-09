/**
 * WebsiteMo CMS — Users Management Routes
 */
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');
const hooks = require('../hooks/hooks');

// GET /api/users — List users with role filter & pagination
router.get('/', authenticate(), (req, res, next) => {
  try {
    const { role = 'all', search = '', page = 1, limit = 20 } = req.query;

    const result = User.findAll({
      role,
      search,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10)
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/users/stats — User count by role
router.get('/stats', authenticate(), (req, res, next) => {
  try {
    const stats = User.getStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

// GET /api/users/:id — Single user details
router.get('/:id', authenticate(), (req, res, next) => {
  try {
    const user = User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    // Non-admins can only view their own full profile
    if (req.user.role !== 'administrator' && req.user.id !== parseInt(req.params.id, 10)) {
      return res.json({
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        role: user.role
      });
    }

    res.json(User.sanitizeUser(user));
  } catch (err) {
    next(err);
  }
});

// POST /api/users — Add new user (Admin only)
router.post('/', authenticate(), authorize(['administrator']), async (req, res, next) => {
  try {
    const { username, email, password, role = 'subscriber', displayName, firstName, lastName } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required.' });
    }

    const existingLogin = User.findByUsername(username);
    if (existingLogin) {
      return res.status(400).json({ error: 'Username already exists.' });
    }

    const existingEmail = User.findByEmail(email);
    if (existingEmail) {
      return res.status(400).json({ error: 'Email address already in use.' });
    }

    const user = await User.create({
      username,
      email,
      password,
      role,
      displayName,
      firstName,
      lastName
    });

    hooks.doAction('cms_user_created', user, req.user);

    res.status(201).json(User.sanitizeUser(user));
  } catch (err) {
    next(err);
  }
});

// PUT /api/users/:id — Update user profile / role
router.put('/:id', authenticate(), async (req, res, next) => {
  try {
    const targetUserId = parseInt(req.params.id, 10);

    // Permission check: Admins can update anyone; users can update themselves
    if (req.user.role !== 'administrator' && req.user.id !== targetUserId) {
      return res.status(403).json({ error: 'You do not have permission to update this profile.' });
    }

    // Only admins can change user roles
    if (req.body.role && req.user.role !== 'administrator') {
      delete req.body.role;
    }

    const updated = await User.update(targetUserId, req.body);
    if (!updated) return res.status(404).json({ error: 'User not found.' });

    hooks.doAction('cms_user_updated', updated, req.user);

    res.json(User.sanitizeUser(updated));
  } catch (err) {
    next(err);
  }
});

// DELETE /api/users/:id — Delete user & reassign posts (Admin only)
router.delete('/:id', authenticate(), authorize(['administrator']), (req, res, next) => {
  try {
    const targetUserId = parseInt(req.params.id, 10);

    if (req.user.id === targetUserId) {
      return res.status(400).json({ error: 'You cannot delete your own account.' });
    }

    const reassignId = req.body.reassignTo ? parseInt(req.body.reassignTo, 10) : req.user.id;
    const success = User.delete(targetUserId, reassignId);

    if (!success) return res.status(404).json({ error: 'User not found.' });

    hooks.doAction('cms_user_deleted', targetUserId, reassignId, req.user);

    res.json({ message: 'User deleted and content reassigned successfully.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
