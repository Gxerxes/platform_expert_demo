import { useAuth } from '@palette/auth';
import { usePaletteContext } from '@palette/context';
import { useConfig } from '@palette/config';

/**
 * Application header displaying app name, user info, and logout button.
 */
export function Header() {
  const { logout } = useAuth();
  const { user, environment } = usePaletteContext();
  const config = useConfig();

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 56,
        padding: '0 24px',
        backgroundColor: '#1a1a2e',
        color: '#fff',
        borderBottom: '1px solid #333',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: 1 }}>
          {config.application.toUpperCase()}
        </span>
        <span
          style={{
            fontSize: 11,
            padding: '2px 8px',
            borderRadius: 4,
            backgroundColor: environment === 'PROD' ? '#e74c3c' : '#2ecc71',
            color: '#fff',
          }}
        >
          {environment}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {user && (
          <span style={{ fontSize: 14 }}>{user.displayName || user.username}</span>
        )}
        <button
          onClick={logout}
          style={{
            padding: '6px 16px',
            fontSize: 13,
            cursor: 'pointer',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: 4,
            background: 'transparent',
            color: '#fff',
          }}
        >
          Logout
        </button>
      </div>
    </header>
  );
}
