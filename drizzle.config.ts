import { defineConfig } from 'drizzle-kit';

// Generate SQL migration untuk D1: `npm run db:generate`
// Terapkan: `npm run db:migrate:local` / `npm run db:migrate:remote`
export default defineConfig({
  dialect: 'sqlite',
  schema: './src/worker/db/schema.ts',
  out: './migrations',
});
