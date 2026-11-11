<div align="center">
  <h1>BITS Social Manager</h1>
  <p>
    Secure social account manager for organizing project credentials across teams
  </p>
  <p>
    <img src="https://img.shields.io/badge/Cloudflare%20Workers-F38020?style=flat&logo=cloudflare&logoColor=white" alt="Cloudflare Workers" />
    <img src="https://img.shields.io/badge/Cloudflare%20D1-F38020?style=flat&logo=cloudflare&logoColor=white" alt="Cloudflare D1" />
    <img src="https://img.shields.io/badge/Hono-E36002?style=flat&logo=hono&logoColor=white" alt="Hono" />
    <img src="https://img.shields.io/badge/React%2019-20232A?style=flat&logo=react&logoColor=61DAFB" alt="React 19" />
    <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Vite%208-646CFF?style=flat&logo=vite&logoColor=white" alt="Vite" />
    <img src="https://img.shields.io/badge/Tailwind%20CSS%204-38B2AC?style=flat&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/license-MIT-green?style=flat" alt="MIT License" />
  </p>
</div>

---

## ✨ Features

| Feature                   | Description                                                                |
| ------------------------- | -------------------------------------------------------------------------- |
| **Project Organization**  | Group social accounts by project with isolated ownership                   |
| **Content Plan**          | Plan/schedule posts per social account with status tracking and video      |
| **Google Drive Videos**   | One OAuth connection per user; per-account folders; in-Drive video preview |
| **Encrypted Credentials** | AES-256-GCM encryption for account passwords, bcrypt for user passwords    |
| **JWT Authentication**    | Register, login, profile management with signed tokens                     |
| **Account Reveal Flow**   | Password decrypted only on single-account view (`Cache-Control: no-store`) |
| **Interactive API Docs**  | OpenAPI 3.1 spec at `/api/openapi.json`, Scalar UI at `/docs`              |
| **Rate-Limited Auth**     | Brute-force protection on login and registration                           |
| **Ownership Enforcement** | All project and account operations scoped to the authenticated user        |
| **Cloudflare Native**     | Workers, D1, custom domain, and static assets via single Worker            |
| **Type-Safe Stack**       | End-to-end TypeScript with Hono, Zod, React Hook Form, and Drizzle ORM     |
| **Test Coverage**         | Unit tests (Vitest) and end-to-end tests (Playwright)                      |

## 🛠️ Tech Stack

| Layer        | Technology                                                                                                        |
| ------------ | ----------------------------------------------------------------------------------------------------------------- |
| **Frontend** | React 19, TypeScript 7, Vite 8, Tailwind CSS 4, React Router DOM 7, React Hook Form, Zod 4, Zustand, Lucide React |
| **Backend**  | Cloudflare Workers, Hono 4, D1 (SQLite), Drizzle ORM, bcryptjs, Web Crypto API                                    |
| **API Docs** | OpenAPI 3.1 spec + Scalar API Reference served from the Worker (`/docs`)                                          |
| **Testing**  | Vitest 5, Playwright 1.65                                                                                         |
| **Tooling**  | Wrangler 4, ESLint 10, Prettier 3, simple-git-hooks + lint-staged, `scripts/gen-wrangler.mjs`                     |

---

## 📁 Project Structure

```text
BITS-Social-Manager/
├── .github/
│   ├── workflows/
│   │   └── deploy.yaml       # manual deploy via workflow_dispatch
│   └── dependabot.yml        # weekly npm + github-actions updates
├── migrations/
│   ├── 0001_init.sql         # D1 schema
│   └── 0002_content_plan.sql # posts + drive_connections + account folder id
├── scripts/
│   └── gen-wrangler.mjs      # generates wrangler.jsonc from template
├── src/
│   ├── client/               # React SPA
│   │   ├── components/       # layout, guards, UI primitives, AnimatedBackground
│   │   ├── pages/            # landing, login, register, overview, projects, project, content, profile, legal (terms/privacy)
│   │   ├── store/            # Zustand auth state
│   │   ├── lib/              # API client, types, utils
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── styles.css
│   └── worker/               # Cloudflare Worker
│       ├── db/               # D1 connection and schema
│       ├── middleware/       # auth, rate limit, validation
│       ├── routes/           # auth, profile, projects, accounts, posts, drive
│       ├── utils/            # jwt, crypto, google drive
│       ├── openapi.ts        # hand-written OpenAPI 3.1 spec (served at /api/openapi.json)
│       └── index.ts          # Hono app + /docs + asset routing
├── tests/
│   ├── unit/                 # crypto, jwt, auth, drive helpers/upload
│   └── e2e/                  # smoke + content plan tests
├── wrangler.template.jsonc   # template with ${VAR} placeholders
├── .env.example              # vars for local development
├── .dev.vars.example         # secrets for local development
├── vite.config.ts
├── vitest.config.ts
├── eslint.config.js
├── .prettierrc.json
└── package.json
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 24+ (LTS recommended)
- npm 10+
- Cloudflare account with an active zone for the custom domain
- D1 database

### 1. Clone

```bash
git clone https://github.com/Banten-IT-Solutions/BITS-Social-Manager.git
cd BITS-Social-Manager
```

### 2. Install

```bash
npm install
# installs git hooks via `prepare` (simple-git-hooks)
```

### 3. Configure (Local)

```bash
cp .env.example .env
cp .dev.vars.example .dev.vars

