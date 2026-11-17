import { MapPin } from 'lucide-react';
import ListingImage from '../../components/listings/ListingImage';
import { artFor } from '../../lib/art';
import { formatPKR } from '../../lib/format';
import type { FormState, Photo } from './wizardModel';
import { categoryNav } from '../../components/layout/categories';
import styles from './Wizard.module.css';

/** How the listing card will look in search. Updates as the owner types. */
export default function PreviewCard({ form, cover }: { form: FormState; cover?: Photo }) {
  const category = categoryNav.find((c) => c.slug === form.categorySlug);
  const price = Number(form.dailyPrice);
  return (
    <div className={styles.preview} aria-label="Live preview of your listing card">
      <div className={styles.previewMedia}>
        <ListingImage
          title={form.title || 'Your item'}
          imageUrl={cover?.url}
          art={artFor(form.categorySlug || 'electronics-equipment', form.subcategory || null)}
        />
        <span className={styles.previewBadge}>Preview</span>
      </div>
      <div className={styles.previewBody}>
        <h3>{form.title.trim() || 'Your title appears here'}</h3>
        <p className={styles.previewMeta}>
          <span className={styles.newTag}>New</span>
          <span><MapPin size={13} aria-hidden /> {form.location.trim() || 'Pickup area'}</span>
        </p>
        <p className={styles.previewPrice}>
          <strong>{price >= 50 ? formatPKR(price) : 'Rs. —'}</strong> <span>/ day</span>
        </p>
        <p className={styles.previewCat}>{category?.name ?? 'Category not chosen'}{form.condition ? ` · ${form.condition}` : ''}</p>
      </div>
    </div>
  );
}
