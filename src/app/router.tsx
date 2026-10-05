import { createBrowserRouter } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { ResumoPage } from '@/pages/ResumoPage';
import { AgendaPage } from '@/pages/AgendaPage';
import { FechamentoPage } from '@/pages/FechamentoPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <ResumoPage /> },
      { path: 'agenda', element: <AgendaPage /> },
      { path: 'fechamento', element: <FechamentoPage /> },
    ],
  },
]);
