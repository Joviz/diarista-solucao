import { RouterProvider } from 'react-router-dom';
import { router } from '@/app/router';
import { Toaster } from '@/components/ui/Toaster';

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster />
    </>
  );
}
