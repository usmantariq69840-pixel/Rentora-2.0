import { AlertTriangle, CheckCircle2, Cpu, FileLock2, KeyRound, Lock, PlugZap, RefreshCw, ShieldAlert, Sparkles, Trash2, XCircle } from 'lucide-react';
import { useState } from 'react';
import ApiKeyForm from '../../components/ai/ApiKeyForm';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import Button from '../../components/common/Button';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../components/common/EmptyState';
import { Input } from '../../components/common/Input';
import Reveal from '../../components/common/Reveal';
import { useToast } from '../../components/common/Toast';
import { useApi } from '../../hooks/useApi';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useAi } from '../../lib/AiContext';
import { api, ApiError } from '../../lib/api';
import { keyRejected } from '../../lib/aiErrors';
import type { AiSettings as Settings, AiTestResult } from '../../types';
import styles from './AiSettings.module.css';

const savedOn = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

/** Admin page: save, test, replace and delete the Gemini API key without touching any file. */
export default function AiSettings() {
  useDocumentTitle('AI settings');
  const toast = useToast();
  const { refresh: refreshStatus } = useAi();
  const { data, error, loading, retry } = useApi<Settings>('/settings/ai');

  const [replacing, setReplacing] = useState(false);
  const [testing, setTesting] = useState(false);
  const [test, setTest] = useState<AiTestResult | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [model, setModel] = useState<string | null>(null);
  const [modelError, setModelError] = useState('');
  const [savingModel, setSavingModel] = useState(false);

  const reload = () => { retry(); void refreshStatus(); };

  const runTest = async () => {
    setTesting(true);
    setTest(null);
    try {
      setTest(await api<AiTestResult>('/settings/ai/test', { method: 'POST' }));
    } catch (err) {
      setTest({ ok: false, message: err instanceof Error ? err.message : 'The test could not run.' });
    } finally {
      setTesting(false);
    }
  };

  const onSaved = (result: AiTestResult) => {
    setReplacing(false);
    setTest(result);
    if (keyRejected(result)) toast.error('Key saved, but Gemini did not accept it.');
    else toast.success(result.ok ? 'Gemini key saved and working' : 'Key saved. We couldn’t reach Gemini to check it just now.');
    reload();
  };

  const remove = async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      await api('/settings/ai', { method: 'DELETE' });
      setConfirmDelete(false);
      setTest(null);
      setReplacing(false);
      toast.info('Saved key deleted');
      reload();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'We couldn’t delete the key. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const saveModel = async (value: string) => {
    setSavingModel(true);
    setModelError('');
    try {
      await api('/settings/ai', { method: 'PUT', body: JSON.stringify({ model: value }) });
      setModel(null);
      setTest(null);
      toast.success('Model updated');
      reload();
    } catch (err) {
      setModelError(err instanceof ApiError ? (err.fields?.[0]?.message ?? err.message) : 'We couldn’t save the model.');
    } finally {
      setSavingModel(false);
    }
  };

  const configured = !!data?.configured;
  const savedKey = data?.source === 'saved';
  const modelValue = model ?? data?.model ?? '';

  return (
    <div className={`${styles.page} container`}>
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'AI settings' }]} />
      <header className={styles.header}>
        <h1>AI settings</h1>
        <p>Connect Google’s Gemini to switch on the AI Listing Generator and the AI Rental Finder. You can save, replace or delete the key here at any time.</p>
      </header>

      <div className={styles.layout}>
        <div className={styles.main}>
          {error ? (
            <EmptyState icon={<AlertTriangle size={30} aria-hidden />} title="We couldn’t load the AI settings" description="Check that the API is running and that you are signed in as the administrator." action={<Button onClick={retry}>Try again</Button>} />
          ) : !data ? (
            <div className={styles.skeleton} aria-hidden="true" aria-busy={loading} />
          ) : (
            <>
              <Reveal>
                <section className={styles.card} aria-labelledby="key-title">
                  <div className={styles.cardHead}>
                    <h2 id="key-title"><KeyRound size={20} aria-hidden /> Gemini API key</h2>
                    <span className={`${styles.pill} ${configured ? styles.on : styles.off}`}>
                      {configured ? <CheckCircle2 size={14} aria-hidden /> : <XCircle size={14} aria-hidden />}
                      {configured ? 'Key in use' : 'No key yet'}
                    </span>
                  </div>

                  {data.savedKeyUnreadable && (
                    <p className={styles.warn} role="alert"><ShieldAlert size={18} aria-hidden /> The saved key can’t be read any more (the server’s SESSION_SECRET has changed). Save the key again below.</p>
                  )}

                  {configured && !replacing && (
                    <>
                      <div className={styles.keyBox}>
                        <div>
                          <span className={styles.keyLabel}>Current key</span>
                          <code className={styles.key}>{data.maskedKey}</code>
                        </div>
                        <p className={styles.source}>
                          {savedKey
                            ? <><Lock size={14} aria-hidden /> Saved on this computer, encrypted{data.updatedAt ? ` · ${savedOn(data.updatedAt)}` : ''}</>
                            : <><FileLock2 size={14} aria-hidden /> Read from <code>server/.env</code> (GEMINI_API_KEY)</>}
                        </p>
                      </div>

                      {test && (
                        <p className={`${styles.result} ${test.ok ? styles.good : styles.bad}`} role="status">
                          {test.ok ? <CheckCircle2 size={18} aria-hidden /> : <XCircle size={18} aria-hidden />}
                          <span>
                            {test.ok
                              ? <>Gemini answered with <strong>{test.model}</strong> in {Math.max(1, Math.round((test.latencyMs ?? 0) / 100) / 10)} s. The AI features are ready.</>
                              : test.message}
                          </span>
                        </p>
                      )}

                      <div className={styles.actions}>
                        <Button onClick={runTest} loading={testing} iconLeft={<PlugZap size={18} aria-hidden />}>{testing ? 'Testing…' : 'Test connection'}</Button>
                        <Button variant="outline" onClick={() => { setReplacing(true); setTest(null); }} iconLeft={<RefreshCw size={18} aria-hidden />}>Replace key</Button>
                        {savedKey && <Button variant="danger" onClick={() => { setDeleteError(''); setConfirmDelete(true); }} iconLeft={<Trash2 size={18} aria-hidden />}>Delete saved key</Button>}
                      </div>
                      {!savedKey && <p className={styles.muted}>This key comes from the <code>.env</code> file, so it can’t be deleted here. Save a different key and it will be used instead.</p>}
                      {savedKey && data.envKeyPresent && <p className={styles.muted}>If you delete the saved key, the key in <code>server/.env</code> is used instead.</p>}
                    </>
                  )}

                  {(!configured || replacing) && (
                    <div className={styles.formWrap}>
                      {!configured && <p className={styles.muted}>Paste a key to turn the AI features on. Without one, Rentora still works: listings are written by hand and the Finder uses a simple keyword search.</p>}
                      {test && keyRejected(test) && <p className={`${styles.result} ${styles.bad}`} role="alert"><XCircle size={18} aria-hidden /><span>{test.message}</span></p>}
                      <ApiKeyForm onSaved={onSaved} submitLabel={configured ? 'Save new key' : 'Save and test key'} />
                      {replacing && <Button variant="ghost" onClick={() => setReplacing(false)}>Cancel</Button>}
                    </div>
                  )}
                </section>
              </Reveal>

              <Reveal delay={80}>
                <section className={styles.card} aria-labelledby="model-title">
                  <div className={styles.cardHead}>
                    <h2 id="model-title"><Cpu size={20} aria-hidden /> Model</h2>
                  </div>
                  <p className={styles.muted}>The default always points to Google’s current Flash model, so you normally don’t need to change this. Use another name only if Google retires the default or you want to try a different model.</p>
                  <form className={styles.modelRow} onSubmit={(e) => { e.preventDefault(); void saveModel(modelValue.trim()); }}>
                    <Input label="Model name" value={modelValue} onChange={(e) => { setModel(e.target.value); setModelError(''); }} error={modelError} spellCheck={false} autoComplete="off" hint={modelError ? undefined : 'For example gemini-flash-latest'} />
                    <div className={styles.modelButtons}>
                      <Button type="submit" variant="outline" loading={savingModel} disabled={modelValue.trim() === data.model || !modelValue.trim()}>Save model</Button>
                      {data.model !== data.defaultModel && <Button variant="ghost" onClick={() => void saveModel(data.defaultModel)} disabled={savingModel}>Use default</Button>}
                    </div>
                  </form>
                </section>
              </Reveal>
            </>
          )}
        </div>

        <aside className={styles.side}>
          <Reveal delay={120}>
            <section className={styles.card} aria-labelledby="how-title">
              <h2 id="how-title"><Sparkles size={20} aria-hidden /> How Rentora uses AI</h2>
              <ul className={styles.list}>
                <li><strong>Listing Generator.</strong> Sends the one photo you choose and your notes. It drafts a title, description and tags that you edit. It never sets a price.</li>
                <li><strong>Rental Finder.</strong> Sends the sentence the renter typed and turns it into filters. Every result then comes from the Rentora database, never from the AI.</li>
                <li><strong>Nothing else is sent.</strong> No names, emails, bookings or account details.</li>
              </ul>
              <h3 className={styles.subhead}>Where the key lives</h3>
              <p className={styles.muted}>Only on the server. The browser never receives it, so it can’t appear in developer tools or in the website’s code.</p>
            </section>
          </Reveal>
        </aside>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete the saved Gemini key?"
        description="The AI features will switch off until a key is saved again. Listings and search keep working."
        confirmLabel="Delete key"
        tone="danger"
        loading={deleting}
        error={deleteError}
        onConfirm={remove}
        onClose={() => setConfirmDelete(false)}
      />
    </div>
  );
}