# Edit .env — required:
#   WORKER_NAME, D1_DATABASE_NAME, D1_DATABASE_ID, APP_URL, APP_DOMAIN
# Edit .dev.vars — required for `wrangler dev`:
#   JWT_SECRET (min 32 chars), ENCRYPTION_KEY (64 hex chars)
#   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET (only needed for Content Plan video uploads)

npm run cf:config
```

> `.env` and `.dev.vars` are gitignored. `GOOGLE_CLIENT_*` are optional: without them the app
> works normally and `POST /api/drive/connect` returns `503` until they are configured.

#### Google Drive OAuth (Content Plan)

1. In [Google Cloud Console](https://console.cloud.google.com/) create (or pick) a project.
2. **APIs & Services → Library → Google Drive API → Enable.**
3. **APIs & Services → OAuth consent screen:** choose External, add yourself as a test user while
   the app is in _Testing_ mode. Only the non-sensitive `drive.file` scope is used.
4. **APIs & Services → Credentials → Create credentials → OAuth client ID → Web application.**
5. Add authorized redirect URIs:
   - Local: `http://localhost:5173/api/integrations/google/callback`
   - Production: `https://<APP_DOMAIN>/api/integrations/google/callback`
6. Copy the client ID/secret into `.dev.vars` (local) and the GitHub Variables/Secrets (CI).

Each app user connects once at **Profile → Google Drive**. Videos are uploaded to
`BITS Social Manager / {platform} — {accountName}` in the user's own Drive, shared as
_anyone with the link (reader)_ so the in-app preview iframe works. Disconnecting or deleting a
post never deletes files from Drive.

> `wrangler.jsonc` is generated and gitignored. It is the only config used by `wrangler dev` and `wrangler deploy`.

### 4. Develop

```bash
npm run dev              # Vite + Worker with HMR (single server)
npm run db:migrate:local # apply D1 migrations locally
npm run test             # unit tests
npm run test:e2e         # e2e tests
```

### 5. Required Cloudflare Resources (One-Time Setup)

Create once before the first deploy. CI only deploys code; it does not provision resources.

| Resource        | Command                                  |
| --------------- | ---------------------------------------- |
| **D1 Database** | `wrangler d1 create bits-social-manager` |

> Custom domain is auto-provisioned on deploy from `routes: [{ "pattern": "${APP_DOMAIN}", "custom_domain": true }]` in `wrangler.template.jsonc`. Ensure the zone for `APP_DOMAIN` is active in Cloudflare.

### 6. Deploy

#### Option A — Local Deploy

Best for quick iteration from your machine.

```bash
npx wrangler login
npm run cf:config
npm run db:migrate:remote
npm run deploy
# equivalent to: npm run build && wrangler deploy
```

#### Option B — Remote Deploy via GitHub Actions (Recommended)

Best for production and team workflows. Triggered manually via `workflow_dispatch`.

1. Configure **GitHub Variables** and **Secrets** (tables below) at `Settings → Secrets and variables → Actions`.
2. Go to `Actions → Deploy → Run workflow`.

Pushes to `main` do not auto-deploy.

##### GitHub Variables

| Variable           | Example                           | Required | Description                                         |
| ------------------ | --------------------------------- | -------- | --------------------------------------------------- |
| `WORKER_NAME`      | `bits-social-manager`             | Required | Worker name                                         |
| `D1_DATABASE_NAME` | `bits-social-manager`             | Required | D1 database name                                    |
| `D1_DATABASE_ID`   | `xxxx-xxxx-xxxx`                  | Required | D1 database ID from `wrangler d1 create`            |
| `APP_URL`          | `https://social.bits.co.id`       | Required | Public URL                                          |
| `APP_DOMAIN`       | `social.bits.co.id`               | Required | Custom domain                                       |
| `GOOGLE_CLIENT_ID` | `xxxx.apps.googleusercontent.com` | Optional | OAuth client ID (required for Content Plan uploads) |

