import { usePaletteContext } from '@palette/core';
import { useConfig } from '@palette/core';
import { PageContainer } from '@palette/layout';

/**
 * Dashboard page — displays current user context and platform info.
 * This is the only "page" in the foundation platform.
 * Business modules will add their own pages.
 */
export default function DashboardPage() {
  const { user, environment, locale, timezone } = usePaletteContext();
  const config = useConfig();

  return (
    <PageContainer title="Palette Platform">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
        {/* User Info Card */}
        <div style={cardStyle}>
          <h3 style={cardTitleStyle}>User Context</h3>
          <table style={{ width: '100%', fontSize: 14 }}>
            <tbody>
              <tr><td style={labelStyle}>ID</td><td>{user?.id ?? '-'}</td></tr>
              <tr><td style={labelStyle}>Username</td><td>{user?.username ?? '-'}</td></tr>
              <tr><td style={labelStyle}>Display Name</td><td>{user?.displayName ?? '-'}</td></tr>
              <tr><td style={labelStyle}>Email</td><td>{user?.email ?? '-'}</td></tr>
            </tbody>
          </table>
        </div>

        {/* Platform Info Card */}
        <div style={cardStyle}>
          <h3 style={cardTitleStyle}>Platform Info</h3>
          <table style={{ width: '100%', fontSize: 14 }}>
            <tbody>
              <tr><td style={labelStyle}>Application</td><td>{config.application}</td></tr>
              <tr><td style={labelStyle}>Version</td><td>{config.version}</td></tr>
              <tr><td style={labelStyle}>Environment</td><td>{environment}</td></tr>
              <tr><td style={labelStyle}>Locale</td><td>{locale}</td></tr>
              <tr><td style={labelStyle}>Timezone</td><td>{timezone}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </PageContainer>
  );
}

const cardStyle: React.CSSProperties = {
  backgroundColor: '#fff',
  borderRadius: 8,
  padding: 24,
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
};

const cardTitleStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  marginBottom: 16,
  color: '#1a1a2e',
};

const labelStyle: React.CSSProperties = {
  padding: '6px 0',
  color: '#666',
  width: 120,
  fontWeight: 500,
};
