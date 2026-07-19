import { type ReactNode } from 'react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ title = 'No data', description, action }: EmptyStateProps) {
  return (
    <div style={{ textAlign: 'center', padding: 60 }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
      <h3 style={{ fontSize: 18, fontWeight: 600, color: '#333', marginBottom: 8 }}>{title}</h3>
      {description && <p style={{ color: '#666', fontSize: 14, marginBottom: 16 }}>{description}</p>}
      {action}
    </div>
  );
}
