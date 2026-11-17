import { AlertTriangle, ArrowLeft, ArrowRight, Info, Lightbulb, Send } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useBlocker, useNavigate, useParams } from 'react-router-dom';
import Breadcrumbs from '../components/common/Breadcrumbs';
import Button, { ButtonLink } from '../components/common/Button';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';
import AnimatedCheck from '../components/common/AnimatedCheck';
import { useToast } from '../components/common/Toast';
import { useApi } from '../hooks/useApi';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { api, ApiError } from '../lib/api';
import { useAuth } from '../lib/AuthContext';
import type { ListingDetail, ListingDraft } from '../types';
import AiAssist, { type DraftPick } from './listing/AiAssist';
import DetailsStep from './listing/DetailsStep';
import PhotoUploader from './listing/PhotoUploader';
import PreviewCard from './listing/PreviewCard';
import RentalStep from './listing/RentalStep';
import ReviewStep from './listing/ReviewStep';
import StepIndicator from './listing/StepIndicator';
import {
  EMPTY_FORM, STEPS, stepOfField, toPayload, validateDetails, validateRental,
  type AiField, type Condition, type FieldErrors, type FormState, type Photo,
} from './listing/wizardModel';
import styles from './listing/Wizard.module.css';

const HEADINGS = [
  { title: 'Add photos', text: 'Start with a clear photo of the item. You can let AI draft the details from it, or skip that and type them yourself.' },
  { title: 'Describe your item', text: 'Tell renters what it is, what’s included and what condition it’s in.' },
  { title: 'Set your rental terms', text: 'Choose your daily price, the refundable deposit and where renters can collect it.' },
  { title: 'Review and submit', text: 'Check everything one last time.' },
];

const TIPS = [
  'Use natural light and show the whole item. Add a second photo of anything that’s included, like the charger or lens.',
  'Be specific and honest. Say what’s included and mention any marks or wear. Clear listings get more requests.',
  'Check similar rentals in Browse before you pick a price. The deposit here is illustrative, because no money is collected in this demo.',
  'You can still go back and change anything. Nothing is saved until you submit.',
];

