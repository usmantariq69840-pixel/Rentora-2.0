import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useToast } from '../components/common/Toast';
import type { Listing } from '../types';
import { api } from './api';
import { useAuth } from './AuthContext';

/**
 * Saved (favourite) listings, stored in the database for the signed-in user.
 * Guests who press a heart are asked to sign in. Hearts update instantly and roll back
 * if the server says no.
 */
interface SavedApi {
  isSaved: (id: number) => boolean;
  toggle: (listing: Pick<Listing, 'id' | 'title'>) => void;
  count: number;
}

const SavedContext = createContext<SavedApi | null>(null);

export function SavedProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
  const { user, requireSignIn } = useAuth();
  const [ids, setIds] = useState<Set<number>>(new Set());
  const busy = useRef(new Set<number>());

  // Load this person's saved ids when they sign in; clear them when they sign out.
  useEffect(() => {
    if (!user) {
      setIds(new Set());
      return;
    }
    let alive = true;
    api<{ ids: number[] }>('/favorites')
      .then((d) => alive && setIds(new Set(d.ids)))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [user]);

  const toggle = useCallback<SavedApi['toggle']>(
    (listing) => {
      if (!requireSignIn('Sign in to save items to your list.')) return;
      if (busy.current.has(listing.id)) return; // ignore double-clicks while a request is in flight
      busy.current.add(listing.id);

      const wasSaved = ids.has(listing.id);
      const apply = (saved: boolean) =>
        setIds((prev) => {
          const next = new Set(prev);
          if (saved) next.add(listing.id);
          else next.delete(listing.id);
          return next;
        });

      apply(!wasSaved);
      api(`/favorites/${listing.id}`, { method: wasSaved ? 'DELETE' : 'POST' })
        .then(() => (wasSaved ? toast.info(`Removed ${listing.title} from saved`) : toast.success(`Saved ${listing.title}`)))
        .catch(() => {
          apply(wasSaved);
          toast.error('We couldn’t update your saved items. Please try again.');
        })
        .finally(() => busy.current.delete(listing.id));
    },
    [ids, requireSignIn, toast],
  );

  const value = useMemo<SavedApi>(() => ({ isSaved: (id) => ids.has(id), toggle, count: ids.size }), [ids, toggle]);
  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>;
}

export function useSaved(): SavedApi {
  const ctx = useContext(SavedContext);
  if (!ctx) throw new Error('useSaved must be used inside <SavedProvider>');
  return ctx;
}
