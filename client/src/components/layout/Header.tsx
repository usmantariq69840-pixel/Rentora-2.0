import { CalendarCheck, Heart, LayoutDashboard, LogOut, Menu, Plus, ShieldCheck, Sparkles, UserRound, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useScrolled } from '../../hooks/useScrolled';
import { useAuth } from '../../lib/AuthContext';
import Logo from '../common/Logo';
import { ButtonLink } from '../common/Button';
import SearchBar from '../common/SearchBar';
import { useToast } from '../common/Toast';
import AccountMenu from './AccountMenu';
import NotificationBell from './NotificationBell';
import CategoryNav from './CategoryNav';
import { categoryNav } from './categories';
import styles from './Header.module.css';

export default function Header() {
  const scrolled = useScrolled();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const toast = useToast();
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const [query, setQuery] = useState('');
  const urlQuery = pathname === '/browse' ? (params.get('q') ?? '') : '';
  useEffect(() => setQuery(urlQuery), [urlQuery]);
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the mobile menu whenever the page changes.
  useEffect(() => setMenuOpen(false), [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const signOut = async () => {
    setMenuOpen(false);
    await logout();
    toast.info('You’ve been signed out.');
    navigate('/');
  };

  const search = (value: string) => {
    setMenuOpen(false);
    navigate(value ? `/browse?q=${encodeURIComponent(value)}` : '/browse');
  };

  return (
    <header className={`${styles.header} ${scrolled || menuOpen ? styles.raised : ''}`}>
      <div className={`${styles.top} container`}>
        <Logo />

        <SearchBar
          value={query}
          onChange={setQuery}
          onSubmit={search}
          className={styles.search}
          placeholder="Search cameras, consoles, bikes…"
        />

        <nav className={styles.links} aria-label="Main">
          <NavLink to="/browse" className={({ isActive }) => `${styles.link} ${isActive ? styles.current : ''}`}>
            Browse
          </NavLink>
          <Link to="/#categories" className={styles.link}>
            Categories
          </Link>
          <Link to="/#how-it-works" className={styles.link}>
            How it works
          </Link>
        </nav>

        <div className={styles.actions}>
          <ButtonLink to="/list-item" size="sm" iconLeft={<Plus size={16} aria-hidden />} className={styles.listBtn}>
            List an item
          </ButtonLink>
          {user && <NotificationBell />}
          <Link to="/saved" className={styles.iconBtn} aria-label="Saved items">
            <Heart size={20} aria-hidden />
          </Link>
          {user ? (
            <div className={styles.account}>
              <AccountMenu />
            </div>
          ) : (
            <Link to="/login" className={styles.signIn}>
              Sign in
            </Link>
          )}
          <button
            type="button"
            className={`${styles.iconBtn} ${styles.burger}`}
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <X size={22} aria-hidden /> : <Menu size={22} aria-hidden />}
          </button>
        </div>
      </div>

      <div className={styles.categoryRow}>
        <CategoryNav />
      </div>

      {menuOpen && (
        <div id="mobile-menu" className={styles.mobile}>
          <div className="container">
            <SearchBar value={query} onChange={setQuery} onSubmit={search} placeholder="Search rentals…" />
            <ul className={styles.mobileList}>
              <li><Link to="/browse">Browse all rentals</Link></li>
              {categoryNav.map(({ slug, name, icon: Icon }) => (
                <li key={slug}>
                  <Link to={`/category/${slug}`}>
                    <Icon size={18} aria-hidden /> {name}
                  </Link>
                </li>
              ))}
              <li><Link to="/#how-it-works">How it works</Link></li>
              <li><Link to="/saved"><Heart size={18} aria-hidden /> Saved items</Link></li>
              {user && (
                <>
                  <li><Link to="/bookings"><CalendarCheck size={18} aria-hidden /> My bookings</Link></li>
                  <li><Link to="/dashboard"><LayoutDashboard size={18} aria-hidden /> Owner dashboard</Link></li>
                  <li><Link to="/profile"><UserRound size={18} aria-hidden /> Profile</Link></li>
                  {user.role === 'admin' && <li><Link to="/admin"><ShieldCheck size={18} aria-hidden /> Admin moderation</Link></li>}
                  {user.role === 'admin' && <li><Link to="/settings/ai"><Sparkles size={18} aria-hidden /> AI settings</Link></li>}
                </>
              )}
            </ul>
            <div className={styles.mobileCta}>
              <ButtonLink to="/list-item" fullWidth iconLeft={<Plus size={18} aria-hidden />}>
                List an item
              </ButtonLink>
              {user ? (
                <button type="button" className={styles.mobileSignOut} onClick={signOut}>
                  <LogOut size={18} aria-hidden /> Sign out ({user.name.split(' ')[0]})
                </button>
              ) : (
                <ButtonLink to="/login" variant="outline" fullWidth>
                  Sign in
                </ButtonLink>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
