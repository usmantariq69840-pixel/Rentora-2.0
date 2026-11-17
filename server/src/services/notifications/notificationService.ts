import { db } from '../../database/connection.js';

export function createNotification(userId: number, title: string, body: string, link: string | null = null) {
  db.prepare('INSERT INTO notifications (user_id, title, body, link, created_at) VALUES (?, ?, ?, ?, ?)').run(
    userId,
    title,
    body,
    link,
    new Date().toISOString(),
  );
}

interface NotificationRow {
  id: number;
  title: string;
  body: string;
  is_read: number;
  link: string | null;
  created_at: string;
}

export function listNotifications(userId: number, limit = 30) {
  const rows = db
    .prepare('SELECT id, title, body, is_read, link, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT ?')
    .all(userId, limit) as NotificationRow[];
  const unread = db.prepare('SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND is_read = 0').get(userId) as { n: number };
  return {
    notifications: rows.map((r) => ({ id: r.id, title: r.title, body: r.body, read: !!r.is_read, link: r.link, createdAt: r.created_at })),
    unreadCount: unread.n,
  };
}

/** Returns false when the notification does not exist or belongs to someone else. */
export function markRead(userId: number, id: number): boolean {
  return db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(id, userId).changes > 0;
}

export function markAllRead(userId: number) {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0').run(userId);
}
