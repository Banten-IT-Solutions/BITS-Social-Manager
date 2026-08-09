import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { zValidator } from '@hono/zod-validator';
import authRoutes from './routes/auth';
import profileRoutes from './routes/profile';
import projectsRoutes from './routes/projects';
import accountsRoutes from './routes/accounts';

export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  JWT_SECRET: string;
  ENCRYPTION_KEY: string;
}

export interface Variables {
  userId: string;
  userEmail: string;
  userName: string;
}

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// Security headers
app.use('*', secureHeaders());

// CORS — reflect origin, no credentials
app.use('/api/*', cors({
  origin: (origin) => origin ?? '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
}));

// Routes
app.route('/api/auth', authRoutes);
app.route('/api/profile', profileRoutes);
app.route('/api/projects', projectsRoutes);
app.route('/api/accounts', accountsRoutes);

// Health
app.get('/api/health', (c) => c.json({ status: 'ok', ts: Date.now() }));

// 404 for unknown API
app.all('/api/*', (c) => c.json({ error: 'Not found' }, 404));

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // API routes → Hono
    if (url.pathname.startsWith('/api/')) {
      return app.fetch(request, env, ctx);
    }

    // Static assets → ASSETS binding (SPA fallback handled by wrangler)
    return env.ASSETS.fetch(request);
  },
};
