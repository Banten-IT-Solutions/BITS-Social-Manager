<div align="center">
  <h1>BITS Social Manager</h1>
  <p>
    <a href="https://social.bits.co.id">
      <img src="https://img.shields.io/badge/social.bits.co.id-Online-00C853?style=for-the-badge&logo=statuspage&logoColor=white" alt="social.bits.co.id Online" />
    </a>
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

## 🏗️ Arsitektur

```
Browser
  ├─ Static assets (SPA React)      → Workers Assets — GRATIS, tak dihitung
  └─ /api/* (JSON)                  → Hono Worker (~1ms CPU)
        ├─ D1 binding      (database)
        └─ Web Crypto      (AES-GCM, JWT)
```

## ⚙️ Konfigurasi dinamis (tanpa nilai environment di repo)

Tidak ada ID database, nama Worker, atau domain yang di-commit. Semua nilai
lingkungan disuntik saat build/deploy (ala BITS-Nota):

```
wrangler.template.jsonc   ← di-commit, berisi placeholder
        │  npm run cf:config (scripts/gen-wrangler.mjs)
        ▼
wrangler.jsonc            ← generated, ter-gitignore
        ▲
        ├─ lokal : file .env (salin dari .env.example)
        └─ CI    : GitHub Secrets
```

| Variabel | Contoh nilai | Keterangan |
|---|---|---|
| `WORKER_NAME` | `bits-social-manager` | Nama Worker di Cloudflare |
| `D1_DATABASE_NAME` | `bits-social-manager` | Nama database D1 (konsisten tanpa suffix) |
| `D1_DATABASE_ID` | `abcd-1234-…` | Dari output `wrangler d1 create` |
| `APP_URL` | `https://social.bits.co.id` | URL publik |
| `APP_DOMAIN` | `social.bits.co.id` | Custom domain Worker |
| `JWT_SECRET` | — | Secret HMAC, minimal 32 chars |
| `ENCRYPTION_KEY` | — | Secret AES 64 hex, `openssl rand -hex 32` |
| `CLOUDFLARE_API_TOKEN` | — | Token API (kredensial) |
| `CLOUDFLARE_ACCOUNT_ID` | — | ID akun Cloudflare |

## 📁 Project Structure

```text
BITS-Social-Manager/
├── .github/
│   └── workflows/
│       └── deploy.yml          # CI deploy pipeline (template-driven)
├── migrations/
│   └── 0001_init.sql           # D1 schema migration
├── public/
│   └── favicon.svg             # Static public asset
├── scripts/
│   └── gen-wrangler.mjs        # Generator wrangler.jsonc dari template
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
├── wrangler.template.jsonc     # Template — placeholder disubstitusi oleh cf:config
├── .env.example                # Contoh env lokal
├── .dev.vars.example           # Contoh dev vars
├── package.json
└── vite.config.ts              # Vite + @cloudflare/vite-plugin
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 24+
- npm
- Cloudflare account (zone `bits.co.id` aktif untuk custom domain)
- D1 database

### Steps

```bash
git clone https://github.com/Banten-IT-Solutions/BITS-Social-Manager.git
cd BITS-Social-Manager
npm ci
wrangler login

# 1. Provision resource (sekali saja) — nama konsisten bits-social-manager
wrangler d1 create bits-social-manager   # salin database_id

# 2. Konfigurasi lokal
cp .env.example .env                     # isi D1_DATABASE_ID di sini
cp .dev.vars.example .dev.vars           # isi JWT_SECRET & ENCRYPTION_KEY untuk dev

# 3. Migrasi skema (lokal)
npm run db:migrate:local

# 4. Set secrets (prod: via wrangler secret put, dev: via .dev.vars)
# Lokal dev sudah via .dev.vars, untuk prod:
# echo "$(openssl rand -base64 48)" | wrangler secret put JWT_SECRET
# echo "$(openssl rand -hex 32)" | wrangler secret put ENCRYPTION_KEY

# 5. Jalankan (otomatis cf:config → vite + worker)
npm run dev
```

Access:

- Frontend + API: `http://localhost:5173` (single server via @cloudflare/vite-plugin)

Build:

```bash
npm run build   # otomatis cf:config + vite build
```

Deploy (manual lokal):

```bash
npm run db:migrate:remote
npm run deploy
```

Deploy otomatis: push ke `main` → GitHub Actions generate `wrangler.jsonc` dari Secrets → typecheck → build → migrate → deploy.

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

## 🔄 Migrasi dari nama lama (social-manager → bits-social-manager)

Jika Anda sudah deploy dengan nama lama `social-manager` / `social-manager-db`, lakukan rename sekali:

```bash
# 1. Buat D1 baru dengan nama konsisten
wrangler d1 create bits-social-manager
# → salin database_id baru ke .env dan GitHub Secrets D1_DATABASE_ID/D1_DATABASE_NAME

# 2. Migrasi data lama → baru (jika ada data produksi)
wrangler d1 export social-manager-db --remote --output dump.sql
wrangler d1 execute bits-social-manager --remote --file dump.sql
# atau manual: copy via SQL dump & import

# 3. Update GitHub Secrets (Settings → Secrets and variables → Actions)
# WORKER_NAME=bits-social-manager
# D1_DATABASE_NAME=bits-social-manager
# D1_DATABASE_ID=<id baru>
# APP_URL=https://social.bits.co.id
# APP_DOMAIN=social.bits.co.id

# 4. Re-put secrets ke worker baru
 echo "$JWT_SECRET" | wrangler secret put JWT_SECRET --name bits-social-manager
 echo "$ENCRYPTION_KEY" | wrangler secret put ENCRYPTION_KEY --name bits-social-manager

# 5. Deploy ulang (push ke main atau manual)
npm run deploy

# 6. Setelah verifikasi social.bits.co.id OK, hapus worker & D1 lama (opsional)
# wrangler delete --name social-manager
# wrangler d1 delete social-manager-db
```

> **Catatan:** D1 `database_name` tidak bisa di-rename in-place di Cloudflare — harus create baru. Worker `name` juga create baru; custom domain akan otomatis pindah ke worker baru saat deploy (karena `routes` sama).

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
  <strong>BITS Social Manager</strong> Developed with ❤️ by <a href="https://bits.co.id"><strong>Banten IT Solutions</strong></a>
</div>
