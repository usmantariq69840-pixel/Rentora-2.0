import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useToast } from '../components/common/Toast';
import type { AppNotification } from '../types';
import { api } from './api';
import { useAuth } from './AuthContext';

interface NotificationsApi {
  notifications: AppNotification[];
  unreadCount: number;
  /** Increases whenever something new arrives — used to ring the bell */
  arrivals: number;
  markRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

interface Payload {
  notifications: AppNotification[];
  unreadCount: number;
}

const NotificationsContext = createContext<NotificationsApi | null>(null);
const POLL_MS = 25_000;

/**
 * In-app demo notifications. The list refreshes every ~25 seconds while the tab is visible
 * and whenever the window regains focus, so a status change made in another browser window
 * shows up without a manual reload.
 */
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const toast = useToast();
  const [data, setData] = useState<Payload>({ notifications: [], unreadCount: 0 });
  const [arrivals, setArrivals] = useState(0);
  const known = useRef<Set<number> | null>(null); // ids seen so far (null until the first load)

  const apply = useCallback(
    (payload: Payload) => {
      if (known.current) {
        const fresh = payload.notifications.filter((n) => !n.read && !known.current!.has(n.id));
        if (fresh.length) {
          setArrivals((a) => a + 1);
          toast.info(fresh.length === 1 ? fresh[0].title : `${fresh.length} new notifications`);
        }
      }
      known.current = new Set(payload.notifications.map((n) => n.id));
      setData(payload);
    },
    [toast],
  );

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      apply(await api<Payload>('/notifications'));
    } catch {
      /* the bell simply keeps its last state if the API is unreachable */
    }
  }, [user, apply]);

  useEffect(() => {
    known.current = null;
    setData({ notifications: [], unreadCount: 0 });
    if (!user) return;
    void refresh();
    const tick = () => document.visibilityState === 'visible' && void refresh();
    const timer = setInterval(tick, POLL_MS);
    window.addEventListener('focus', tick);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', tick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const markRead = useCallback(
    async (id: number) => {
      setData((d) => ({
        notifications: d.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        unreadCount: Math.max(0, d.unreadCount - (d.notifications.find((n) => n.id === id && !n.read) ? 1 : 0)),
      }));
      await api(`/notifications/${id}/read`, { method: 'PATCH' }).catch(() => undefined);
    },
    [],
  );

  const markAllRead = useCallback(async () => {
    setData((d) => ({ notifications: d.notifications.map((n) => ({ ...n, read: true })), unreadCount: 0 }));
    await api('/notifications/read-all', { method: 'PATCH' }).catch(() => undefined);
  }, []);

  const value = useMemo<NotificationsApi>(
    () => ({ ...data, arrivals, markRead, markAllRead, refresh }),
    [data, arrivals, markRead, markAllRead, refresh],
  );
  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications(): NotificationsApi {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used inside <NotificationsProvider>');
  return ctx;
}
