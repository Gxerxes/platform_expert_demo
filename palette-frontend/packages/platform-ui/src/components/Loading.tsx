import { type ReactNode } from 'react';

interface LoadingProps {
  text?: string;
  fullScreen?: boolean;
}

export function Loading({ text = 'Loading...', fullScreen = false }: LoadingProps) {
  const style: React.CSSProperties = fullScreen
    ? { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 12 }
    : { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, flexDirection: 'column', gap: 12 };

  return (
    <div style={style}>
      <div
        style={{
          width: 32,
          height: 32,
          border: '3px solid #e0e0e0',
          borderTopColor: '#1a73e8',
          borderRadius: '50%',
          animation: 'palette-spin 0.8s linear infinite',
        }}
      />
      <span style={{ color: '#666', fontSize: 14 }}>{text}</span>
      <style>{`@keyframes palette-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
