import { SearchX } from 'lucide-react';
import { ButtonLink } from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';

export default function NotFound() {
  return (
    <div className="container" style={{ paddingBlock: 'var(--space-16)' }}>
      <EmptyState
        icon={<SearchX size={30} aria-hidden />}
        title="We couldn’t find that page"
        description="The link may be broken or the page may have moved. Try browsing the rentals instead."
        action={<ButtonLink to="/browse">Browse rentals</ButtonLink>}
      />
    </div>
  );
}
