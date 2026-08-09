# BITS Social Manager

[![Production](https://img.shields.io/badge/Production-social.bits.co.id-blue?logo=cloudflare&logoColor=white)](https://social.bits.co.id) [![CI](https://github.com/Banten-IT-Solutions/BITS-Social-Manager/actions/workflows/deploy.yml/badge.svg)](https://github.com/Banten-IT-Solutions/BITS-Social-Manager/actions/workflows/deploy.yml) [![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/Banten-IT-Solutions/BITS-Social-Manager/blob/main/LICENSE) [![Cloudflare Workers](https://img.shields.io/badge/Cloudflare%20Workers-F38020?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/) [![Cloudflare D1](https://img.shields.io/badge/Cloudflare%20D1-F38020?logo=cloudflare&logoColor=white)](https://developers.cloudflare.com/d1/) [![Hono](https://img.shields.io/badge/Hono-E36002?logo=hono&logoColor=white)](https://hono.dev/) [![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/) [![React 18](https://img.shields.io/badge/React-18-20232A?logo=react&logoColor=61DAFB)](https://react.dev/) [![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)](https://vite.dev/) [![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/) [![Vitest](https://img.shields.io/badge/Vitest-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev/) [![Playwright](https://img.shields.io/badge/Playwright-2EAD33?logo=playwright&logoColor=white)](https://playwright.dev/) [![Zod](https://img.shields.io/badge/Zod-3E67B1?logo=zod&logoColor=white)](https://zod.dev/)

Modern social media account management platform for organizing, securing, and managing account credentials across multiple projects.

## Overview

- Multi-project account organization
- Encrypted social account password storage
- JWT authentication
- Cloudflare Workers + D1 deployment
- Type-safe frontend and backend

## Tech Stack

**Frontend**
- React 18 + TypeScript
- React Router
- React Hook Form + Zod
- Zustand
- Tailwind CSS
- Lucide React

**Backend**
- Hono
- Cloudflare D1 (SQLite)
- Drizzle ORM
- JWT via Web Crypto API
- bcryptjs
- AES-256-GCM

**Tooling**
- Vite
- Vitest
- Playwright
- Wrangler

## Supported Platforms

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

## Requirements

- Node.js 24+
- npm
- Cloudflare account
- D1 database
- GitHub repo secrets

## Quick Start

### 1. Install dependencies

```bash
npm ci
```

### 2. Create D1 database

```bash
wrangler d1 create social-manager-db
```

Copy `database_id` into `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "social-manager-db"
database_id = "YOUR_ID_HERE"
```

### 3. Apply migrations

```bash
npm run db:migrate:local
npm run db:migrate:remote
```

### 4. Set secrets

```bash
wrangler secret put JWT_SECRET
wrangler secret put ENCRYPTION_KEY
```

### 5. Run local development

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Worker API: `http://localhost:8787`
- API proxied through Vite

### 6. Build and deploy

```bash
npm run build
npm run deploy
```

## Configuration

### Production environment

Set these values in production:

- `JWT_SECRET`
- `ENCRYPTION_KEY`
- `D1_DATABASE_ID`
- Cloudflare API token and account ID

### Custom domain

Edit `wrangler.toml`:

```toml
[[routes]]
pattern = "social.bits.co.id" # fork: "yourdomain.com"
custom_domain = true
```

Fork use same setup, only `pattern` change to target domain.

## Project Structure

```text
src/
├── client/
│   ├── components/
│   ├── lib/
│   ├── pages/
│   └── store/
└── worker/
    ├── db/
    ├── middleware/
    ├── routes/
    └── utils/
```

## Customization

### Add more platforms

1. Update `PLATFORMS` in `src/client/lib/types.ts`
2. Update icon in `src/client/components/PlatformIcon.tsx`
3. Update enum in `src/worker/routes/accounts.ts`
4. Redeploy

### Database backups

```bash
wrangler d1 backup create social-manager-db
wrangler d1 backup list social-manager-db
```

## Credits

Developed with ❤️ by [Banten IT Solutions](https://bits.co.id)
