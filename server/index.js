const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const promptRoutes = require('./routes/prompts');
const categoryRoutes = require('./routes/categories');
const userRoutes = require('./routes/users');
const settingsRoutes = require('./routes/settings');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/prompts', promptRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`[PromptMaster API] Server running on http://127.0.0.1:${PORT}`);
});
