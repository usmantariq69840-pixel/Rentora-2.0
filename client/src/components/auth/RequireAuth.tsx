import { ShieldAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import { ButtonLink } from '../common/Button';
import EmptyState from '../common/EmptyState';
import PageLoader from '../common/PageLoader';

/**
 * Route guard. Guests are sent to /login and returned here afterwards.
 * This only improves the experience: the Express API checks the session and role itself.
 */
export default function RequireAuth({ children, role }: { children: ReactNode; role?: 'admin' }) {
  const { user, loading } = useAuth();
  const { pathname, search } = useLocation();

  if (loading) return <PageLoader label="Checking your session…" />;
  if (!user) {
    return <Navigate to={`/login?next=${encodeURIComponent(pathname + search)}`} replace state={{ reason: 'Please sign in to open that page.' }} />;
  }
  if (role && user.role !== role) {
    return (
      <div className="container" style={{ paddingBlock: 'var(--space-16)' }}>
        <EmptyState
          icon={<ShieldAlert size={30} aria-hidden />}
          title="This area is for the demo administrator"
          description="Your account doesn’t have access to this page. The server checks this too, not just the link."
          action={<ButtonLink to="/">Back to home</ButtonLink>}
        />
      </div>
    );
  }
  return <>{children}</>;
}