##### GitHub Secrets

| Secret                  | Required | Description                                             |
| ----------------------- | -------- | ------------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`  | Required | Cloudflare API token with Workers Edit permission       |
| `CLOUDFLARE_ACCOUNT_ID` | Required | Cloudflare Account ID                                   |
| `JWT_SECRET`            | Required | Min 32 chars, `openssl rand -base64 48`                 |
| `ENCRYPTION_KEY`        | Required | 64 hex chars (32 bytes), `openssl rand -hex 32`         |
| `GOOGLE_CLIENT_SECRET`  | Optional | OAuth client secret (required for Content Plan uploads) |

> Secrets are synced via `wrangler secret bulk` during deploy. For local development, set them in `.dev.vars`.

### 7. Configuration Flow

```
wrangler.template.jsonc  (committed, ${VAR} placeholders)
        │  npm run cf:config (scripts/gen-wrangler.mjs)
        ▼
wrangler.jsonc           (generated, gitignored)
        ▲
        ├─ local: .env + .dev.vars
        └─ CI:    GitHub Variables + Secrets
```

---

## 💻 Development

### Commands

| Command                     | Description                                         |
| --------------------------- | --------------------------------------------------- |
| `npm run cf:config`         | Generate `wrangler.jsonc` from `.env` / environment |
| `npm run dev`               | Start Vite + Worker                                 |
| `npm run build`             | Generate config and build client assets             |
| `npm run deploy`            | Build and deploy Worker                             |
| `npm run cf:typegen`        | Generate Cloudflare Workers types                   |
| `npm run db:generate`       | Generate Drizzle migration                          |
| `npm run db:migrate:local`  | Apply D1 migrations locally                         |
| `npm run db:migrate:remote` | Apply D1 migrations remotely                        |
| `npm run test`              | Run unit tests (Vitest)                             |
| `npm run test:e2e`          | Run e2e tests (Playwright)                          |
| `npm run type-check`        | TypeScript checks (client + worker)                 |
| `npm run check`             | Type check + lint                                   |
| `npm run lint`              | ESLint                                              |
| `npm run format`            | Format with Prettier                                |
| `npm run format:check`      | Check formatting                                    |

### Code Style & Git Hooks

- **Formatter:** Prettier 3 (`printWidth: 100`, `singleQuote`, `semi`, `tabWidth: 2`) — see `.prettierrc.json`
- **Linter:** ESLint 10 + `eslint-config-prettier` — see `eslint.config.js`
- **Hooks:** `simple-git-hooks` + `lint-staged` (auto-installed via `prepare`):
  - `pre-commit`: `prettier --write` + `eslint --fix`
  - `pre-push`: `npm run check && npm run build`

```bash
npm run format        # manual format
npm run format:check  # CI check
# skip hooks if needed: SKIP_SIMPLE_GIT_HOOKS=1 git commit -m "..."
```

### Build Optimization

- **Vite 8:** `esbuild` minify, `legalComments: none`, chunk splitting (`vendor` / `ui`), `reportCompressedSize: true`
- **Worker:** `wrangler deploy` with bundled assets

---

## 💻 App Routes

| Route           | Page                                                          | Access    |
| --------------- | ------------------------------------------------------------- | --------- |
| `/`             | Landing page (animated) → redirects to `/dashboard` if authed | Public    |
| `/terms`        | Terms of Service (Landing-style layout)                       | Public    |
| `/privacy`      | Privacy Policy (Landing-style layout)                         | Public    |
| `/login`        | Sign in                                                       | Public    |
| `/register`     | Create account                                                | Public    |
| `/dashboard`    | Workspace overview (stats, recent projects, platform usage)   | Protected |
| `/projects`     | Project list + create/edit/delete                             | Protected |
| `/projects/:id` | Project detail + social accounts                              | Protected |
| `/content`      | Content plan: schedule posts, upload videos, preview          | Protected |
| `/profile`      | Profile, password & Google Drive connection                   | Protected |
| `/docs`         | Interactive API reference (Scalar)                            | Public    |

---

## 📡 API Overview

> **Interactive documentation:** open [`/docs`](http://social.bits.co.id/docs) on the deployed app
> (or `http://localhost:5173/docs` in local dev) for the full OpenAPI 3.1 reference with a
> built-in request runner. Raw spec: [`/api/openapi.json`](http://social.bits.co.id/api/openapi.json).

### Auth

| Method | Endpoint             | Description   |
| ------ | -------------------- | ------------- |
| `POST` | `/api/auth/register` | Register user |
| `POST` | `/api/auth/login`    | Login user    |
| `POST` | `/api/auth/logout`   | Logout user   |

### Profile

| Method | Endpoint       | Description    |
| ------ | -------------- | -------------- |
| `GET`  | `/api/profile` | Get profile    |
| `PUT`  | `/api/profile` | Update profile |

### Projects

| Method   | Endpoint             | Description    |
| -------- | -------------------- | -------------- |
| `GET`    | `/api/projects`      | List projects  |
| `POST`   | `/api/projects`      | Create project |
| `GET`    | `/api/projects/{id}` | Get project    |
| `PUT`    | `/api/projects/{id}` | Update project |
| `DELETE` | `/api/projects/{id}` | Delete project |

### Accounts

| Method   | Endpoint                       | Description                 |
| -------- | ------------------------------ | --------------------------- |
| `GET`    | `/api/accounts`                | List accounts               |
| `GET`    | `/api/accounts?projectId={id}` | List accounts for a project |
| `POST`   | `/api/accounts`                | Create account              |
| `GET`    | `/api/accounts/{id}`           | Reveal password (decrypted) |
| `PUT`    | `/api/accounts/{id}`           | Update account              |
| `DELETE` | `/api/accounts/{id}`           | Delete account              |

### Content Plan (Posts)

| Method   | Endpoint                               | Description                                              |
| -------- | -------------------------------------- | -------------------------------------------------------- |
| `GET`    | `/api/posts`                           | List all posts across the user's accounts                |
| `GET`    | `/api/accounts/{accountId}/posts`      | List posts for one account                               |
| `POST`   | `/api/accounts/{accountId}/posts`      | Create post (JSON or `multipart/form-data` with `video`) |
| `GET`    | `/api/accounts/{accountId}/posts/{id}` | Get one post                                             |
| `PUT`    | `/api/accounts/{accountId}/posts/{id}` | Update, replace video, or move post to another account   |
| `DELETE` | `/api/accounts/{accountId}/posts/{id}` | Delete post (the Drive video is kept as an archive)      |

> Uploads are streamed to Drive via a resumable session and capped at **50 MB**
> (`MAX_VIDEO_BYTES`). A scheduled post requires `scheduledAt`. A new video on an existing post
> replaces the file content in place (same Drive file id/link/permissions).

### Google Drive

| Method   | Endpoint                            | Description                                                              |
| -------- | ----------------------------------- | ------------------------------------------------------------------------ |
| `GET`    | `/api/drive`                        | Connection status for the current user                                   |
| `POST`   | `/api/drive/connect`                | Create the Google OAuth consent URL (`state` = 10 min JWT)               |
| `DELETE` | `/api/drive`                        | Revoke + delete the stored connection (files stay)                       |
| `GET`    | `/api/integrations/google/callback` | Public OAuth callback (creates the root folder, stores encrypted tokens) |

> Scope: `drive.file openid email`. Refresh/access tokens are AES-256-GCM encrypted with
> `ENCRYPTION_KEY`. Folders are created lazily: `BITS Social Manager / {platform} — {accountName}`.

### Health

| Method | Endpoint      | Description  |
| ------ | ------------- | ------------ |
| `GET`  | `/api/health` | Health check |

---

## 🔒 Security Notes

- User passwords hashed with bcrypt (10 rounds)
- Account passwords encrypted with AES-256-GCM via Web Crypto API
- JWT required for protected routes; ownership checks on all project and account operations
- `passwordEncrypted` omitted from list endpoints; single-account reveal uses `no-store` caching
- Rate limiting on authentication endpoints
- Google OAuth refresh/access tokens are AES-256-GCM encrypted at rest; `state` is a short-lived JWT
- Uploaded videos are shared `anyone/reader` in the user's own Drive so the preview iframe works —
  only files created by this app are accessible (`drive.file` scope)
- Security headers via `hono/secure-headers`

---

## 📄 License

MIT License. See `LICENSE`.

---

<div align="center">
  <strong>BITS Social Manager</strong> · Developed with ❤️ by <a href="https://banten-it-solutions.github.io"><strong>Banten IT Solutions</strong></a>
</div>
