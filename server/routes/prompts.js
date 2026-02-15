const express = require('express');
const db = require('../db');
const { authRequired } = require('../middleware/auth');
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

function formatPrompt(row, userId) {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    description: row.description || '',
    categoryId: row.category_id,
    tags: JSON.parse(row.tags || '[]'),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    userId: row.user_id,
    authorName: row.author_name,
    visibility: row.visibility,
    isFavorite: userId ? !!row.is_favorite : false,
  };
}

// GET /api/prompts — authenticated user's own + public prompts
router.get('/', authRequired, (req, res) => {
  const userId = req.user.id;
  const rows = db.prepare(`
    SELECT p.*,
      CASE WHEN uf.user_id IS NOT NULL THEN 1 ELSE 0 END as is_favorite
    FROM prompts p
    LEFT JOIN user_favorites uf ON uf.prompt_id = p.id AND uf.user_id = ?
    WHERE p.user_id = ? OR p.visibility = 'public'
    ORDER BY p.updated_at DESC
  `).all(userId, userId);

  res.json(rows.map(r => formatPrompt(r, userId)));
});

// GET /api/prompts/public — guest access
router.get('/public', (req, res) => {
  const rows = db.prepare(`
    SELECT p.*, 0 as is_favorite
    FROM prompts p
    WHERE p.visibility = 'public'
    ORDER BY p.updated_at DESC
  `).all();

  res.json(rows.map(r => formatPrompt(r, null)));
});

// POST /api/prompts
router.post('/', authRequired, (req, res) => {
  const { title, content, description, categoryId, tags, visibility } = req.body;
  if (!title || !content || !categoryId) {
    return res.status(400).json({ error: 'title, content, and categoryId are required' });
  }

  const id = generateId();
  const now = Date.now();

  db.prepare(`
    INSERT INTO prompts (id, title, content, description, category_id, tags, created_at, updated_at, user_id, author_name, visibility)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, title, content, description || '', categoryId,
    JSON.stringify(tags || []), now, now,
    req.user.id, req.user.name, visibility || 'private'
  );

  const row = db.prepare(`
    SELECT p.*, 0 as is_favorite
    FROM prompts p WHERE p.id = ?
  `).get(id);

  res.status(201).json(formatPrompt(row, req.user.id));
});

// PUT /api/prompts/:id
router.put('/:id', authRequired, (req, res) => {
  const prompt = db.prepare('SELECT * FROM prompts WHERE id = ?').get(req.params.id);
  if (!prompt) {
    return res.status(404).json({ error: 'Prompt not found' });
  }
  if (prompt.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Not authorized' });
  }

  const { title, content, description, categoryId, tags, visibility } = req.body;
  const now = Date.now();

  db.prepare(`
    UPDATE prompts SET title = ?, content = ?, description = ?, category_id = ?, tags = ?, updated_at = ?, visibility = ?
    WHERE id = ?
  `).run(
    title || prompt.title,
    content || prompt.content,
    description !== undefined ? description : prompt.description,
    categoryId || prompt.category_id,
    JSON.stringify(tags || JSON.parse(prompt.tags)),
    now,
    visibility || prompt.visibility,
    req.params.id
  );

  const userId = req.user.id;
  const row = db.prepare(`
    SELECT p.*,
      CASE WHEN uf.user_id IS NOT NULL THEN 1 ELSE 0 END as is_favorite
    FROM prompts p
    LEFT JOIN user_favorites uf ON uf.prompt_id = p.id AND uf.user_id = ?
    WHERE p.id = ?
  `).get(userId, req.params.id);

  res.json(formatPrompt(row, userId));
});

// DELETE /api/prompts/:id
router.delete('/:id', authRequired, (req, res) => {
  const prompt = db.prepare('SELECT * FROM prompts WHERE id = ?').get(req.params.id);
  if (!prompt) {
    return res.status(404).json({ error: 'Prompt not found' });
  }
  if (prompt.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Not authorized' });
  }

  db.prepare('DELETE FROM prompts WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// POST /api/prompts/:id/favorite
router.post('/:id/favorite', authRequired, (req, res) => {
  const prompt = db.prepare('SELECT id FROM prompts WHERE id = ?').get(req.params.id);
  if (!prompt) {
    return res.status(404).json({ error: 'Prompt not found' });
  }

  const existing = db.prepare(
    'SELECT 1 FROM user_favorites WHERE user_id = ? AND prompt_id = ?'
  ).get(req.user.id, req.params.id);

  if (existing) {
    db.prepare('DELETE FROM user_favorites WHERE user_id = ? AND prompt_id = ?')
      .run(req.user.id, req.params.id);
    res.json({ isFavorite: false });
  } else {
    db.prepare('INSERT INTO user_favorites (user_id, prompt_id) VALUES (?, ?)')
      .run(req.user.id, req.params.id);
    res.json({ isFavorite: true });
  }
});

module.exports = router;