export default function ListingWizard() {
  const { id } = useParams<{ id: string }>();
  const editing = id !== undefined;
  const editId = id && /^\d+$/.test(id) ? Number(id) : null;
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  useDocumentTitle(editing ? 'Edit listing' : 'List an item');

  const existing = useApi<{ item: ListingDetail }>(editing && editId ? `/items/${editId}` : null);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [coverKey, setCoverKey] = useState<string | null>(null);
  const [originalPhotoIds, setOriginalPhotoIds] = useState<number[]>([]);
  const [step, setStep] = useState(0);
  const [reached, setReached] = useState(0);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [aiFields, setAiFields] = useState<Set<AiField>>(new Set());
  const [aiUndo, setAiUndo] = useState<{ before: Partial<FormState>; marks: Set<AiField> } | null>(null);
  const [notes, setNotes] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [confirmError, setConfirmError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [created, setCreated] = useState<number | null>(null);
  const [dirty, setDirty] = useState(false);
  const [wasApproved, setWasApproved] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const keyCounter = useRef(0);
  const initialised = useRef(false);
  const submitted = useRef(false);
  const photosRef = useRef<Photo[]>([]);
  photosRef.current = photos;

  // Free the preview URLs when leaving the page.
  useEffect(() => () => photosRef.current.forEach((p) => p.file && URL.revokeObjectURL(p.url)), []);

  // Edit mode: fill the form once with the saved listing.
  const item = existing.data?.item;
  useEffect(() => {
    if (!item || initialised.current || item.id !== editId) return;
    if (user && item.ownerId !== user.id) return;
    initialised.current = true;
    setForm({
      title: item.title,
      categorySlug: item.categorySlug,
      subcategory: item.subcategory ?? '',
      description: item.description,
      condition: item.condition as Condition,
      dailyPrice: String(item.dailyPrice),
      depositAmount: String(item.depositAmount),
      location: item.location,
      availabilityNote: item.availabilityNote ?? '',
      specs: item.specs.map((s) => ({ ...s })),
      tags: [...item.tags],
    });
    const saved = item.images.map((img) => ({ key: `e${img.id}`, url: img.url, existingId: img.id }));
    setPhotos(saved);
    setOriginalPhotoIds(item.images.map((i) => i.id));
    setCoverKey(item.images.find((i) => i.isCover)?.id ? `e${item.images.find((i) => i.isCover)!.id}` : (saved[0]?.key ?? null));
    setReached(STEPS.length - 1);
    setWasApproved(item.status === 'approved');
  }, [item, editId, user]);

  // ----- leaving with unsaved changes -----
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && !submitted.current && currentLocation.pathname !== nextLocation.pathname);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => { if (!submitted.current) e.preventDefault(); };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  // ----- form helpers -----
  const set = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
    setErrors((e) => Object.fromEntries(Object.entries(e).filter(([k]) => k !== key && !k.startsWith(`${key}.`))));
    // Editing a suggestion makes it the owner's own text, so the "AI suggestion" tag goes away.
    setAiFields((s) => {
      if (!s.has(key as AiField)) return s;
      const next = new Set(s);
      next.delete(key as AiField);
      return next;
    });
  }, []);

  const addPhotos = (files: File[]) => {
    const added: Photo[] = files.map((file) => ({ key: `n${++keyCounter.current}`, url: URL.createObjectURL(file), file }));
    setPhotos((p) => [...p, ...added]);
    setCoverKey((k) => k ?? added[0]?.key ?? null);
    setDirty(true);
  };

  const removePhoto = (key: string) => {
    const gone = photos.find((p) => p.key === key);
    if (gone?.file) URL.revokeObjectURL(gone.url);
    const rest = photos.filter((p) => p.key !== key);
    setPhotos(rest);
    if (coverKey === key) setCoverKey(rest[0]?.key ?? null);
    setDirty(true);
  };

  const applyDraft = (draft: ListingDraft, pick: DraftPick) => {
    const before: Partial<FormState> = {};
    const next: FormState = { ...form };
    const marks = new Set(aiFields);
    if (pick.title) { before.title = form.title; next.title = draft.title; marks.add('title'); }
    if (pick.category) {
      before.categorySlug = form.categorySlug; before.subcategory = form.subcategory;
      next.categorySlug = draft.categorySlug; next.subcategory = draft.subcategory ?? '';
      marks.add('categorySlug');
      if (draft.subcategory) marks.add('subcategory');
    }
    if (pick.description) { before.description = form.description; next.description = draft.description; marks.add('description'); }
    if (pick.tags) { before.tags = form.tags; next.tags = draft.tags; marks.add('tags'); }
    if (pick.details) { before.specs = form.specs; next.specs = draft.attributes.slice(0, 8); marks.add('specs'); }
    setAiUndo({ before, marks: new Set(aiFields) });
    setForm(next);
    setAiFields(marks);
    setErrors({});
    setDirty(true);
  };

  const undoAi = () => {
    if (!aiUndo) return;
    setForm((f) => ({ ...f, ...aiUndo.before }));
    setAiFields(aiUndo.marks);
    setAiUndo(null);
  };

  // ----- navigation -----
  const focusProblem = () => {
    requestAnimationFrame(() => {
      const el = cardRef.current?.querySelector<HTMLElement>('[aria-invalid="true"], [role="alert"]');
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el?.focus?.({ preventScroll: true });
    });
  };
  const toTop = () => requestAnimationFrame(() => cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));

  const goTo = (index: number) => {
    setStep(index);
    setReached((r) => Math.max(r, index));
    toTop();
  };

  const next = () => {
    const found = step === 1 ? validateDetails(form) : step === 2 ? validateRental(form) : {};
    setErrors(found);
    if (Object.keys(found).length) return focusProblem();
    goTo(step + 1);
  };

  const submit = async () => {
    const all = { ...validateDetails(form), ...validateRental(form) };
    if (Object.keys(all).length) {
      setErrors(all);
      goTo(Math.min(...Object.keys(all).map(stepOfField)));
      return focusProblem();
    }
    if (!confirmed) { setConfirmError(true); return; }

    setSubmitting(true);
    setSubmitError('');
    const fresh = photos.filter((p) => p.file);
    const cover = photos.find((p) => p.key === coverKey);
    const data = {
      ...toPayload(form),
      coverNewIndex: cover?.file ? fresh.indexOf(cover) : null,
      ...(editing ? {
        coverImageId: cover?.existingId ?? null,
        removeImageIds: originalPhotoIds.filter((pid) => !photos.some((p) => p.existingId === pid)),
      } : {}),
    };
    const body = new FormData();
    body.append('data', JSON.stringify(data));
    fresh.forEach((p) => body.append('images', p.file!));

    try {
      const res = await api<{ id: number }>(editing ? `/items/${editId}` : '/items', { method: editing ? 'PATCH' : 'POST', body });
      submitted.current = true; // lets the navigation below through without the "unsaved changes" prompt
      setDirty(false);
      if (editing) {
        toast.success('Listing updated');
        navigate(`/items/${editId}`);
      } else {
        setCreated(res.id);
        toTop();
      }
    } catch (err) {
      if (err instanceof ApiError && err.fields?.length) {
        const mapped = Object.fromEntries(err.fields.map((f) => [f.path, f.message]));
        setErrors(mapped);
        goTo(Math.min(...err.fields.map((f) => stepOfField(f.path))));
        focusProblem();
      } else {
        setSubmitError(err instanceof ApiError ? err.message : 'We couldn’t reach the server. Your details are still here. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ----- screens that replace the wizard -----
  if (editing && (!editId || (existing.error && 'status' in existing.error && [400, 404].includes(existing.error.status)))) {
    return (
      <div className="container" style={{ paddingBlock: 'var(--space-16)' }}>
        <EmptyState icon={<AlertTriangle size={30} aria-hidden />} title="This listing isn’t available" description="It may have been removed. Check your dashboard for your current listings." action={<ButtonLink to="/dashboard?tab=listings">My listings</ButtonLink>} />
      </div>
    );
  }
  if (editing && existing.error) {
    return (
      <div className="container" style={{ paddingBlock: 'var(--space-16)' }}>
        <EmptyState icon={<AlertTriangle size={30} aria-hidden />} title="We couldn’t load this listing" description="Check that the API is running, then try again." action={<Button onClick={existing.retry}>Try again</Button>} />
      </div>
    );
  }
  if (editing && item && user && item.ownerId !== user.id) {
    return (
      <div className="container" style={{ paddingBlock: 'var(--space-16)' }}>
        <EmptyState icon={<AlertTriangle size={30} aria-hidden />} title="You can only edit your own listings" description="This listing belongs to another owner." action={<ButtonLink to="/dashboard?tab=listings">My listings</ButtonLink>} />
      </div>
    );
  }
  if (editing && !initialised.current) {
    return <div className="container" style={{ paddingBlock: 'var(--space-16)' }} aria-busy="true"><p style={{ color: 'var(--text-secondary)' }}>Loading your listing…</p></div>;
  }

  if (created !== null) {
    return (
      <div className="container">
        <div className={styles.success} role="status">
          <AnimatedCheck size={84} />
          <h1>Submitted for review</h1>
          <p>Thanks, {user?.name.split(' ')[0]}. An admin will check your listing before it appears in search. Until then only you and admins can see it, and you’ll get a notification when it’s approved.</p>
          <div className={styles.successActions}>
            <ButtonLink to={`/items/${created}`}>View my listing</ButtonLink>
            <ButtonLink to="/dashboard?tab=listings" variant="outline">Go to My listings</ButtonLink>
          </div>
        </div>
      </div>
    );
  }

  const cover = photos.find((p) => p.key === coverKey);
  const heading = HEADINGS[step];
  const last = step === STEPS.length - 1;

  return (
    <div className={`${styles.page} container`}>
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Dashboard', to: '/dashboard?tab=listings' }, { label: editing ? 'Edit listing' : 'List an item' }]} />
      <header className={styles.header}>
        <h1>{editing ? 'Edit your listing' : 'List an item'}</h1>
        <p>{editing ? 'Change anything below, then save.' : 'Turn something you’re not using into income. It takes about five minutes.'}</p>
      </header>

      <StepIndicator current={step} reached={reached} onGo={goTo} />

      <div className={styles.layout}>
        <div ref={cardRef} className={styles.card}>
          {editing && wasApproved && step === 0 && (
            <p className={styles.banner}><Info size={18} aria-hidden /> This listing is live. In this demo, saved changes show up straight away.</p>
          )}
          <div className={styles.stepHead}>
            <h2>{heading.title}</h2>
            <p>{heading.text}</p>
          </div>

          <div key={step} className={styles.enter}>
            {step === 0 && (
              <div className={styles.stack}>
                <PhotoUploader photos={photos} coverKey={coverKey} onAdd={addPhotos} onRemove={removePhoto} onCover={(k) => { setCoverKey(k); setDirty(true); }} />
                <AiAssist photos={photos} coverKey={coverKey} notes={notes} onNotes={setNotes} onApply={applyDraft} onUndo={undoAi} canUndo={!!aiUndo} />
              </div>
            )}
            {step === 1 && <DetailsStep form={form} errors={errors} aiFields={aiFields} set={set} />}
            {step === 2 && <RentalStep form={form} errors={errors} set={set} />}
            {step === 3 && (
              <ReviewStep
                form={form} photos={photos} coverKey={coverKey} aiFields={aiFields}
                confirmed={confirmed} confirmError={confirmError} editing={editing} wasApproved={wasApproved}
                onConfirm={(v) => { setConfirmed(v); if (v) setConfirmError(false); }}
                onEdit={goTo}
              />
            )}
          </div>

          {submitError && <p className={styles.formError} role="alert"><AlertTriangle size={18} aria-hidden /> {submitError}</p>}

          <div className={styles.nav}>
            {step > 0 ? <Button variant="outline" onClick={() => goTo(step - 1)} iconLeft={<ArrowLeft size={18} aria-hidden />} disabled={submitting}>Back</Button> : <span />}
            <div className={styles.navRight}>
              {last ? (
                <Button onClick={() => void submit()} loading={submitting} iconLeft={<Send size={18} aria-hidden />}>{editing ? 'Save changes' : 'Submit for review'}</Button>
              ) : (
                <Button onClick={next} iconRight={<ArrowRight size={18} aria-hidden />}>{step === 0 && photos.length === 0 ? 'Skip photos for now' : 'Continue'}</Button>
              )}
            </div>
          </div>
        </div>

        <aside className={styles.side} aria-label="Preview and tips">
          <p className={styles.sideTitle}>Live preview</p>
          <PreviewCard form={form} cover={cover} />
          <div className={styles.tips}>
            <strong><Lightbulb size={14} aria-hidden style={{ display: 'inline', verticalAlign: '-2px' }} /> Tip</strong>
            {TIPS[step]}
          </div>
        </aside>
      </div>

      <ConfirmDialog
        open={blocker.state === 'blocked'}
        title="Leave without saving?"
        description="You have unsaved changes to this listing. If you leave now they will be lost."
        confirmLabel="Leave page"
        tone="danger"
        onConfirm={() => blocker.state === 'blocked' && blocker.proceed()}
        onClose={() => blocker.state === 'blocked' && blocker.reset()}
      />
    </div>
  );
}
