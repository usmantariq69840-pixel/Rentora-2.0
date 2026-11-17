import { AlertCircle, CheckCircle2, Circle, Eye, EyeOff, UserPlus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import Button from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { useToast } from '../../components/common/Toast';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { ApiError } from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';
import { safeNext } from '../../lib/format';
import AuthShell from './AuthShell';
import styles from './Auth.module.css';

type Field = 'name' | 'email' | 'phone' | 'password';

export default function Register() {
  useDocumentTitle('Create account');
  const { user, register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));

  const [values, setValues] = useState({ name: '', email: '', phone: '', password: '' });
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user && !busy) return <Navigate to={next} replace />;

  const set = (field: Field) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    if (errors[field]) setErrors((er) => ({ ...er, [field]: undefined }));
  };

  const rules = [
    { ok: values.password.length >= 8, text: 'At least 8 characters' },
    { ok: /[A-Za-z]/.test(values.password), text: 'Contains a letter' },
    { ok: /[0-9]/.test(values.password), text: 'Contains a number' },
  ];

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    const found: typeof errors = {};
    if (values.name.trim().length < 2) found.name = 'Your name must have at least 2 characters.';
    if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) found.email = 'Enter a valid email address, like name@example.com.';
    if (values.phone.trim() && !/^\+?[0-9][0-9\s-]{6,17}$/.test(values.phone.trim())) found.phone = 'Enter a valid phone number, for example 0300 1234567.';
    if (rules.some((r) => !r.ok)) found.password = 'Choose a password that meets all three rules below.';
    setErrors(found);
    if (Object.keys(found).length) return;

    setBusy(true);
    try {
      const created = await register({ name: values.name.trim(), email: values.email.trim(), password: values.password, phone: values.phone.trim() });
      toast.success(`Welcome to Rentora, ${created.name.split(' ')[0]}!`);
      navigate(next, { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.fields?.length) {
        setErrors(Object.fromEntries(err.fields.map((f) => [f.path, f.message])));
      } else {
        setFormError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Create your account" subtitle="One account lets you rent items and list your own.">
      <form className={styles.form} onSubmit={submit} noValidate>
        {formError && <p className={styles.formError} role="alert"><AlertCircle size={18} aria-hidden /> {formError}</p>}
        <Input label="Full name" name="name" autoComplete="name" placeholder="Sara Malik" value={values.name} onChange={set('name')} error={errors.name} />
        <Input label="Email" type="email" name="email" autoComplete="email" inputMode="email" placeholder="you@example.com" value={values.email} onChange={set('email')} error={errors.email} />
        <Input label="Phone (optional)" type="tel" name="phone" autoComplete="tel" inputMode="tel" placeholder="0300 1234567" value={values.phone} onChange={set('phone')} error={errors.phone} hint="Only shown on your profile. Never verified in this demo." />
        <div>
          <Input
            label="Password"
            type={show ? 'text' : 'password'}
            name="password"
            autoComplete="new-password"
            placeholder="Create a password"
            value={values.password}
            onChange={set('password')}
            error={errors.password}
            trailing={
              <button type="button" className={styles.eye} onClick={() => setShow((s) => !s)} aria-pressed={show} aria-label={show ? 'Hide password' : 'Show password'}>
                {show ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
              </button>
            }
          />
          <ul className={styles.rules} style={{ marginTop: 10 }} aria-label="Password rules">
            {rules.map((r) => (
              <li key={r.text} className={r.ok ? styles.met : ''}>
                {r.ok ? <CheckCircle2 size={15} aria-hidden /> : <Circle size={15} aria-hidden />}
                {r.text}
                <span className="sr-only">{r.ok ? ' (done)' : ' (not yet)'}</span>
              </li>
            ))}
          </ul>
        </div>
        <Button type="submit" size="lg" fullWidth loading={busy} iconLeft={<UserPlus size={18} aria-hidden />}>
          Create account
        </Button>
        <p className={styles.fine}>Demo only. Please don’t reuse a real password, and no identity documents are ever requested.</p>
      </form>

      <p className={styles.switch}>
        Already have an account? <Link to={`/login${next !== '/' ? `?next=${encodeURIComponent(next)}` : ''}`}>Sign in</Link>
      </p>
    </AuthShell>
  );
}
