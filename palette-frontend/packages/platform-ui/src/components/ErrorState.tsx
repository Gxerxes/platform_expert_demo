import { type ReactNode } from 'react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  retry?: () => void;
  action?: ReactNode;
}

export function ErrorState({ title = 'Something went wrong', message, retry, action }: ErrorStateProps) {
  return (
    <div style={{ textAlign: 'center', padding: 60 }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
      <h3 style={{ fontSize: 18, fontWeight: 600, color: '#333', marginBottom: 8 }}>{title}</h3>
      {message && <p style={{ color: '#e74c3c', fontSize: 14, marginBottom: 16 }}>{message}</p>}
      {retry && (
        <button
          onClick={retry}
          style={{
            padding: '8px 24px',
            border: '1px solid #ccc',
            borderRadius: 4,
            background: '#fff',
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          Try Again
        </button>
      )}
      {action}
    </div>
  );
}
