const express = require('express');
const db = require('../db');
const { authRequired, adminRequired } = require('../middleware/auth');
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

// GET /api/categories
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM categories ORDER BY type DESC, name ASC').all();
  res.json(rows.map(r => ({
    id: r.id,
    name: r.name,
    type: r.type,
    icon: r.icon || 'Tag',
    userId: r.user_id || undefined,
  })));
});

// POST /api/categories
router.post('/', authRequired, (req, res) => {
  const { name, icon } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Category name is required' });
  }

  // Check duplicate
  const existing = db.prepare('SELECT id FROM categories WHERE name = ? COLLATE NOCASE').get(name.trim());
  if (existing) {
    return res.status(409).json({ error: 'Category already exists' });
  }

  const id = generateId();
  db.prepare(
    'INSERT INTO categories (id, name, type, icon, user_id) VALUES (?, ?, ?, ?, ?)'
  ).run(id, name.trim(), 'user', icon || 'Tag', req.user.id);

  res.status(201).json({
    id,
    name: name.trim(),
    type: 'user',
    icon: icon || 'Tag',
    userId: req.user.id,
  });
});

// DELETE /api/categories/:id
router.delete('/:id', adminRequired, (req, res) => {
  const cat = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
  if (!cat) {
    return res.status(404).json({ error: 'Category not found' });
  }

  // Move prompts in this category to 'other'
  db.prepare('UPDATE prompts SET category_id = ? WHERE category_id = ?').run('other', req.params.id);
  db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);

  res.json({ success: true });
});

module.exports = router;
