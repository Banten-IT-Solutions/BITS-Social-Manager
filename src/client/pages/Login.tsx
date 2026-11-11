import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { useState } from 'react';
import { api } from '../lib/api';
import { useAuthStore } from '../store/auth';
import { Button, Input, FormField, Alert } from '../components/ui';
import { AnimatedBackground } from '../components/AnimatedBackground';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});
type FormData = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError(null);
    try {
      const res = await api.auth.login(data);
      setAuth(res.token, res.user);
      navigate(from, { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed');
    }
  };

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-zinc-950 p-4 text-zinc-100">
      <AnimatedBackground />

      <div className="relative w-full max-w-sm space-y-6">
        <div
          className="space-y-2 text-center motion-safe:animate-rise"
          style={{ animationDelay: '0.05s' }}
        >
          <div className="flex justify-center">
            <Link
              to="/"
              aria-label="Back to landing page"
              className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-3 backdrop-blur transition-colors hover:border-zinc-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400"
            >
              <Shield className="h-6 w-6 text-violet-400" aria-hidden="true" />
            </Link>
          </div>
          <h1 className="text-xl font-semibold tracking-tight">BITS Social Manager</h1>
          <p className="text-sm text-zinc-500">Sign in to your account</p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-lg shadow-violet-600/5 backdrop-blur motion-safe:animate-rise"
          style={{ animationDelay: '0.15s' }}
        >
          {error && <Alert variant="destructive">{error}</Alert>}

          <FormField label="Email" error={errors.email?.message} required>
            <Input
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              spellCheck={false}
              {...register('email')}
            />
          </FormField>

          <FormField label="Password" error={errors.password?.message} required>
            <Input
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              {...register('password')}
            />
          </FormField>

          <Button type="submit" variant="primary" className="w-full" loading={isSubmitting}>
            Sign in
          </Button>
        </form>

        <p
          className="text-center text-sm text-zinc-500 motion-safe:animate-rise"
          style={{ animationDelay: '0.3s' }}
        >
          No account?{' '}
          <Link
            to="/register"
            className="text-zinc-300 underline underline-offset-4 transition-colors hover:text-violet-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 rounded"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
