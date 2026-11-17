import { CalendarCheck, ChevronDown, Heart, LayoutDashboard, LogOut, ShieldCheck, Sparkles, UserRound } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import Avatar from '../common/Avatar';
import { useToast } from '../common/Toast';
import styles from './AccountMenu.module.css';

/** Avatar button with a dropdown of account links. Closes on outside click, Esc and navigation. */
export default function AccountMenu() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

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

  if (!user) return null;

  const signOut = async () => {
    setOpen(false);
    await logout();
    toast.info('You’ve been signed out.');
    navigate('/');
  };

  return (
    <div className={styles.root} ref={root}>
      <button
        type="button"
        className={`${styles.trigger} ${open ? styles.open : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls="account-menu"
        aria-label={`Account menu for ${user.name}`}
      >
        <Avatar name={user.name} size={34} />
        <ChevronDown size={16} aria-hidden className={styles.chevron} />
      </button>

      {open && (
        <div id="account-menu" className={styles.menu}>
          <div className={styles.who}>
            <Avatar name={user.name} size={44} />
            <div>
              <strong>{user.name}</strong>
              <span>{user.email}</span>
            </div>
          </div>
          <nav aria-label="Account" onClick={() => setOpen(false)}>
            <Link to="/bookings"><CalendarCheck size={18} aria-hidden /> My bookings</Link>
            <Link to="/dashboard"><LayoutDashboard size={18} aria-hidden /> Owner dashboard</Link>
            <Link to="/saved"><Heart size={18} aria-hidden /> Saved items</Link>
            <Link to="/profile"><UserRound size={18} aria-hidden /> Profile</Link>
            {user.role === 'admin' && <Link to="/admin"><ShieldCheck size={18} aria-hidden /> Admin moderation</Link>}
            {user.role === 'admin' && <Link to="/settings/ai"><Sparkles size={18} aria-hidden /> AI settings</Link>}
          </nav>
          <button type="button" className={styles.signOut} onClick={signOut}>
            <LogOut size={18} aria-hidden /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
