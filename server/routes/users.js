const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { adminRequired } = require('../middleware/auth');
const crypto = require('crypto');

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

// GET /api/users
router.get('/', adminRequired, (req, res) => {
  const rows = db.prepare('SELECT id, name, avatar, role, is_first_login, created_at, last_login_at FROM users').all();
  res.json(rows.map(r => ({
    id: r.id,
    name: r.name,
    avatar: r.avatar,
    role: r.role,
    isFirstLogin: !!r.is_first_login,
    createdAt: r.created_at || 0,
    lastLoginAt: r.last_login_at || 0,
  })));
});

// POST /api/users
router.post('/', adminRequired, (req, res) => {
  const { name, role } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'User name is required' });
  }

  // Check duplicate
  const existing = db.prepare('SELECT id FROM users WHERE name = ? COLLATE NOCASE').get(name.trim());
  if (existing) {
    return res.status(409).json({ error: 'User already exists' });
  }

  const id = generateId();
  const avatar = name.trim().substring(0, 2).toUpperCase();
  const hash = bcrypt.hashSync('123456', 8);
  const userRole = role || 'user';
  const now = Date.now();

  db.prepare(
    'INSERT INTO users (id, name, avatar, role, password_hash, is_first_login, created_at, last_login_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, name.trim(), avatar, userRole, hash, 1, now, 0);

  res.status(201).json({
    id,
    name: name.trim(),
    avatar,
    role: userRole,
    isFirstLogin: true,
  });
});

// DELETE /api/users/:id
router.delete('/:id', adminRequired, (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete yourself' });
  }

  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Reassign prompts to the admin who is deleting
  db.prepare('UPDATE prompts SET user_id = ?, author_name = ? WHERE user_id = ?')
    .run(req.user.id, req.user.name, req.params.id);

  // Delete user (favorites cascade-delete automatically)
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);

  res.json({ success: true });
});

module.exports = router;
