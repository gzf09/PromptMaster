const SCHEMA_VERSION_KEY = 'promptmaster_schema_version';

interface Migration {
  version: number;
  description: string;
  migrate: () => void;
}

const migrations: Migration[] = [
  {
    version: 1,
    description: 'Baseline: ensure all entities have required fields',
    migrate: () => {
      // Prompts: ensure userId, authorName, visibility, tags, isFavorite, description
      const rawPrompts = localStorage.getItem('promptmaster_data');
      if (rawPrompts) {
        try {
          const prompts = JSON.parse(rawPrompts);
          const rawUsers = localStorage.getItem('promptmaster_users');
          let fallbackUserId = 'user1';
          let fallbackAuthorName = 'Admin User';
          if (rawUsers) {
            try {
              const users = JSON.parse(rawUsers);
              if (Array.isArray(users) && users.length > 0) {
                fallbackUserId = users[0].id;
                fallbackAuthorName = users[0].name;
              }
            } catch {}
          }
          const migrated = prompts.map((p: any) => ({
            ...p,
            userId: p.userId || fallbackUserId,
            authorName: p.authorName || fallbackAuthorName,
            visibility: p.visibility || 'private',
            tags: Array.isArray(p.tags) ? p.tags : [],
            isFavorite: typeof p.isFavorite === 'boolean' ? p.isFavorite : false,
            description: p.description ?? '',
            createdAt: p.createdAt || Date.now(),
            updatedAt: p.updatedAt || Date.now(),
          }));
          localStorage.setItem('promptmaster_data', JSON.stringify(migrated));
        } catch {}
      }

      // Categories: ensure type field
      const rawCats = localStorage.getItem('promptmaster_categories');
      if (rawCats) {
        try {
          const cats = JSON.parse(rawCats);
          const migrated = cats.map((c: any) => ({
            ...c,
            type: c.type || 'user',
          }));
          localStorage.setItem('promptmaster_categories', JSON.stringify(migrated));
        } catch {}
      }

      // Users: ensure role, avatar
      const rawUsers = localStorage.getItem('promptmaster_users');
      if (rawUsers) {
        try {
          const users = JSON.parse(rawUsers);
          const migrated = users.map((u: any) => ({
            ...u,
            role: u.role || 'user',
            avatar: u.avatar || (u.name ? u.name.substring(0, 2).toUpperCase() : 'U'),
          }));
          localStorage.setItem('promptmaster_users', JSON.stringify(migrated));
        } catch {}
      }
    },
  },
  {
    version: 2,
    description: 'Add icon field to categories',
    migrate: () => {
      const rawCats = localStorage.getItem('promptmaster_categories');
      if (rawCats) {
        try {
          const cats = JSON.parse(rawCats);
          const migrated = cats.map((c: any) => ({
            ...c,
            icon: c.icon || 'Tag',
          }));
          localStorage.setItem('promptmaster_categories', JSON.stringify(migrated));
        } catch {}
      }
    },
  },
];

function getCurrentVersion(): number {
  const raw = localStorage.getItem(SCHEMA_VERSION_KEY);
  if (raw === null) return 0;
  const parsed = parseInt(raw, 10);
  return isNaN(parsed) ? 0 : parsed;
}

export const LATEST_SCHEMA_VERSION = migrations.length > 0
  ? migrations[migrations.length - 1].version
  : 0;

export function runMigrations(): void {
  const currentVersion = getCurrentVersion();
  if (currentVersion >= LATEST_SCHEMA_VERSION) return;

  const pending = migrations
    .filter(m => m.version > currentVersion)
    .sort((a, b) => a.version - b.version);

  for (const migration of pending) {
    try {
      console.log(`[PromptMaster] Running migration v${migration.version}: ${migration.description}`);
      migration.migrate();
      localStorage.setItem(SCHEMA_VERSION_KEY, String(migration.version));
    } catch (error) {
      console.error(`[PromptMaster] Migration v${migration.version} failed:`, error);
      break;
    }
  }
}
