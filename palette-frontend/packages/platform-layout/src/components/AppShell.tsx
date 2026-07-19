import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

/**
 * Main enterprise application shell.
 * Provides the standard Header + Sidebar + Content layout.
 */
export function AppShell() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Header />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar />
        <main style={{ flex: 1, overflow: 'auto', padding: 24, backgroundColor: '#f5f5f5' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
