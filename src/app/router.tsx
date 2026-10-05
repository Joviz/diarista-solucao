import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { LoginPage } from '@/pages/LoginPage';
import { ResumoPage } from '@/pages/ResumoPage';
import { AgendaPage } from '@/pages/AgendaPage';
import { FechamentoPage } from '@/pages/FechamentoPage';
import { useAuth } from '@/context/AuthContext';

function ProtectedRoute() {
  const { user, loading, firebaseConfigured } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!firebaseConfigured || !user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

function PublicRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

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
