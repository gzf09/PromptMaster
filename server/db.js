const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', 'promptmaster.db');

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE COLLATE NOCASE,
    avatar TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin','user','guest')),
    password_hash TEXT NOT NULL,
    is_first_login INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('system','user')),
    icon TEXT DEFAULT 'Tag',
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS prompts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    description TEXT DEFAULT '',
    category_id TEXT NOT NULL REFERENCES categories(id),
    tags TEXT NOT NULL DEFAULT '[]',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    visibility TEXT NOT NULL CHECK(visibility IN ('public','private'))
  );

  CREATE TABLE IF NOT EXISTS user_favorites (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    prompt_id TEXT NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, prompt_id)
  );
`);

// Seed initial data if tables are empty
function seed() {
  const userCount = db.prepare('SELECT COUNT(*) as cnt FROM users').get().cnt;
  if (userCount > 0) return;

  const adminHash = bcrypt.hashSync('password', 10);
  const janeHash = bcrypt.hashSync('password', 10);

  const insertUser = db.prepare(
    'INSERT INTO users (id, name, avatar, role, password_hash, is_first_login) VALUES (?, ?, ?, ?, ?, ?)'
  );
  insertUser.run('user1', 'Admin User', 'AU', 'admin', adminHash, 0);
  insertUser.run('user2', 'Jane Doe', 'JD', 'user', janeHash, 0);

  const insertCategory = db.prepare(
    'INSERT INTO categories (id, name, type, icon, user_id) VALUES (?, ?, ?, ?, ?)'
  );
  insertCategory.run('coding', '编程', 'system', 'Code', null);
  insertCategory.run('writing', '写作', 'system', 'PenTool', null);
  insertCategory.run('image-gen', '图像生成', 'system', 'Image', null);
  insertCategory.run('data-analysis', '数据分析', 'system', 'BarChart', null);
  insertCategory.run('learning', '学习', 'system', 'Book', null);
  insertCategory.run('other', '其他', 'system', 'Tag', null);

  const now = Date.now();
  const insertPrompt = db.prepare(
    'INSERT INTO prompts (id, title, content, description, category_id, tags, created_at, updated_at, user_id, author_name, visibility) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  insertPrompt.run(
    'demo1', 'React Component Generator',
    'Create a responsive React functional component with TypeScript and Tailwind CSS. Include proper type definitions, state management with hooks, and responsive design patterns.',
    'Standard template for generating UI components.',
    'coding', JSON.stringify(['react', 'typescript', 'tailwind', 'ui']),
    now, now, 'user1', 'Admin User', 'public'
  );
  insertPrompt.run(
    'demo2', 'Blog Post Outline',
    'Act as a professional content strategist. Create a detailed blog post outline with sections, key points, and SEO recommendations for the given topic.',
    'Structuring blog content efficiently.',
    'writing', JSON.stringify(['blog', 'content', 'marketing', 'outline']),
    now, now, 'user1', 'Admin User', 'private'
  );
  insertPrompt.run(
    'demo3', 'Midjourney Portrait (Shared)',
    '/imagine prompt: A cinematic portrait of a person in cyberpunk style, neon lighting, detailed face, 8k resolution, dramatic atmosphere --ar 2:3 --v 6',
    'Shared by Jane',
    'image-gen', JSON.stringify(['midjourney', 'portrait', 'cyberpunk', 'art']),
    now, now, 'user2', 'Jane Doe', 'public'
  );

  // Add a favorite for demo
  db.prepare('INSERT INTO user_favorites (user_id, prompt_id) VALUES (?, ?)').run('user1', 'demo1');
}

seed();

module.exports = db;
