import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/auth';
import { Layout } from './components/Layout';
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute';
import { Button } from './components/ui';
import { LandingPage } from './pages/Landing';
import { LoginPage } from './pages/Login';
import { RegisterPage } from './pages/Register';
import { DashboardPage } from './pages/Dashboard';
import { ProjectPage } from './pages/Project';
import { ProfilePage } from './pages/Profile';

/** Landing for guests, straight into the app for signed-in users. */
function RootRoute() {
  const { token } = useAuthStore();
  return token ? <Navigate to="/dashboard" replace /> : <LandingPage />;
}

function NotFound() {
  const location = useLocation();
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="text-center space-y-4 animate-fade-in">
        <p className="text-6xl font-semibold text-zinc-800">404</p>
        <h1 className="text-lg font-medium text-zinc-100">Page not found</h1>
        <p className="text-sm text-zinc-500">
          The page <code className="text-zinc-400">{location.pathname}</code> doesn&apos;t exist.
        </p>
        <Link to="/" className="inline-flex">
          <Button variant="outline">Back to home</Button>
        </Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRoute />} />
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/projects/:id" element={<ProjectPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
