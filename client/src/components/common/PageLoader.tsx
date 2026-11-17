import { Loader2 } from 'lucide-react';

export default function PageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div role="status" style={{ display: 'grid', placeItems: 'center', gap: 12, minHeight: '50vh', color: 'var(--text-secondary)' }}>
      <Loader2 size={32} style={{ animation: 'spin 0.9s linear infinite', color: 'var(--teal-700)' }} aria-hidden />
      <span>{label}</span>
    </div>
  );
}
