import { useNavigate } from 'react-router-dom';
import { ErrorState } from '@palette/ui';

/**
 * 404 Not Found page.
 */
export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <ErrorState
      title="Page Not Found"
      message="The page you are looking for does not exist."
      action={
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '8px 24px',
            border: 'none',
            borderRadius: 4,
            background: '#1a73e8',
            color: '#fff',
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          Go Home
        </button>
      }
    />
  );
}
