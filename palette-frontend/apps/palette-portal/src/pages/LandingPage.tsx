/**
 * Landing page — displayed before authentication.
 * Contains a "Login via EIDP" button that redirects to the BFF login endpoint.
 */
export default function LandingPage() {
  const handleLogin = () => {
    window.location.href = '/palette/api/v1/auth/login';
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={logoStyle}>P</div>
        <h1 style={titleStyle}>Palette Platform</h1>
        <p style={subtitleStyle}>Enterprise Application Portal</p>
        <button onClick={handleLogin} style={buttonStyle}>
          Login via EIDP
        </button>
        <p style={footerStyle}>
          Secure single sign-on powered by OIDC
        </p>
      </div>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  backgroundColor: '#f0f2f5',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
};

const cardStyle: React.CSSProperties = {
  textAlign: 'center',
  backgroundColor: '#fff',
  padding: '48px 64px',
  borderRadius: 12,
  boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
  maxWidth: 420,
};

const logoStyle: React.CSSProperties = {
  width: 64,
  height: 64,
  borderRadius: '50%',
  backgroundColor: '#1a73e8',
  color: '#fff',
  fontSize: 32,
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 24px',
};

const titleStyle: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 700,
  color: '#1a1a2e',
  margin: '0 0 8px',
};

const subtitleStyle: React.CSSProperties = {
  fontSize: 14,
  color: '#666',
  margin: '0 0 32px',
};

const buttonStyle: React.CSSProperties = {
  padding: '12px 32px',
  fontSize: 16,
  fontWeight: 600,
  color: '#fff',
  backgroundColor: '#1a73e8',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  width: '100%',
  transition: 'background-color 0.2s',
};

const footerStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#999',
  marginTop: 24,
  marginBottom: 0,
};
