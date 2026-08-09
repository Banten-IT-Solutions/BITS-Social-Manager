# Social Manager

Modern social media account management platform. Organize and secure your social accounts across multiple projects with enterprise-grade encryption.

[![Live](https://img.shields.io/website?url=https%3A%2F%2Fsocial.bits.co.id&label=social.bits.co.id)](https://social.bits.co.id)
[![CI/CD Deploy](https://github.com/BITS-Cloud-Platform/social.bits.co.id/actions/workflows/deploy.yml/badge.svg)](https://github.com/BITS-Cloud-Platform/social.bits.co.id/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/BITS-Cloud-Platform/social.bits.co.id/blob/main/LICENSE)

[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare%20Workers-F38020?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![Cloudflare D1](https://img.shields.io/badge/Cloudflare%20D1-F38020?logo=cloudflare&logoColor=white)](https://developers.cloudflare.com/d1/)
[![Hono](https://img.shields.io/badge/Hono-E36002?logo=hono&logoColor=white)](https://hono.dev/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle%20ORM-C5F74F?logo=drizzle&logoColor=black)](https://github.com/drizzle-team/drizzle-orm)

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React 18](https://img.shields.io/badge/React-18-20232A?logo=react&logoColor=61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

[![Vitest](https://img.shields.io/badge/Vitest-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev/)
[![Playwright](https://img.shields.io/badge/Playwright-2EAD33?logo=playwright&logoColor=white)](https://playwright.dev/)
[![Zod](https://img.shields.io/badge/Zod-3E67B1?logo=zod&logoColor=white)](https://zod.dev/)

**Live at:** https://social.bits.co.id  
**Hosted by:** Cloudflare (Workers + D1)
**Repository:** https://github.com/BITS-Cloud-Platform/social.bits.co.id

---

Powered by [Banten IT Solutions](https://bits.co.id)

## 🎯 Fitur Utama

- **Authentication**: Register & Login dengan bcrypt hashing
- **Project Management**: Organize social accounts by project (e.g., "Banten IT Solutions")
- **Social Account Tracking**: Support 11 platform populer dengan CRUD operations
- **Password Management**: Encrypted storage dengan AES-256-GCM, reveal & copy on demand
- **Profile Management**: Edit nama, email, dan password user
- **Modern UI**: Dark minimalist design dengan icon-based navigation (Vercel Dashboard style)
- **Custom Select Dropdowns**: Select2-style dropdown untuk filter platform & form, konsisten dengan tema gelap
- **Responsive**: Mobile, tablet, dan desktop optimized
- **Security**: JWT auth, CORS, rate limiting, input validation
- **Type-Safe**: Full TypeScript implementation

## 📱 Platform Yang Didukung

- Gmail
- YouTube
- Facebook
- Instagram
- Threads
- WhatsApp
- Telegram
- TikTok
- Shopee
- X (Twitter)
- LinkedIn
- GitHub

## 🛠️ Tech Stack

**Frontend:**
- React 18 + TypeScript
- React Router v6
- React Hook Form + Zod (validation)
- Zustand (state management)
- Tailwind CSS (dark mode)
- Lucide React (icons)

**Backend:**
- Hono (web framework)
- D1 (SQLite database)
- Drizzle ORM
- JWT (Web Crypto API)
- Bcryptjs (password hashing)
- AES-256-GCM (encryption)

**DevOps:**
- Vite (build tool)
- Vitest (unit tests)
- Playwright (e2e tests)
- Wrangler (Cloudflare CLI)

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install --legacy-peer-deps
```

### 2. Create D1 Database (First Time Only)

```bash
wrangler d1 create social-manager-db
```

Copy `database_id` dari output dan update di `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "social-manager-db"
database_id = "YOUR_ID_HERE"  # ← Paste here
```

### 3. Generate & Apply Migrations

```bash
# Local development
npm run db:migrate:local

# Production
npm run db:migrate:remote
```

### 4. Set Secrets

```bash
# Generate strong encryption key (32 bytes = 64 hex chars)
node -e "console.log(crypto.randomBytes(32).toString('hex'))"

# Set secrets
wrangler secret put JWT_SECRET
wrangler secret put ENCRYPTION_KEY
```

**wrangler.toml** has placeholders for local dev, but secrets via `wrangler secret` override them in production.

### 5. Development

```bash
npm run dev
```

Opens:
- Frontend: `http://localhost:5173` (also exposed on network IPs, e.g. `http://<your-ip>:5173`)
- Worker API: `http://localhost:8787`
- API proxied through Vite (`/api` → `localhost:8787`)

### 6. Build & Deploy

```bash
npm run build
npm run deploy
```

## 📁 Project Structure

```
src/
├── client/                 # React frontend
│   ├── App.tsx            # Main app router
│   ├── main.tsx           # Entry point
│   ├── pages/
│   │   ├── Login.tsx      # Auth page
│   │   ├── Register.tsx   # Registration
│   │   ├── Dashboard.tsx  # Projects list
│   │   ├── Project.tsx    # Social accounts per project
│   │   └── Profile.tsx    # User profile/settings
│   ├── components/
│   │   ├── Layout.tsx     # Main layout with sidebar
│   │   ├── Sidebar.tsx    # Navigation sidebar
│   │   ├── ProtectedRoute.tsx  # Auth guard
│   │   ├── PlatformIcon.tsx    # Platform SVG icons
│   │   └── ui.tsx         # Reusable UI components
│   ├── lib/
│   │   ├── api.ts         # API client
│   │   ├── types.ts       # TypeScript types
│   │   └── utils.ts       # Utilities
│   ├── store/
│   │   └── auth.ts        # Zustand auth store
│   └── styles.css         # Global styles
│
├── worker/                 # Hono backend
│   ├── index.ts           # Main entry point
│   ├── db/
│   │   ├── index.ts       # D1 connection
│   │   └── schema.ts      # Drizzle schema
│   ├── routes/
│   │   ├── auth.ts        # Auth endpoints
│   │   ├── profile.ts     # Profile endpoints
│   │   ├── projects.ts    # Projects CRUD
│   │   └── accounts.ts    # Social accounts CRUD
│   ├── middleware/
│   │   ├── auth.ts        # JWT auth middleware
│   │   └── rateLimit.ts   # Rate limiting
│   └── utils/
│       ├── jwt.ts         # JWT utilities
│       └── crypto.ts      # Encryption utilities
│
├── migrations/            # Database migrations
└── tests/                 # Unit & e2e tests
```

## 🔐 Database Schema

### Users Table
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

### Projects Table
```sql
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  description TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

### Social Accounts Table
```sql
CREATE TABLE social_accounts (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  platform TEXT NOT NULL,
  account_name TEXT NOT NULL,
  email_handle TEXT NOT NULL,
  password_encrypted TEXT NOT NULL,
  notes TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

## 🔗 API Endpoints

### Authentication

- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout (client-side token removal)

### Profile

- `GET /api/profile` - Get current user profile
- `PUT /api/profile` - Update user name, email, or password

### Projects

- `GET /api/projects` - List all projects (user-scoped)
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Social Accounts

- `GET /api/accounts?projectId=<id>` - List accounts per project
- `GET /api/accounts/:id` - Fetch account & decrypt password (reveal feature)
- `POST /api/accounts` - Create social account
- `PUT /api/accounts/:id` - Update social account
- `DELETE /api/accounts/:id` - Delete social account

## 🔒 Security Features

### Password Hashing
- **Algorithm**: bcryptjs (10 rounds)
- **Storage**: User passwords hashed with salt
- **Comparison**: Constant-time comparison

### Account Password Encryption
- **Algorithm**: AES-256-GCM
- **Key**: Raw 32-byte key derived directly from `ENCRYPTION_KEY` (64 hex chars)
- **IV**: Random 12 bytes per encryption, prepended to ciphertext
- **Auth Tag**: 16 bytes appended for integrity validation
- **Format**: `base64( iv[12] || ciphertext || authTag[16] )`

### JWT Authentication
- **Algorithm**: HMAC SHA-256 (Web Crypto API)
- **Expiry**: 7 days
- **Payload**: `{ sub: userId, email, name }`
- **Signature**: Verified on every protected request

### API Security
- **CORS**: Configured headers
- **Secure Headers**: X-Content-Type-Options, X-Frame-Options, etc.
- **Rate Limiting**: 10 requests per 15 minutes on auth endpoints
- **Input Validation**: Zod schema validation on all endpoints
- **SQL Injection**: Prevented by Drizzle ORM parameterized queries

## 🧪 Testing

### Unit Tests

```bash
npm run test
```

Includes:
- JWT generation & verification
- Password hashing & comparison
- Encryption/decryption
- Rate limiting logic
- Auth middleware

Coverage: 17 tests passing

### E2E Tests

```bash
npm run test:e2e
```

Requires `wrangler dev` running in another terminal.

## 📊 Verification Checklist

✅ All 17 unit tests passing
✅ Build succeeds (Vite + TypeScript strict mode)
✅ Minimal bundle (app gzip ~38KB, vendor ~53KB)
✅ TypeScript type-safe end-to-end
✅ Dark mode default UI
✅ Responsive design (mobile to desktop)
✅ Icon-based navigation (Lucide React)
✅ CRUD operations verified
✅ Authentication flow tested
✅ No known vulnerabilities (npm audit)
✅ Production-ready configuration

## 🎨 UI/UX Features

- **Dark Minimalist Theme**: Zinc color palette (Vercel-inspired)
- **Icon-Based Navigation**: Lucide React icons throughout
- **Ultra-Compact Sidebar**: 64px icon-only sidebar with right-side tooltips
- **Responsive Layout**: Mobile to desktop optimized
- **Platform Icons**: Custom SVG icons for 11 platforms
- **Form Validation**: Real-time error feedback
- **Custom Selects**: Native-style dropdowns (filter & form) themed to match the UI
- **Password Reveal**: Click an eye to decrypt-inline, then copy or hide
- **Project Card Hover**: Gradient hover effect with live account counts
- **Account Search & Filter**: Search by name/email/platform/notes + pagination

## 🌐 Environment Variables

**Required for production:**

```
JWT_SECRET=<min-32-chars-random-string>
ENCRYPTION_KEY=<64-hex-chars-32-bytes>
```

Set via `wrangler secret put` before deploying.

**Local development (file `.dev.vars`, tidak di-commit):**

```txt
JWT_SECRET=dev-secret-min-32-chars
ENCRYPTION_KEY=0000...
```

> Note: `[vars]` sudah dihapus dari `wrangler.toml`. Local dev membaca `.dev.vars`, produksi memakai `wrangler secret` (nilai secret selalu menimpa `[vars]` bila ada).

## 📝 Development Notes

### Rate Limiting

Auth endpoints (`/api/auth/login`, `/api/auth/register`) limited to **10 requests per 15 minutes** per IP.

### Password Reveal

Account passwords are encrypted and only decrypted on-demand via `GET /api/accounts/:id`. The decrypted password is fetched live for the reveal feature and is **not logged or stored client-side** beyond the current view state.

### Token Refresh

Current implementation uses 7-day JWT tokens without refresh tokens. For longer sessions or offline support, consider adding refresh token rotation in the future.

### CORS

CORS reflects the request origin and allows credentials. For a locked-down setup, restrict to your domain in `src/worker/index.ts`:

```typescript
app.use('/api/*', cors({
  origin: 'https://social.bits.co.id',
  // ...
}));
```

## 🐛 Troubleshooting

### D1 Database Not Found
```bash
wrangler d1 list
wrangler d1 create social-manager-db
# Update database_id in wrangler.toml
npm run db:migrate:local
```

### "ENCRYPTION_KEY must be 64 hex chars"
```bash
node -e "console.log(crypto.randomBytes(32).toString('hex'))"
wrangler secret put ENCRYPTION_KEY
```

### Peer Dependency Warning
```bash
npm install --legacy-peer-deps
```

Workers-types has stricter peer deps; `--legacy-peer-deps` resolves safely.

### CORS Errors in Production
Update CORS origin in `src/worker/index.ts` to match your deployment domain.

## 🤖 CI/CD — Auto Deploy ke Cloudflare (GitHub Actions)

Proyek ini dilengkapi workflow GitHub Actions (`.github/workflows/deploy.yml`) yang **otomatis deploy ke Cloudflare setiap push ke branch `main`**.

Workflow menggunakan versi terbaru dari semua action:
- `actions/checkout@v6`
- `actions/setup-node@v6` (Node.js 24)
- `cloudflare/wrangler-action@v4`

### Alur kerja

Pada setiap `push` ke `main` (atau via **Run workflow** manual), workflow otomatis:

1. `npm ci --legacy-peer-deps` — install dependensi
2. `npm run type-check` — validasi TypeScript strict
3. `npm run test` — jalankan unit tests (17 tests)
4. `npm run build` — build client & worker
5. `wrangler d1 migrations apply social-manager-db --remote` — apply migrasi D1
6. `wrangler deploy` — deploy worker + static assets

### 🔑 Setup Sekali (sebelum push pertama)

Buka **Settings → Secrets and variables → Actions** di GitHub repo, lalu tambahkan 2 secrets:

| Secret | Nilai | Cara dapat |
|--------|-------|------------|
| `CLOUDFLARE_API_TOKEN` | API token Cloudflare | Dashboard **My Profile → API Tokens → Create Token** dengan permissions: `Account - Workers Scripts - Edit`, `Account - D1 - Edit`, `Account - Account Settings - Read`, `Zone - Workers Routes - Edit`, `Zone - Zone - Read` |
| `CLOUDFLARE_ACCOUNT_ID` | Account ID Cloudflare | Dashboard → sidebar kanan (berikut nama akun, format hex 32 karakter) |
| `D1_DATABASE_ID` | ID D1 database (`social-manager-db`) | Jalankan `wrangler d1 list` lalu salin kolom `database_id` |
| `ZONE_ID` *(opsional)* | Zone ID untuk `bits.co.id` | Auto-resolve dari API bila tidak disetel; disetel manual agar lebih stabil |

> ⚠️ **`D1_DATABASE_ID` wajib disetel.** Workflow mengisi `database_id` di `wrangler.toml` dari secret ini (placeholder `"local-dev-id"` dipakai hanya untuk dev lokal). Tanpa secret ini, migrasi remote gagal dengan `Invalid property: databaseId => Invalid uuid`.

> 🎯 **Custom domain `social.bits.co.id` dipasang otomatis** saat deploy. Workflow mengambil `ZONE_ID` dari akun (mencari zona `bits.co.id` via API Cloudflare, atau memakai secret `ZONE_ID` bila disetel) lalu mengganti placeholder di `wrangler.toml`. Pastikan zona `bits.co.id` berada pada akun yang sama dengan worker. Dengan kemampuan `Zone - Read` pada token, tidak perlu custom steps manual di dashboard.

> ℹ️ `JWT_SECRET` dan `ENCRYPTION_KEY` sudah diset satu kali via `wrangler secret put` dan dipertahankan Cloudflare antar deploy — tidak perlu di-set di GitHub.

### 🧪 Uji coba tanpa push

Buka tab **Actions → Deploy to Cloudflare → Run workflow** lalu pilih branch `main`. Ini menjalankan pipeline yang sama tanpa push.

### 🔒 Keamanan workflow

`concurrency` mencegah dua deploy berjalan bersamaan, dan `permissions: contents: read` menjaga prinsip least-privilege. Token tidak pernah ditulis ke log.

---

## 📦 Deployment Checklist (Publikasi pertama)

- [ ] `wrangler d1 create social-manager-db`
- [ ] Update `database_id` di `wrangler.toml` (ID asli, bukan placeholder)
- [ ] `npm run db:migrate:remote`
- [ ] `wrangler secret put JWT_SECRET`
- [ ] `wrangler secret put ENCRYPTION_KEY`
- [ ] Update CORS origin untuk production domain
- [ ] Tambah secrets `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, & `D1_DATABASE_ID` di GitHub
- [ ] Tindakan terakhir: push ke `main` (workflow auto-deploy)

**Setelah itu**, semua update cukup `git push` ke `main` — deploy otomatis.

## 📖 Further Customization

### Adding More Platforms
1. Update `PLATFORMS` in `src/client/lib/types.ts`
2. Add SVG icon to `PlatformIcon.tsx`
3. Update `PLATFORMS` list in `src/worker/routes/accounts.ts` (Zod enum)
4. Redeploy

### Custom Domain
Update `wrangler.toml`:
```toml
route = "social.bits.co.id/*"
```

### Database Backups
```bash
wrangler d1 backup create social-manager-db
wrangler d1 backup list social-manager-db
```

## 📄 License

MIT

---

**Need Help?** Check the inline code comments for detailed explanations of authentication flows, encryption, and API patterns.
