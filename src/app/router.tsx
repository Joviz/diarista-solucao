import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { LoginPage } from '@/pages/LoginPage';
import { ResumoPage } from '@/pages/ResumoPage';
import { AgendaPage } from '@/pages/AgendaPage';
import { FechamentoPage } from '@/pages/FechamentoPage';
import { useAuth } from '@/context/AuthContext';

function logRouteStep(step: string, data?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  const host = typeof window !== 'undefined' ? window.location.host : 'ssr';
  const path = typeof window !== 'undefined' ? window.location.pathname : 'ssr';
  console.log(`[ROUTE:${step}] ${timestamp} host=${host} path=${path}`, data ?? '');
}

function ProtectedRoute() {
  const { user, loading, firebaseConfigured } = useAuth();

  logRouteStep('PROTECTED_ROUTE_RENDER', { loading, firebaseConfigured, hasUser: !!user });

  if (loading) {
    logRouteStep('PROTECTED_ROUTE_LOADING');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!firebaseConfigured || !user) {
    logRouteStep('PROTECTED_ROUTE_REDIRECT_TO_LOGIN', { firebaseConfigured, hasUser: !!user });
    return <Navigate to="/login" replace />;
  }

  logRouteStep('PROTECTED_ROUTE_ALLOW');
  return <Outlet />;
}

function PublicRoute() {
  const { user, loading } = useAuth();

  logRouteStep('PUBLIC_ROUTE_RENDER', { loading, hasUser: !!user });

  if (loading) {
    logRouteStep('PUBLIC_ROUTE_LOADING');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (user) {
    logRouteStep('PUBLIC_ROUTE_REDIRECT_TO_HOME', { hasUser: !!user });
    return <Navigate to="/" replace />;
  }

  logRouteStep('PUBLIC_ROUTE_ALLOW_LOGIN');
  return <Outlet />;
}

export const router = createBrowserRouter([
  {
    element: <PublicRoute />,
    children: [{ path: '/login', element: <LoginPage /> }],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          { index: true, element: <ResumoPage /> },
          { path: 'agenda', element: <AgendaPage /> },
          { path: 'fechamento', element: <FechamentoPage /> },
        ],
      },
    ],
  },
]);
