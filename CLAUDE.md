# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server on 0.0.0.0:3000
npm run build        # Production build (output: dist/)
npm run preview      # Preview production build locally
```

No test runner or linter is configured.

## Deployment

Deployed to `http://47.107.238.118` via nginx. Webroot: `/var/www/promptmaster/dist`.

**Server credentials:**
- IP: `47.107.238.118`
- User: `root`
- Password: `gseFaTaaCZ/4N2Z`

SSH requires password auth (no key configured), use `expect` to automate:

```bash
npm run build

# Upload
expect -c '
set timeout 60
spawn scp -o StrictHostKeyChecking=no -r dist/index.html dist/assets root@47.107.238.118:/var/www/promptmaster/dist/
expect "password:"
send "gseFaTaaCZ/4N2Z\r"
expect eof
'

# Reload nginx
expect -c '
set timeout 15
spawn ssh -o StrictHostKeyChecking=no root@47.107.238.118 "nginx -s reload"
expect "password:"
send "gseFaTaaCZ/4N2Z\r"
expect eof
'

# Verify
curl -s -o /dev/null -w "%{http_code}" http://47.107.238.118/
```

The app runs on plain HTTP (not HTTPS). Use `utils/generateId.ts` instead of `crypto.randomUUID()` for ID generation — the latter fails in non-secure contexts on some browsers.

## Environment Variables

Set `GEMINI_API_KEY` in `.env.local`. Vite injects it as `process.env.API_KEY` and `process.env.GEMINI_API_KEY` at build time (see `vite.config.ts`).

## Architecture

**Monolithic SPA** — no backend, no router. All state lives in React hooks (`App.tsx`) and persists to localStorage. Authentication is simulated client-side.

### Source Layout (flat, no `src/` directory)

- **`App.tsx`** — Root component. Owns all application state (users, prompts, categories, theme, language, auth) and passes handlers down as props. This is the single source of truth.
- **`index.tsx`** — React entry point, mounts `<App />` to `#root`.
- **`index.html`** — Loads Tailwind CSS, fonts, and CDN imports (React, lucide-react, @google/genai).
- **`types.ts`** — All TypeScript types/interfaces: `User`, `Prompt`, `Category`, `Language`, `Theme`, `UserRole`, `Visibility`, `ToastMessage`.

### Key Directories

- **`components/`** — UI components: `Sidebar`, `PromptList` (with `PromptCard`), `PromptEditor`, `Login`, `ChangePassword`, `UserManagement`, `Toast`, `Icon`.
- **`services/geminiService.ts`** — Google Gemini API integration (`optimizePromptWithAI`, `generateIdeasWithAI`). Uses `gemini-3-flash-preview` model.
- **`utils/translations.ts`** — i18n system. `t(lang, key, params?)` function with `zh`/`en` dictionaries.
- **`utils/generateId.ts`** — Safe UUID generator with `Math.random()` fallback for non-secure contexts.

### State & Persistence

All persistent state uses the pattern:
```typescript
const [data, setData] = useState(() => {
  const saved = localStorage.getItem('promptmaster_KEY');
  return saved ? JSON.parse(saved) : DEFAULT;
});
useEffect(() => localStorage.setItem('promptmaster_KEY', JSON.stringify(data)), [data]);
```

localStorage keys: `promptmaster_data` (prompts), `promptmaster_categories`, `promptmaster_users`, `promptmaster_theme`, `promptmaster_lang`. `currentUser` is session-only (not persisted).

### Auth & Roles

Three roles: `admin`, `user`, `guest`. Admin can manage users (add/delete). Guest is read-only (community public prompts only). New users get default password `123456` and `isFirstLogin: true` which forces a password change on first login.

### Navigation

No routing library. View switching is driven by `selectedCategoryId` state: `'all'` (my prompts), `'community'` (public), `'favorites'`, or a specific category ID. Modals (editor, user management) are independent boolean states.

### Visibility Model

Prompts have `visibility: 'public' | 'private'`. Users see their own prompts + public prompts. Guests only see public prompts in community view.

## Conventions

- Functional components as `const Component: React.FC<Props> = ({...}) => {}` with dedicated `Props` interfaces.
- Tailwind CSS utility classes with `dark:` variants for theming. Dark mode toggled via `document.documentElement.classList`.
- Use functional state updates (`setX(prev => ...)`) instead of closure-based (`setX([...items, new])`) to avoid stale closure bugs.
- Icons imported from `components/Icon.tsx` which re-exports lucide-react icons as an `Icons` object.
