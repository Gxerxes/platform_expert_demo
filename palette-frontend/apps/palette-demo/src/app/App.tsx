import { lazy } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { PaletteProvider, buildRoutes } from '@palette/core';
import { AppShell } from '@palette/layout';
import type { PaletteRouteConfig } from '@palette/core';

// ─── Lazy-loaded pages ───────────────────────────────────

const TaskListPage = lazy(() => import('../pages/TaskListPage'));
const TaskDetailPage = lazy(() => import('../pages/TaskDetailPage'));
const TaskCreatePage = lazy(() => import('../pages/TaskCreatePage'));

// ─── Route configuration ─────────────────────────────────
// Demonstrates how to register business routes on Palette platform.
// All protected routes require authentication (handled by PaletteProvider).

const routes: PaletteRouteConfig[] = [
  {
    path: '/tasks',
    component: AppShell as any,
    protected: true,
    children: [
      {
        path: '/tasks',
        component: TaskListPage,
        protected: true,
      },
      {
        path: '/tasks/create',
        component: TaskCreatePage,
        protected: true,
      },
      {
        path: '/tasks/:id',
        component: TaskDetailPage,
        protected: true,
      },
    ],
  },
];

const router = createBrowserRouter(buildRoutes(routes));

// ─── App Entry ───────────────────────────────────────────

export default function App() {
  return (
    <PaletteProvider>
      <RouterProvider router={router} />
    </PaletteProvider>
  );
}
