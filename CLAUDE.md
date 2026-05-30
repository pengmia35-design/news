# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start all 3 services (server + client + admin) concurrently
npm run dev

# Start individually
npm run dev:server   # Express on :3001 (with --watch auto-restart)
npm run dev:client   # Vite on :5175
npm run dev:admin    # Vite on :5174

# Install all dependencies
npm run install:all

# Build for production
npm run build
```

## Seed Data

```bash
cd server && node seed-data.js         # 25 initial articles
cd server && node seed-data-120.js     # 120 additional articles (with 6th category)
```

**Restart the server after running seed scripts** — sql.js runs in-memory, so the running server won't pick up database file changes until restarted.

## Architecture

Three-package monorepo:

- **`client/`** (port 5173) — Public-facing Vue 3 + Element Plus + Tailwind CSS site. Routes: `/`, `/category/:slug`, `/article/:id`, `/search`, `/about`.
- **`server/`** (port 3001) — Express REST API + sql.js SQLite database. JWT auth. Routes under `/api/`.
- **`admin/`** (port 5174) — Admin dashboard Vue 3 + Element Plus app. Routes: `/login`, `/dashboard`, `/articles`, `/articles/create`, `/articles/edit/:id`.

Vite proxies `/api` to `:3001` in both client and admin. `concurrently` runs all three in parallel via `npm run dev`.

## Database (sql.js)

Pure JavaScript SQLite via [sql.js](https://github.com/sql-js/sql.js) WASM — no native compilation needed. In-memory with explicit `db.save()` to disk.

Key behaviors:
- **Always call `db.save()` after write operations** — data is in-memory until saved.
- Transactions use `db.exec('BEGIN'/'COMMIT'/'ROLLBACK')` — not `db.run()`.
- The `getDatabase()` wrapper provides: `prepare(sql).run/all/get(...params)`, `exec(sql)`, `save()`, `transaction(fn)`.
- Database file: `server/news.db`
- Tables: `categories`, `tags`, `articles`, `article_tags`, `admins`

## API Patterns

All responses follow `{ code: 200, message: "...", data: ... }` on success, `{ code: 4xx, message: "...", data: null }` on failure. Available via `res.success(data, message)` and `res.fail(message, code)`.

### Public Routes
- `GET /api/articles` — List with pagination, category/tag/keyword/featured filters
- `GET /api/articles/:id` — Detail with prev/next, auto-increments view_count
- `GET /api/categories` — All categories with article_count
- `GET /api/tags` — All tags with article_count
- `GET /api/tags/:slug/articles` — Articles by tag

### Admin Routes (require `Authorization: Bearer <token>`)
- `POST /api/admin/login` — Returns JWT (7-day expiry)
- `GET /api/admin/dashboard` — Stats (article/draft/published/category/tag counts, total views)
- `CRUD /api/admin/articles` — Full article management
- `PATCH /api/admin/articles/:id/status` — Publish/unpublish
- `PATCH /api/admin/articles/:id/featured` — Toggle featured

### Crawler Routes (require auth)
- `POST /api/crawler/import` — Single article import
- `POST /api/crawler/import/batch` — Bulk import with transaction

## Auth

JWT-based. Secret: `techai-news-secret-key-2024` (overridable via `JWT_SECRET` env var). Stored in `admins` table. Default admin: `admin / admin123`.

## Styling

Three-tier CSS custom properties system in `client/src/assets/styles/design-tokens.css` (copied to `admin/src/assets/styles/` for build isolation):
- **Primitive tokens**: `--color-blue-50` through `--color-gray-900`
- **Semantic tokens**: `--color-primary`, `--color-accent`, `--color-background`, etc.
- **Component tokens**: `--card-bg`, `--card-shadow`, etc.
- Spacing: 4px base system (`--space-1` = 4px, `--space-2` = 8px, etc.)
- Dark mode: `[data-theme="dark"]` overrides on `body`

## Key Technical Decisions

- **sql.js over better-sqlite3**: Native modules fail on Node.js v24+ without build tools. sql.js is pure JS/WASM with no native dependencies.
- **Explicit db.save()**: sql.js is in-memory; all route handlers that write must call `db.save()`.
- **StatementWrapper**: Compatibility layer so sql.js can use `better-sqlite3`-like `.run()/.get()/.all()` API.
- **Tailwind + CSS variables**: Tailwind colors reference CSS custom properties (e.g., `text-[var(--color-foreground)]`), enabling dark mode without Tailwind class switching.
- **design-tokens.css duplicated to admin/**: Cross-project Vite imports cause build errors, so the token file is copied rather than shared.
- **Server restart for new data**: Since sql.js is in-memory, the database is loaded at startup from `news.db`. External scripts that modify the DB require a server restart to take effect.
