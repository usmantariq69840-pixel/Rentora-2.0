import { AlertTriangle, ImageIcon, KeyRound, Loader2, RefreshCw, Sparkles, Undo2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Button from '../../components/common/Button';
import { TextArea } from '../../components/common/Input';
import { categoryNav } from '../../components/layout/categories';
import { useAi } from '../../lib/AiContext';
import { api } from '../../lib/api';
import { toAiProblem, type AiProblem } from '../../lib/aiErrors';
import type { ListingDraft } from '../../types';
import type { Photo } from './wizardModel';
import styles from './AiAssist.module.css';

export interface DraftPick { title: boolean; category: boolean; description: boolean; tags: boolean; details: boolean }

interface Props {
  photos: Photo[];
  coverKey: string | null;
  notes: string;
  onNotes: (value: string) => void;
  /** Copies the chosen suggestions into the form */
  onApply: (draft: ListingDraft, pick: DraftPick) => void;
  onUndo: () => void;
  canUndo: boolean;
}

type Phase =
  | { kind: 'idle' }
  | { kind: 'loading'; line: number }
  | { kind: 'error'; problem: AiProblem }
  | { kind: 'review'; draft: ListingDraft; usedImage: boolean; pick: DraftPick }
  | { kind: 'applied' };

const LINES = ['Looking at your photo…', 'Reading your notes…', 'Drafting a careful description…'];

/**
 * "Generate with AI": sends one photo and the owner's notes, then shows suggestions to accept or discard.
 * Nothing is written to the form until the owner presses "Use selected". A failure never touches the form.
 */
export default function AiAssist({ photos, coverKey, notes, onNotes, onApply, onUndo, canUndo }: Props) {
  const { status, requestSetup } = useAi();
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });
  const controller = useRef<AbortController | null>(null);

  // The AI looks at the cover photo if it is a new upload, otherwise the first new photo.
  const candidate = photos.find((p) => p.key === coverKey && p.file) ?? photos.find((p) => p.file);
  const loading = phase.kind === 'loading';

  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    if (!loading) return;
    const id = setInterval(() => setPhase((p) => (p.kind === 'loading' ? { kind: 'loading', line: Math.min(p.line + 1, LINES.length - 1) } : p)), 2200);
    return () => clearInterval(id);
  }, [loading]);

  const generate = async (alreadyAskedForKey = false): Promise<void> => {
    if (loading) return;
    if (!candidate && !notes.trim()) return;
    // No key yet: ask for one first. If it is saved, carry on straight away.
    if (status && !status.available && !alreadyAskedForKey) {
      if (!(await requestSetup())) return;
      return generate(true);
    }

    const ctl = new AbortController();
    controller.current = ctl;
    setPhase({ kind: 'loading', line: candidate ? 0 : 1 });
    const body = new FormData();
    if (candidate?.file) body.append('image', candidate.file);
    if (notes.trim()) body.append('notes', notes.trim());

    try {
      const res = await api<{ draft: ListingDraft; usedImage: boolean }>('/ai/listing-draft', { method: 'POST', body, signal: ctl.signal });
      if (ctl.signal.aborted) return;
      setPhase({
        kind: 'review',
        draft: res.draft,
        usedImage: res.usedImage,
        pick: { title: true, category: true, description: true, tags: res.draft.tags.length > 0, details: res.draft.attributes.length > 0 },
      });
    } catch (err) {
      if (ctl.signal.aborted || (err instanceof Error && err.name === 'AbortError')) return;
      const problem = toAiProblem(err);
      if (problem.code === 'not_configured' && !alreadyAskedForKey) {
        setPhase({ kind: 'idle' });
        if (await requestSetup()) return generate(true);
        setPhase({ kind: 'error', problem });
        return;
      }
      setPhase({ kind: 'error', problem });
    }
  };

  const cancel = () => {
    controller.current?.abort();
    setPhase({ kind: 'idle' });
  };

  const fixKey = async () => {
    if (await requestSetup()) void generate(true);
  };

  const apply = () => {
    if (phase.kind !== 'review') return;
    onApply(phase.draft, phase.pick);
    setPhase({ kind: 'applied' });
  };

  const hasInput = !!candidate || notes.trim().length > 0;

  return (
    <section className={styles.panel} aria-labelledby="ai-assist-title">
      <div className={styles.head}>
        <span className={styles.icon}><Sparkles size={20} aria-hidden /></span>
        <div>
          <h3 id="ai-assist-title">Write it with AI <span className={styles.optional}>optional</span></h3>
          <p>Add a photo and any facts you know. The AI drafts the title, description and tags. You review everything and set the price yourself.</p>
        </div>
      </div>

      <div className={styles.body}>
        <TextArea
          label="What do you know about the item?"
          value={notes}
          onChange={(e) => onNotes(e.target.value)}
          rows={3}
          maxLength={1000}
          disabled={loading}
          placeholder="Brand, model, condition, what’s included (for example “28-70mm lens, 2 batteries, charger”)"
          hint={`${notes.length}/1,000 · The AI won’t guess what you leave out. It will ask you to confirm instead.`}
        />

        <p className={styles.source}>
          <ImageIcon size={16} aria-hidden />
          {candidate
            ? <>The AI will look at your {candidate.key === coverKey ? 'cover ' : ''}photo. Only this photo and your notes are sent.</>
            : photos.length > 0
              ? 'Saved photos can’t be re-sent. Add a new photo, or the AI will use your notes only.'
              : 'No photo yet. Add one above, or the AI will use your notes only.'}
        </p>

        {phase.kind !== 'loading' && (
          <div className={styles.actions}>
            <Button onClick={() => void generate()} disabled={!hasInput} iconLeft={<Sparkles size={18} aria-hidden />}>
              {phase.kind === 'review' || phase.kind === 'applied' || phase.kind === 'error' ? 'Generate again' : 'Generate with AI'}
            </Button>
            {canUndo && phase.kind === 'applied' && <Button variant="outline" onClick={onUndo} iconLeft={<Undo2 size={16} aria-hidden />}>Undo AI changes</Button>}
          </div>
        )}

        {loading && (
          <div className={styles.loading} role="status">
            <Loader2 size={20} className={styles.spin} aria-hidden />
            <div>
              <p>{LINES[phase.line]}</p>
              <span className={styles.bar} aria-hidden />
            </div>
            <Button variant="ghost" size="sm" onClick={cancel} iconLeft={<X size={14} aria-hidden />}>Cancel</Button>
          </div>
        )}

        {phase.kind === 'error' && (
          <div className={styles.error} role="alert">
            <AlertTriangle size={20} aria-hidden />
            <div>
              <p><strong>The AI couldn’t finish.</strong> {phase.problem.message}</p>
              <p className={styles.safe}>Nothing you entered was changed. You can try again or fill in the details by hand.</p>
              <div className={styles.errorActions}>
                {phase.problem.needsKey && status?.canConfigure
                  ? <Button size="sm" onClick={() => void fixKey()} iconLeft={<KeyRound size={16} aria-hidden />}>{phase.problem.code === 'invalid_key' ? 'Fix API key' : 'Add API key'}</Button>
                  : <Button size="sm" variant="outline" onClick={() => void generate(true)} iconLeft={<RefreshCw size={16} aria-hidden />}>Try again</Button>}
              </div>
            </div>
          </div>
        )}

        {phase.kind === 'review' && (
          <Review phase={phase} onPick={(pick) => setPhase({ ...phase, pick })} onApply={apply} onDiscard={() => setPhase({ kind: 'idle' })} />
        )}

        {phase.kind === 'applied' && (
          <p className={styles.applied} role="status">
            <Sparkles size={16} aria-hidden /> Suggestions added. They’re marked “AI suggestion” in the next step. Please check each one before you submit.
          </p>
        )}
      </div>
    </section>
  );
}

