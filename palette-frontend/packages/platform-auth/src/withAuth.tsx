/**
 * @palette/auth — withAuth HOC
 *
 * Higher-order component for injecting auth context into class components.
 * Also provides withPermission for permission-based rendering in class components.
 *
 * Usage:
 *   class MyComponent extends React.Component<{ auth: AuthContextValue }> {
 *     render() {
 *       const { user, hasPermission } = this.props.auth;
 *       return hasPermission('ADMIN') ? <AdminPanel /> : <UserPanel />;
 *     }
 *   }
 *
 *   export default withAuth(MyComponent);
 *
 *   // With custom prop name
 *   export default withAuth(MyComponent, 'authContext');
 */

import { type ComponentType } from 'react';
import { useAuth } from './AuthProvider';
import { usePermission } from './usePermission';
import type { AuthContextValue } from './types';

// ─── Types ────────────────────────────────────────────────

/**
 * Props injected by withAuth HOC.
 */
export interface WithAuthProps {
  auth: AuthContextValue;
}

/**
 * Props injected by withPermission HOC.
 */
export interface WithPermissionProps {
  permission: ReturnType<typeof usePermission>;
}

// ─── withAuth HOC ─────────────────────────────────────────

/**
 * Higher-order component that injects auth context as a prop.
 *
 * @param WrappedComponent - The component to wrap
 * @param propName - Name of the prop to inject (default: 'auth')
 *
 * @example
 *   // Basic usage
 *   class Dashboard extends React.Component<WithAuthProps> {
 *     render() {
 *       const { user, logout } = this.props.auth;
 *       return <div>Hello {user?.displayName}</div>;
 *     }
 *   }
 *   export default withAuth(Dashboard);
 *
 * @example
 *   // Custom prop name
 *   class Profile extends React.Component<{ authInfo: AuthContextValue }> {
 *     render() {
 *       return <span>{this.props.authInfo.user?.email}</span>;
 *     }
 *   }
 *   export default withAuth(Profile, 'authInfo');
 */
export function withAuth<P extends WithAuthProps>(
  WrappedComponent: ComponentType<P>,
  propName: string = 'auth'
): ComponentType<Omit<P, keyof WithAuthProps>> {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';

  function WithAuthWrapper(props: Omit<P, keyof WithAuthProps>) {
    const auth = useAuth();

    // Create props object with auth context
    const authProps = { [propName]: auth } as unknown as WithAuthProps;

    return <WrappedComponent {...({ ...props, ...authProps } as P)} />;
  }

  WithAuthWrapper.displayName = `withAuth(${displayName})`;

  return WithAuthWrapper;
}

// ─── withPermission HOC ───────────────────────────────────

/**
 * Higher-order component that injects permission utilities.
 *
 * @param WrappedComponent - The component to wrap
 * @param propName - Name of the prop to inject (default: 'permission')
 *
 * @example
 *   class AdminPanel extends React.Component<WithPermissionProps> {
 *     render() {
 *       const { hasPermission, hasRole } = this.props.permission;
 *       return hasRole('ADMIN') ? <AdminContent /> : <AccessDenied />;
 *     }
 *   }
 *   export default withPermission(AdminPanel);
 */
export function withPermission<P extends WithPermissionProps>(
  WrappedComponent: ComponentType<P>,
  propName: string = 'permission'
): ComponentType<Omit<P, keyof WithPermissionProps>> {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';

  function WithPermissionWrapper(props: Omit<P, keyof WithPermissionProps>) {
    const permission = usePermission();

    const permissionProps = { [propName]: permission } as unknown as WithPermissionProps;

    return <WrappedComponent {...({ ...props, ...permissionProps } as P)} />;
  }

  WithPermissionWrapper.displayName = `withPermission(${displayName})`;

  return WithPermissionWrapper;
}

// ─── Combined HOC ─────────────────────────────────────────

/**
 * Combined HOC that injects both auth and permission props.
 *
 * @example
 *   class SecurePage extends React.Component<WithAuthProps & WithPermissionProps> {
 *     render() {
 *       const { auth, permission } = this.props;
 *       if (!permission.hasPermission('SECURE_VIEW')) return <AccessDenied />;
 *       return <SecureContent user={auth.user} />;
 *     }
 *   }
 *   export default withAuthAndPermission(SecurePage);
 */
export function withAuthAndPermission<P extends WithAuthProps & WithPermissionProps>(
  WrappedComponent: ComponentType<P>
): ComponentType<Omit<P, keyof WithAuthProps & keyof WithPermissionProps>> {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';

  function WithAuthAndPermissionWrapper(props: Omit<P, keyof WithAuthProps & keyof WithPermissionProps>) {
    const auth = useAuth();
    const permission = usePermission();

    const injectedProps = {
      auth,
      permission,
    } as unknown as WithAuthProps & WithPermissionProps;

    return <WrappedComponent {...({ ...props, ...injectedProps } as P)} />;
  }

  WithAuthAndPermissionWrapper.displayName = `withAuthAndPermission(${displayName})`;

  return WithAuthAndPermissionWrapper;
}
