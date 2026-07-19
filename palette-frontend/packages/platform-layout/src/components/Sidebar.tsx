import { type ReactNode } from 'react';

interface SidebarProps {
  children?: ReactNode;
}

/**
 * Application sidebar.
 * Business modules can inject navigation items via children.
 */
export function Sidebar({ children }: SidebarProps) {
  return (
    <nav
      style={{
        width: 240,
        backgroundColor: '#fff',
        borderRight: '1px solid #e0e0e0',
        overflow: 'auto',
        padding: '16px 0',
      }}
    >
      {children ?? (
        <div style={{ padding: '16px 24px', color: '#999', fontSize: 13 }}>
          No navigation configured
        </div>
      )}
    </nav>
  );
}
