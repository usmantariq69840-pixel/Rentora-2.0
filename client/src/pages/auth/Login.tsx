import { AlertCircle, Eye, EyeOff, Info, LogIn } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import Avatar from '../../components/common/Avatar';
import Button from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { useToast } from '../../components/common/Toast';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { ApiError } from '../../lib/api';
import { useAuth, type DemoAccount } from '../../lib/AuthContext';
import { safeNext } from '../../lib/format';
import AuthShell from './AuthShell';
import styles from './Auth.module.css';

const DEMOS: { account: DemoAccount; name: string; role: string; hint: string }[] = [
  { account: 'renter', name: 'Sara Malik', role: 'Continue as renter', hint: 'Has requests sent and saved items' },
  { account: 'owner', name: 'Ahmed Khan', role: 'Continue as owner', hint: 'Has listings and a request waiting' },
  { account: 'admin', name: 'Rentora Admin', role: 'Continue as admin', hint: 'Approves listings and manages the AI key' },
];

export default function Login() {
  useDocumentTitle('Sign in');
  const { user, login, demoLogin } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));
  const reason = (location.state as { reason?: string } | null)?.reason;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState<'form' | DemoAccount | null>(null);

  if (user && !busy) return <Navigate to={next} replace />;

  const fail = (err: unknown) => {
    if (err instanceof ApiError && err.fields?.length) {
      setErrors(Object.fromEntries(err.fields.map((f) => [f.path, f.message])));
    } else {
      setFormError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    const found: typeof errors = {};
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) found.email = 'Enter a valid email address, like name@example.com.';
    if (!password) found.password = 'Enter your password.';
    setErrors(found);
    if (Object.keys(found).length) return;

    setBusy('form');
    try {
      const signedIn = await login(email.trim(), password);
      toast.success(`Welcome back, ${signedIn.name.split(' ')[0]}`);
      navigate(next, { replace: true });
    } catch (err) {
      fail(err);
    } finally {
      setBusy(null);
    }
  };

  const quick = async (account: DemoAccount) => {
    setFormError('');
    setErrors({});
    setBusy(account);
    try {
      const signedIn = await demoLogin(account);
      toast.success(`Signed in as ${signedIn.name}`);
      navigate(next, { replace: true });
    } catch (err) {
      fail(err);
    } finally {
      setBusy(null);
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to manage your bookings, saved items and listings.">
      {reason && !formError && (
        <p className={styles.notice} role="status"><Info size={18} aria-hidden /> {reason}</p>
      )}

      <form className={styles.form} onSubmit={submit} noValidate>
        {formError && <p className={styles.formError} role="alert"><AlertCircle size={18} aria-hidden /> {formError}</p>}
        <Input
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
        <Input
          label="Password"
          type={show ? 'text' : 'password'}
          name="password"
          autoComplete="current-password"
          placeholder="Your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          trailing={
            <button type="button" className={styles.eye} onClick={() => setShow((s) => !s)} aria-pressed={show} aria-label={show ? 'Hide password' : 'Show password'}>
              {show ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
            </button>
          }
        />
        <Button type="submit" size="lg" fullWidth loading={busy === 'form'} disabled={busy !== null} iconLeft={<LogIn size={18} aria-hidden />}>
          Sign in
        </Button>
      </form>

      <p className={styles.switch}>
        New to Rentora? <Link to={`/register${next !== '/' ? `?next=${encodeURIComponent(next)}` : ''}`}>Create an account</Link>
      </p>

      <div className={styles.divider}>or try a demo account</div>
      <div className={styles.demos}>
        {DEMOS.map((d) => (
          <button key={d.account} type="button" className={styles.demo} onClick={() => quick(d.account)} disabled={busy !== null}>
            <Avatar name={d.name} size={38} />
            <span>
              <strong>{d.role}</strong>
              <small>{d.name} · {d.hint}</small>
            </span>
          </button>
        ))}
      </div>
      <p className={styles.demoNote}>Demo only. All seeded accounts use the password in the README.</p>
    </AuthShell>
  );
}
