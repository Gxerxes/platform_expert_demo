import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import type { ResolvedMenuItem } from '@palette/router';

interface AppShellProps {
  /** Dynamic menu items for sidebar navigation */
  menuItems?: ResolvedMenuItem[];
}

/**
 * Main enterprise application shell.
 * Provides the standard Header + Sidebar + Content layout.
 * Accepts dynamic menu items for sidebar rendering.
 */
export function AppShell({ menuItems }: AppShellProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Header />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar items={menuItems} />
        <main style={{ flex: 1, overflow: 'auto', padding: 24, backgroundColor: '#f5f5f5' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
