import { Clock3 } from 'lucide-react';
import AiChip from '../../components/ai/AiChip';
import { categoryNav } from '../../components/layout/categories';
import { formatPKR } from '../../lib/format';
import type { AiField, FormState, Photo } from './wizardModel';
import styles from './Wizard.module.css';

interface Props {
  form: FormState;
  photos: Photo[];
  coverKey: string | null;
  aiFields: Set<AiField>;
  confirmed: boolean;
  confirmError: boolean;
  editing: boolean;
  wasApproved: boolean;
  onConfirm: (v: boolean) => void;
  onEdit: (step: number) => void;
}

export default function ReviewStep({ form, photos, coverKey, aiFields, confirmed, confirmError, editing, wasApproved, onConfirm, onEdit }: Props) {
  const category = categoryNav.find((c) => c.slug === form.categorySlug)?.name;
  const specs = form.specs.filter((s) => s.label.trim() && s.value.trim());
  const usedAi = aiFields.size > 0;

  return (
    <div className={styles.stack}>
      <div className={styles.reviewGrid}>
        <section className={styles.reviewBlock} aria-labelledby="rv-photos">
          <div className={styles.reviewHead}><h3 id="rv-photos">Photos</h3><button type="button" className={styles.linkButton} onClick={() => onEdit(0)}>Edit</button></div>
          {photos.length ? (
            <div className={styles.thumbs}>{photos.map((p, i) => <img key={p.key} src={p.url} alt={`Photo ${i + 1}`} className={p.key === coverKey ? styles.isCover : ''} />)}</div>
          ) : (
            <p className={styles.reviewDesc}>No photos. A placeholder illustration will be shown. Listings with real photos get more requests.</p>
          )}
        </section>

        <section className={styles.reviewBlock} aria-labelledby="rv-details">
          <div className={styles.reviewHead}><h3 id="rv-details">Item details</h3><button type="button" className={styles.linkButton} onClick={() => onEdit(1)}>Edit</button></div>
          <dl className={styles.dl}>
            <div><dt>Title {aiFields.has('title') && <AiChip />}</dt><dd>{form.title.trim()}</dd></div>
            <div><dt>Category {aiFields.has('categorySlug') && <AiChip />}</dt><dd>{category}{form.subcategory.trim() ? ` · ${form.subcategory.trim()}` : ''}</dd></div>
            <div><dt>Condition</dt><dd>{form.condition}</dd></div>
            {specs.map((s) => <div key={s.label}><dt>{s.label.trim()}</dt><dd>{s.value.trim()}</dd></div>)}
            {form.tags.length > 0 && <div><dt>Tags {aiFields.has('tags') && <AiChip />}</dt><dd><span className={styles.chips}>{form.tags.map((t) => <span key={t} className={styles.chipSmall}>{t}</span>)}</span></dd></div>}
          </dl>
          <p className={styles.reviewDesc} style={{ marginTop: 14 }}>{form.description.trim()}</p>
        </section>

        <section className={styles.reviewBlock} aria-labelledby="rv-rental">
          <div className={styles.reviewHead}><h3 id="rv-rental">Rental terms</h3><button type="button" className={styles.linkButton} onClick={() => onEdit(2)}>Edit</button></div>
          <dl className={styles.dl}>
            <div><dt>Price</dt><dd>{formatPKR(Number(form.dailyPrice))} per day</dd></div>
            <div><dt>Refundable deposit (demo)</dt><dd>{formatPKR(Number(form.depositAmount))}</dd></div>
            <div><dt>Pickup area</dt><dd>{form.location.trim()}</dd></div>
            {form.availabilityNote.trim() && <div><dt>Availability</dt><dd>{form.availabilityNote.trim()}</dd></div>}
          </dl>
        </section>
      </div>

      {usedAi && <p className={styles.next}><Clock3 size={16} aria-hidden /> Some text was suggested by AI. You’re responsible for making sure it’s accurate.</p>}

      <label className={`${styles.confirmBox} ${confirmError ? styles.confirmBoxError : ''}`}>
        <input type="checkbox" checked={confirmed} onChange={(e) => onConfirm(e.target.checked)} aria-invalid={confirmError || undefined} aria-describedby={confirmError ? 'confirm-error' : undefined} />
        <span>I’ve checked these details are accurate, and I own this item or have permission to rent it out.</span>
      </label>
      {confirmError && <p id="confirm-error" className={styles.fieldError} role="alert">Please confirm before submitting.</p>}

      <p className={styles.next}>
        <Clock3 size={16} aria-hidden />
        <span>
          {editing
            ? wasApproved ? 'Your listing is live. In this demo, your changes show up straight away.' : 'Your changes are saved to the listing. It keeps its current review status.'
            : 'Your listing is sent to an admin for review. Once it’s approved it appears in search. Until then only you and admins can see it.'}
        </span>
      </p>
    </div>
  );
}
