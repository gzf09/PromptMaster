const express = require('express');
const db = require('../db');
const { adminRequired } = require('../middleware/auth');

const router = express.Router();

// GET /api/settings — public, no auth required
router.get('/', (req, res) => {
  const row = db.prepare("SELECT value FROM settings WHERE key = 'allow_registration'").get();
  res.json({
    allowRegistration: row ? row.value === 'true' : false,
  });
});

// PUT /api/settings — admin only
router.put('/', adminRequired, (req, res) => {
  const { allowRegistration } = req.body;

  if (typeof allowRegistration === 'boolean') {
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('allow_registration', ?)").run(
      allowRegistration ? 'true' : 'false'
    );
  }

  const row = db.prepare("SELECT value FROM settings WHERE key = 'allow_registration'").get();
  res.json({
    allowRegistration: row ? row.value === 'true' : false,
  });
});

module.exports = router;
