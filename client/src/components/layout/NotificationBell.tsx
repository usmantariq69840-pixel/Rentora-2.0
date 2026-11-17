import { Bell, BellOff, CheckCheck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { timeAgo } from '../../lib/format';
import { useNotifications } from '../../lib/NotificationsContext';
import styles from './NotificationBell.module.css';

/** Bell with an unread badge and a dropdown list. Rings when something new arrives. */
export default function NotificationBell() {
  const { notifications, unreadCount, arrivals, markRead, markAllRead } = useNotifications();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const openItem = (id: number, link: string | null, read: boolean) => {
    if (!read) void markRead(id);
    setOpen(false);
    if (link) navigate(link);
  };

  return (
    <div className={styles.root} ref={root}>
      <button
        type="button"
        className={styles.bell}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="notifications-panel"
        aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'}
      >
        {/* key restarts the ring animation each time something new arrives */}
        <Bell key={arrivals} size={20} aria-hidden className={arrivals ? styles.ring : undefined} />
        {unreadCount > 0 && <span className={styles.badge} aria-hidden="true">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {open && (
        <div id="notifications-panel" className={styles.panel} role="region" aria-label="Notifications">
          <div className={styles.head}>
            <h2>Notifications</h2>
            <button type="button" onClick={() => void markAllRead()} disabled={unreadCount === 0}>
              <CheckCheck size={15} aria-hidden /> Mark all read
            </button>
          </div>
          {notifications.length === 0 ? (
            <div className={styles.empty}>
              <BellOff size={26} aria-hidden />
              <p>You’re all caught up.</p>
            </div>
          ) : (
            <ul className={styles.list}>
              {notifications.map((n, i) => (
                <li key={n.id} style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}>
                  <button type="button" className={`${styles.item} ${n.read ? '' : styles.unread}`} onClick={() => openItem(n.id, n.link, n.read)}>
                    <span className={styles.dot} aria-hidden="true" />
                    <span className={styles.text}>
                      <strong>{n.title}{!n.read && <span className="sr-only"> (unread)</span>}</strong>
                      <span className={styles.body}>{n.body}</span>
                      <time dateTime={n.createdAt}>{timeAgo(n.createdAt)}</time>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
