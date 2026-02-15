const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../db');
const { authRequired, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

function generateId() {
  try {
    return crypto.randomUUID();
  } catch {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE name = ? COLLATE NOCASE').get(username.trim());
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Update last_login_at
  db.prepare('UPDATE users SET last_login_at = ? WHERE id = ?').run(Date.now(), user.id);

  const token = jwt.sign(
    { id: user.id, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      role: user.role,
      isFirstLogin: !!user.is_first_login,
    },
  });
});

// POST /api/auth/register
router.post('/register', (req, res) => {
  // Check if registration is allowed
  const setting = db.prepare("SELECT value FROM settings WHERE key = 'allow_registration'").get();
  if (!setting || setting.value !== 'true') {
    return res.status(403).json({ error: 'Registration is currently closed' });
  }

  const { username, password } = req.body;

  if (!username || username.trim().length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters' });
  }
  if (!password || password.length < 4) {
    return res.status(400).json({ error: 'Password must be at least 4 characters' });
  }

  // Check duplicate
  const existing = db.prepare('SELECT id FROM users WHERE name = ? COLLATE NOCASE').get(username.trim());
  if (existing) {
    return res.status(409).json({ error: 'Username already exists' });
  }

  const id = generateId();
  const name = username.trim();
  const avatar = name.substring(0, 2).toUpperCase();
  const hash = bcrypt.hashSync(password, 8);
  const now = Date.now();

  db.prepare(
    'INSERT INTO users (id, name, avatar, role, password_hash, is_first_login, created_at, last_login_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, name, avatar, 'user', hash, 0, now, now);

  const token = jwt.sign(
    { id, name, role: 'user' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.status(201).json({
    token,
    user: {
      id,
      name,
      avatar,
      role: 'user',
      isFirstLogin: false,
    },
  });
});

// GET /api/auth/me
router.get('/me', authRequired, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    id: user.id,
    name: user.name,
    avatar: user.avatar,
    role: user.role,
    isFirstLogin: !!user.is_first_login,
  });
});

// POST /api/auth/change-password
router.post('/change-password', authRequired, (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 4) {
    return res.status(400).json({ error: 'Password must be at least 4 characters' });
  }

  const hash = bcrypt.hashSync(newPassword, 8);
  db.prepare('UPDATE users SET password_hash = ?, is_first_login = 0 WHERE id = ?').run(hash, req.user.id);

  // Issue new token with updated info
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  const token = jwt.sign(
    { id: user.id, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      role: user.role,
      isFirstLogin: false,
    },
  });
});

module.exports = router;