function Review({ phase, onPick, onApply, onDiscard }: {
  phase: Extract<Phase, { kind: 'review' }>;
  onPick: (pick: DraftPick) => void;
  onApply: () => void;
  onDiscard: () => void;
}) {
  const { draft, pick } = phase;
  const category = categoryNav.find((c) => c.slug === draft.categorySlug)?.name ?? draft.categorySlug;
  const toggle = (key: keyof DraftPick) => onPick({ ...pick, [key]: !pick[key] });
  const none = !Object.values(pick).some(Boolean);

  const rows: { key: keyof DraftPick; label: string; show: boolean; content: React.ReactNode }[] = [
    { key: 'title', label: 'Title', show: true, content: draft.title },
    { key: 'category', label: 'Category', show: true, content: <>{category}{draft.subcategory ? ` · ${draft.subcategory}` : ''}</> },
    { key: 'description', label: 'Description', show: true, content: draft.description },
    { key: 'tags', label: 'Tags', show: draft.tags.length > 0, content: draft.tags.map((t) => <span key={t} className={styles.tag}>{t}</span>) },
    { key: 'details', label: 'Details seen or stated', show: draft.attributes.length > 0, content: draft.attributes.map((a) => `${a.label}: ${a.value}`).join(' · ') },
  ];

  return (
    <div className={styles.review}>
      <h4>Suggestions to review</h4>
      <p className={styles.reviewNote}>AI can be wrong. Tick what you want to use. You can edit everything afterwards, and you set the price.</p>
      <ul>
        {rows.filter((r) => r.show).map((r, i) => (
          <li key={r.key} style={{ animationDelay: `${i * 70}ms` }}>
            <label>
              <input type="checkbox" checked={pick[r.key]} onChange={() => toggle(r.key)} />
              <span className={styles.rowBody}>
                <span className={styles.rowLabel}>{r.label}</span>
                <span className={styles.rowText}>{r.content}</span>
              </span>
            </label>
          </li>
        ))}
      </ul>

      {draft.confirm.length > 0 && (
        <div className={styles.confirm}>
          <p>Please double-check</p>
          <ul>{draft.confirm.map((c) => <li key={c}>{c}</li>)}</ul>
        </div>
      )}

      <div className={styles.actions}>
        <Button onClick={onApply} disabled={none}>Use selected suggestions</Button>
        <Button variant="outline" onClick={onDiscard}>Discard</Button>
      </div>
    </div>
  );
}
