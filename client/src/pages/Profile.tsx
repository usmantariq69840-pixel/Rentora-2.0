import { CalendarCheck, Heart, LayoutDashboard, LogOut, Save, ShieldCheck, Package } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Avatar from '../components/common/Avatar';
import Button from '../components/common/Button';
import { Input } from '../components/common/Input';
import Reveal from '../components/common/Reveal';
import StatusBadge from '../components/common/StatusBadge';
import { useToast } from '../components/common/Toast';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { ApiError } from '../lib/api';
import { useAuth } from '../lib/AuthContext';
import { formatCount } from '../lib/format';
import { useSaved } from '../lib/SavedContext';
import styles from './Profile.module.css';

export default function Profile() {
  useDocumentTitle('Profile');
  const { user, updateProfile, logout } = useAuth();
  const { count: savedCount } = useSaved();
  const toast = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [busy, setBusy] = useState(false);

  if (!user) return null; // RequireAuth guarantees a user; this only satisfies the type checker

  const dirty = name.trim() !== user.name || phone.trim() !== (user.phone ?? '');
  const memberSince = new Date(user.createdAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const found: typeof errors = {};
    if (name.trim().length < 2) found.name = 'Your name must have at least 2 characters.';
    if (phone.trim() && !/^\+?[0-9][0-9\s-]{6,17}$/.test(phone.trim())) found.phone = 'Enter a valid phone number, for example 0300 1234567.';
    setErrors(found);
    if (Object.keys(found).length) return;

    setBusy(true);
    try {
      const updated = await updateProfile({ name: name.trim(), phone: phone.trim() });
      setName(updated.name);
      setPhone(updated.phone ?? '');
      toast.success('Profile updated');
    } catch (err) {
      if (err instanceof ApiError && err.fields?.length) setErrors(Object.fromEntries(err.fields.map((f) => [f.path, f.message])));
      else toast.error(err instanceof Error ? err.message : 'We couldn’t save your profile. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    await logout();
    toast.info('You’ve been signed out.');
    navigate('/');
  };

  const shortcuts = [
    { to: '/saved', icon: Heart, title: 'Saved items', text: savedCount ? formatCount(savedCount, 'item') : 'Nothing saved yet' },
    { to: '/bookings', icon: CalendarCheck, title: 'My bookings', text: 'Requests sent and received' },
    { to: '/dashboard?tab=listings', icon: Package, title: 'My listings', text: 'Manage what you rent out' },
    { to: '/dashboard', icon: LayoutDashboard, title: 'Owner dashboard', text: 'Requests and demo earnings' },
  ];

  return (
    <div className={`${styles.page} container`}>
      <Reveal>
        <section className={styles.hero}>
          <Avatar name={user.name} size={84} />
          <div>
            <h1>{user.name}</h1>
            <p>{user.email} · Member since {memberSince}</p>
            <div className={styles.badges}>
              <StatusBadge status={user.emailVerifiedDemo ? 'verified' : 'unverified'} label={user.emailVerifiedDemo ? 'Email verified (demo)' : 'Email not verified (demo)'} />
              <StatusBadge status={user.phoneVerifiedDemo ? 'verified' : 'unverified'} label={user.phoneVerifiedDemo ? 'Phone verified (demo)' : 'Phone not verified (demo)'} />
              {user.role === 'admin' && <StatusBadge status="featured" label="Demo administrator" />}
            </div>
          </div>
        </section>
      </Reveal>

      <div className={styles.shortcuts}>
        {shortcuts.map(({ to, icon: Icon, title, text }, i) => (
          <Reveal key={title} delay={i * 70}>
            <Link to={to} className={styles.shortcut}>
              <span><Icon size={22} aria-hidden /></span>
              <strong>{title}</strong>
              <small>{text}</small>
            </Link>
          </Reveal>
        ))}
      </div>

      <div className={styles.columns}>
        <Reveal>
          <form className={styles.card} onSubmit={save} noValidate>
            <h2>Your details</h2>
            <p className={styles.lead}>This is what other people see when you send or receive a request.</p>
            <div className={styles.fields}>
              <Input label="Full name" name="name" autoComplete="name" value={name} onChange={(e) => { setName(e.target.value); setErrors((er) => ({ ...er, name: undefined })); }} error={errors.name} />
              <Input label="Email" type="email" value={user.email} readOnly disabled hint="Email can’t be changed in this demo." />
              <Input label="Phone (optional)" type="tel" name="phone" autoComplete="tel" inputMode="tel" placeholder="0300 1234567" value={phone} onChange={(e) => { setPhone(e.target.value); setErrors((er) => ({ ...er, phone: undefined })); }} error={errors.phone} />
            </div>
            <div className={styles.actions}>
              <Button type="submit" loading={busy} disabled={!dirty} iconLeft={<Save size={18} aria-hidden />}>Save changes</Button>
              {dirty && !busy && <button type="button" className={styles.reset} onClick={() => { setName(user.name); setPhone(user.phone ?? ''); setErrors({}); }}>Discard</button>}
            </div>
          </form>
        </Reveal>

        <Reveal delay={90}>
          <section className={styles.card}>
            <h2>Account &amp; settings</h2>
            <p className={styles.lead}>
              <ShieldCheck size={16} aria-hidden /> Rentora is a local demo. Verification labels are simulated, and no identity documents, cards or bank details are ever collected.
            </p>
            <ul className={styles.facts}>
              <li><span>Account type</span><strong>{user.role === 'admin' ? 'Demo administrator' : 'Renter and owner'}</strong></li>
              <li><span>Currency</span><strong>Pakistani rupee (PKR)</strong></li>
              <li><span>Data</span><strong>Stored locally in SQLite</strong></li>
            </ul>
            <Button variant="outline" onClick={signOut} iconLeft={<LogOut size={18} aria-hidden />}>Sign out</Button>
          </section>
        </Reveal>
      </div>
    </div>
  );
}
