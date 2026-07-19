import { type ReactNode } from 'react';

interface PageContainerProps {
  title?: string;
  children: ReactNode;
}

/**
 * Standard page container with optional title.
 */
export function PageContainer({ title, children }: PageContainerProps) {
  return (
    <div>
      {title && (
        <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 24, color: '#1a1a2e' }}>
          {title}
        </h1>
      )}
      {children}
    </div>
  );
}
