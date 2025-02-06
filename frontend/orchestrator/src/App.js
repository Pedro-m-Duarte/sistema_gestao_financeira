import React, { Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

const AppDashboard = React.lazy(() => import('dashboard/AppDashboard'));
const AppNavBar = React.lazy(() => import('navbar/AppNavBar'));
const AppPainelControl = React.lazy(() => import('painelControl/AppPainelControl'));

const router = createBrowserRouter([
  // {
  //   path: "/",
  //   element: (
  //     <Suspense fallback={<div>Loading...</div>}>
  //       <AppNavBar />
  //     </Suspense>
  //   ),
  // },
  {
    path: "/dashboard",
    element: (
      <Suspense fallback={<div>Loading...</div>}>
        <AppNavBar />
        <AppDashboard />
      </Suspense>
    ),
  },
  {
    path: "/painel-control",
    element: (
      <Suspense fallback={<div>Loading...</div>}>
        <AppNavBar />
        <AppPainelControl />
      </Suspense>
    ),
  },
]);


export default function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RouterProvider router={router} />
    </Suspense>
  );
}