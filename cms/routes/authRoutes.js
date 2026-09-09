/**
 * WebsiteMo CMS — Authentication Routes
 */
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { generateToken, verifyToken, authenticate } = require('../middleware/auth');
const { sendPasswordResetEmail } = require('../utils/email');
const crypto = require('crypto');

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const user = User.findByUsernameOrEmail(username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const isValid = await User.verifyPassword(user, password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const token = generateToken(user);

    // Set HTTP-only cookie
    res.cookie('cms_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    const sanitizedUser = User.sanitizeUser(user);
    res.json({
      message: 'Login successful',
      token,
      user: sanitizedUser
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('cms_token');
  res.json({ message: 'Logged out successfully' });
});

// GET /api/auth/me
router.get('/me', authenticate(), (req, res) => {
  res.json({ user: req.user });
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    const user = User.findByEmail(email);
    if (!user) {
      // Don't reveal user existence
      return res.json({ message: 'If an account with that email exists, password reset instructions have been sent.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    User.setResetToken(user.id, token);

    const resetUrl = `${req.protocol}://${req.get('host')}/admin/login.html?action=reset&token=${token}`;
    await sendPasswordResetEmail(user.email, resetUrl);

    res.json({ message: 'If an account with that email exists, password reset instructions have been sent.' });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required.' });
    }

    const success = await User.resetPassword(token, newPassword);
    if (!success) {
      return res.status(400).json({ error: 'Invalid or expired password reset token.' });
    }

    res.json({ message: 'Password has been reset successfully. You can now log in.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
