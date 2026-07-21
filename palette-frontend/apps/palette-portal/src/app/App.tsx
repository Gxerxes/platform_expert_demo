import { lazy } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { PaletteProvider, buildRoutes } from '@palette/core';
import { AppShell } from '@palette/layout';
import type { PaletteRouteConfig } from '@palette/core';

// ─── Lazy-loaded pages ───────────────────────────────────

const LandingPage = lazy(() => import('../pages/LandingPage'));
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));
const ErrorPageRoute = lazy(() => import('../pages/ErrorPageRoute'));

// ─── Route configuration ─────────────────────────────────

const routes: PaletteRouteConfig[] = [
  // Public landing page (no authentication required)
  {
    path: '/',
    component: LandingPage as any,
    protected: false,
  },
  // Protected application pages (inside AppShell)
  {
    path: '/dashboard',
    component: AppShell as any,
    protected: true,
    children: [
      {
        path: '/dashboard',
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
