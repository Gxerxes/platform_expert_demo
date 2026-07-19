import { lazy } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { PaletteProvider, buildRoutes } from '@palette/core';
import { AppShell } from '@palette/layout';
import type { PaletteRouteConfig } from '@palette/core';

// ─── Lazy-loaded pages ───────────────────────────────────

const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

// ─── Route configuration ─────────────────────────────────

const routes: PaletteRouteConfig[] = [
  {
    path: '/',
    component: AppShell as any,
    protected: true,
    children: [
      {
        path: '/',
        component: DashboardPage,
        protected: true,
      },
    ],
  },
];

const fallbackRoutes: PaletteRouteConfig[] = [
  {
    path: '*',
    component: NotFoundPage,
    protected: false,
  },
];

const router = createBrowserRouter([
  ...buildRoutes(routes),
  ...buildRoutes(fallbackRoutes),
]);

// ─── App Entry ───────────────────────────────────────────

export default function App() {
  return (
    <PaletteProvider>
      <RouterProvider router={router} />
    </PaletteProvider>
  );
}
