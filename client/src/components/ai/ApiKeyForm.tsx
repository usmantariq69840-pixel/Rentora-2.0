import { Eye, EyeOff, ExternalLink, KeyRound, ShieldCheck } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { api, ApiError } from '../../lib/api';
import type { AiTestResult } from '../../types';
import Button from '../common/Button';
import { Input } from '../common/Input';
import styles from './ApiKeyForm.module.css';

interface Props {
  /** Called after the key is saved and checked with Gemini. `test.ok` tells whether Gemini accepted it. */
  onSaved: (test: AiTestResult) => void;
  submitLabel?: string;
  autoFocus?: boolean;
}

const KEY_FORMAT = /^[A-Za-z0-9_-]{20,200}$/;

/** Paste a Gemini API key, save it on the server, and check that it works. The key is never kept in the page afterwards. */
export default function ApiKeyForm({ onSaved, submitLabel = 'Save key', autoFocus }: Props) {
  const [value, setValue] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<'save' | 'check' | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const key = value.trim();
    if (!KEY_FORMAT.test(key)) {
      setError('That doesn’t look like a Gemini API key. A key is one long string of letters and numbers with no spaces.');
      return;
    }
    setError('');
    setBusy('save');
    try {
      await api('/settings/ai', { method: 'PUT', body: JSON.stringify({ apiKey: key }) });
      setValue(''); // the key now lives only on the server
      setBusy('check');
      const test = await api<AiTestResult>('/settings/ai/test', { method: 'POST' });
      onSaved(test);
    } catch (err) {
      setError(err instanceof ApiError ? (err.fields?.[0]?.message ?? err.message) : 'We couldn’t save the key. Check that the server is running and try again.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <Input
        label="Gemini API key"
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => { setValue(e.target.value); setError(''); }}
        placeholder="Paste your key here"
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        autoFocus={autoFocus}
        error={error}
        hint={error ? undefined : 'Starts with “AIza”. Nothing is saved until you press the button.'}
        trailing={
          <button type="button" className={styles.eye} onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide key' : 'Show key'} aria-pressed={show}>
            {show ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
          </button>
        }
      />
      <div className={styles.row}>
        <Button type="submit" loading={busy !== null} iconLeft={<KeyRound size={18} aria-hidden />}>
          {busy === 'save' ? 'Saving…' : busy === 'check' ? 'Checking with Gemini…' : submitLabel}
        </Button>
        <a className={styles.link} href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer">
          Get a free key <ExternalLink size={14} aria-hidden />
        </a>
      </div>
      <p className={styles.note}>
        <ShieldCheck size={16} aria-hidden />
        <span>The key is encrypted and stored on this computer by the Rentora server. It is never sent back to the browser, and you can replace or delete it any time in <strong>AI settings</strong>.</span>
      </p>
    </form>
  );
}
