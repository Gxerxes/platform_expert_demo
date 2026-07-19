import { useRouteError, useNavigate } from 'react-router-dom';
import { ErrorPage } from '@palette/ui';
import { classifyError } from '@palette/api';

/**
 * Global route error page — displayed when a route-level error occurs.
 * Handles both React Router errors and custom error responses.
 */
export default function ErrorPageRoute() {
  const error = useRouteError();
  const navigate = useNavigate();

  // Classify the error for user-friendly display
  const platformError = classifyError(error);

  return (
    <ErrorPage
      error={platformError}
      onRetry={() => window.location.reload()}
      onGoHome={() => navigate('/')}
      onLogin={() => (window.location.href = '/palette/api/v1/auth/login')}
    />
  );
}
