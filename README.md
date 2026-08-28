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
| **Encrypted Credentials** | AES-256-GCM encryption for account passwords, bcrypt for user passwords    |
| **JWT Authentication**    | Register, login, profile management with signed tokens                     |
| **Account Reveal Flow**   | Password decrypted only on single-account view (`Cache-Control: no-store`) |
| **Rate-Limited Auth**     | Brute-force protection on login and registration                           |
| **Ownership Enforcement** | All project and account operations scoped to the authenticated user        |
| **Cloudflare Native**     | Workers, D1, custom domain, and static assets via single Worker            |
| **Type-Safe Stack**       | End-to-end TypeScript with Hono, Zod, React Hook Form, and Drizzle ORM     |
| **Test Coverage**         | Unit tests (Vitest) and end-to-end tests (Playwright)                      |

## 🛠️ Tech Stack

| Layer        | Technology                                                                                                    |
| ------------ | ------------------------------------------------------------------------------------------------------------- |
| **Frontend** | React 19, TypeScript 7, Vite 8, Tailwind CSS 4, React Router 7, React Hook Form, Zod 4, Zustand, Lucide React |
| **Backend**  | Cloudflare Workers, Hono 4, D1 (SQLite), Drizzle ORM, bcryptjs, Web Crypto API                                |
| **Testing**  | Vitest 4, Playwright 1.62                                                                                     |
| **Tooling**  | Wrangler 4, ESLint 10, Prettier 3, simple-git-hooks + lint-staged, `scripts/gen-wrangler.mjs`                 |

---

## 📁 Project Structure

```text
BITS-Social-Manager/
├── .github/
│   ├── workflows/
│   │   └── deploy.yaml       # manual deploy via workflow_dispatch
│   └── dependabot.yml        # weekly npm + github-actions updates
├── migrations/
│   └── 0001_init.sql         # D1 schema
├── scripts/
│   └── gen-wrangler.mjs      # generates wrangler.jsonc from template
├── src/
│   ├── client/               # React SPA
│   │   ├── components/       # layout, guards, UI primitives
│   │   ├── pages/            # login, register, dashboard, project, profile
│   │   ├── store/            # Zustand auth state
│   │   ├── lib/              # API client, types, utils
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── styles.css
│   └── worker/               # Cloudflare Worker
│       ├── db/               # D1 connection and schema
│       ├── middleware/       # auth, rate limit
│       ├── routes/           # auth, profile, projects, accounts
│       ├── utils/            # jwt, crypto
│       └── index.ts          # Hono app + asset routing
├── tests/
│   ├── unit/                 # crypto, jwt, auth
│   └── e2e/                  # smoke tests
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

npm run cf:config
```

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

| Variable           | Example                     | Required | Description                              |
| ------------------ | --------------------------- | -------- | ---------------------------------------- |
| `WORKER_NAME`      | `bits-social-manager`       | Required | Worker name                              |
| `D1_DATABASE_NAME` | `bits-social-manager`       | Required | D1 database name                         |
| `D1_DATABASE_ID`   | `xxxx-xxxx-xxxx`            | Required | D1 database ID from `wrangler d1 create` |
| `APP_URL`          | `https://social.bits.co.id` | Required | Public URL                               |
| `APP_DOMAIN`       | `social.bits.co.id`         | Required | Custom domain                            |

##### GitHub Secrets

| Secret                  | Required | Description                                       |
| ----------------------- | -------- | ------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`  | Required | Cloudflare API token with Workers Edit permission |
| `CLOUDFLARE_ACCOUNT_ID` | Required | Cloudflare Account ID                             |
| `JWT_SECRET`            | Required | Min 32 chars, `openssl rand -base64 48`           |
| `ENCRYPTION_KEY`        | Required | 64 hex chars (32 bytes), `openssl rand -hex 32`   |

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

## 📡 API Overview

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
| `GET`    | `/api/health`                  | Health check                |

---

## 🔒 Security Notes

- User passwords hashed with bcrypt (10 rounds)
- Account passwords encrypted with AES-256-GCM via Web Crypto API
- JWT required for protected routes; ownership checks on all project and account operations
- `passwordEncrypted` omitted from list endpoints; single-account reveal uses `no-store` caching
- Rate limiting on authentication endpoints
- Security headers via `hono/secure-headers`

---

## 📄 License

MIT License. See `LICENSE`.

---

<div align="center">
  <strong>BITS Social Manager</strong> · Developed with ❤️ by <a href="https://banten-it-solutions.github.io"><strong>Banten IT Solutions</strong></a>
</div>
