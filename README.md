<div align="center">
  <h1>BITS Social Manager</h1>
  <p><strong>Social account manager for BITS projects</strong></p>
  <p>
    <a href="https://social.bits.co.id" target="_blank">social.bits.co.id</a> ·
    <a href="https://bits.co.id" target="_blank">Banten IT Solutions</a>
  </p>
  <p>
    Manage, secure, and organize social account credentials across projects
  </p>
  <br>
  <p>
    <img src="https://img.shields.io/badge/Cloudflare%20Workers-F38020?style=flat&logo=cloudflare&logoColor=white" alt="Cloudflare Workers" />
    <img src="https://img.shields.io/badge/Cloudflare%20D1-F38020?style=flat&logo=cloudflare&logoColor=white" alt="Cloudflare D1" />
    <img src="https://img.shields.io/badge/Hono-E36002?style=flat&logo=hono&logoColor=white" alt="Hono" />
    <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/React-18-20232A?style=flat&logo=react&logoColor=61DAFB" alt="React 18" />
    <img src="https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white" alt="Vite" />
    <img src="https://img.shields.io/badge/Tailwind%20CSS-38B2AC?style=flat&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/Vitest-6E9F18?style=flat&logo=vitest&logoColor=white" alt="Vitest" />
    <img src="https://img.shields.io/badge/license-MIT-green?style=flat" alt="MIT License" />
  </p>
</div>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Project Organization** | Group social accounts per project |
| **Encrypted Credentials** | Store passwords with AES-256-GCM |
| **JWT Authentication** | Register, login, logout, profile update |
| **Account Reveal Flow** | Decrypt password only on single account view |
| **Rate Limited Auth** | Limit register/login abuse |
| **Role-safe Ownership Checks** | Projects and accounts locked per user |
| **Cloudflare Native Deploy** | Workers, D1, custom domain, assets |
| **Type-safe UI + API** | React, Hono, Zod, TypeScript |
| **Test Coverage** | Unit tests + e2e tests |

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, React Router, React Hook Form, Zod, Zustand, Lucide React |
| **Backend** | Cloudflare Workers, Hono, D1 (SQLite), Drizzle ORM, bcryptjs, Web Crypto API |
| **Testing** | Vitest, Playwright |
| **Tooling** | Wrangler, ESLint-style TypeScript checks, npm |

---

## 📁 Project Structure

```text
BITS-Social-Manager/
├── .github/
│   └── workflows/
│       └── deploy.yml          # CI deploy pipeline
├── migrations/
│   └── 0001_init.sql           # D1 schema migration
├── public/
│   └── favicon.svg             # Static public asset
├── src/
│   ├── client/
│   │   ├── App.tsx             # App router + layout shell
│   │   ├── main.tsx            # Client entrypoint
│   │   ├── styles.css          # Global styles
│   │   ├── components/         # Layout, sidebar, UI, route guards
│   │   ├── lib/                # API client, types, utils
│   │   ├── pages/              # Login, register, dashboard, profile, project
│   │   └── store/              # Auth state
│   └── worker/
│       ├── index.ts            # Worker entry + CORS + assets routing
│       ├── db/                 # D1 connection and schema
│       ├── middleware/         # Auth and rate limit
│       ├── routes/             # auth, profile, projects, accounts
│       └── utils/              # JWT and crypto helpers
├── tests/
│   ├── unit/                   # auth, crypto, jwt tests
│   └── e2e/                    # app smoke test
├── API.md                      # API reference
├── SECURITY.md                 # Security notes
├── LICENSE                     # MIT license
├── package.json
├── wrangler.toml
└── vite.config.ts
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 24+
- npm
- Cloudflare account
- D1 database

### Steps

```bash
git clone https://github.com/Banten-IT-Solutions/BITS-Social-Manager.git
cd BITS-Social-Manager
npm ci
```

Create D1 database:

```bash
wrangler d1 create social-manager-db
```

Set `database_id` in `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "social-manager-db"
database_id = "YOUR_ID_HERE"
```

Apply migration:

```bash
npm run db:migrate:local
```

Set secrets:

```bash
wrangler secret put JWT_SECRET
wrangler secret put ENCRYPTION_KEY
```

Run dev:

```bash
npm run dev
```

Access:

- Frontend: `http://localhost:5173`
- Worker API: `http://localhost:8787`

Build:

```bash
npm run build
```

Deploy:

```bash
npm run deploy
```

---

## 💻 Development

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Run Vite + Wrangler dev |
| `npm run build` | Build frontend assets |
| `npm run preview` | Preview frontend build |
| `npm run deploy` | Build then deploy Worker |
| `npm run test` | Run unit tests |
| `npm run test:e2e` | Run Playwright tests |
| `npm run type-check` | Run TypeScript checks |

### Local data

- `migrations/` for D1 schema
- `.wrangler/` for local runtime state
- no Docker layer here; Cloudflare-first project

---

## ⚙️ Environment Configuration

### Required variables

| Variable | Description |
|----------|-------------|
| `JWT_SECRET` | JWT signing secret |
| `ENCRYPTION_KEY` | AES-256-GCM secret |
| `D1_DATABASE_ID` | Cloudflare D1 database ID |
| `CLOUDFLARE_API_TOKEN` | GitHub Actions deploy token |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID |

### Production domain

`wrangler.toml` default route:

```toml
[[routes]]
pattern = "social.bits.co.id"
custom_domain = true
```

Fork use same file, change `pattern` to own domain.

---

## 📡 API Endpoints

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register user |
| `POST` | `/api/auth/login` | Login user |
| `POST` | `/api/auth/logout` | Logout user |

### Profile

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/profile` | Get profile |
| `PUT` | `/api/profile` | Update name, email, password |

### Projects

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/projects` | List projects |
| `POST` | `/api/projects` | Create project |
| `GET` | `/api/projects/{id}` | Get project |
| `PUT` | `/api/projects/{id}` | Update project |
| `DELETE` | `/api/projects/{id}` | Delete project |

### Accounts

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/accounts` | List accounts across user's projects |
| `GET` | `/api/accounts?projectId={id}` | List accounts for one project |
| `POST` | `/api/accounts` | Create account |
| `GET` | `/api/accounts/{id}` | Reveal single password |
| `PUT` | `/api/accounts/{id}` | Update account |
| `DELETE` | `/api/accounts/{id}` | Delete account |

---

## 🔐 Security Notes

- Password stored encrypted, not plain text
- JWT required for protected routes
- Project ownership checked before account access
- Rate limit on auth endpoints
- `passwordEncrypted` not returned on list endpoints
- single-account reveal uses `Cache-Control: no-store`
- CORS currently permissive for Workers deployment flow; lock it tighter if needed per domain

---

## 📄 License

Distributed under MIT License. See `LICENSE`.

---

<div align="center">
  <strong>BITS Social Manager</strong> Made with ❤️ by <a href="https://bits.co.id"><strong>Banten IT Solutions</strong></a>
</div>
