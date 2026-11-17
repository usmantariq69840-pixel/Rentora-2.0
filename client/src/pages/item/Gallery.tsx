import { Heart, Share2 } from 'lucide-react';
import { useState } from 'react';
import ProductArt from '../../components/common/ProductArt';
import { useToast } from '../../components/common/Toast';
import { artFor } from '../../lib/art';
import { useSaved } from '../../lib/SavedContext';
import type { ListingDetail } from '../../types';
import styles from './Gallery.module.css';

export default function Gallery({ item }: { item: ListingDetail }) {
  const toast = useToast();
  const { isSaved, toggle } = useSaved();
  const [index, setIndex] = useState(0);
  const saved = isSaved(item.id);
  const current = item.images[index];

  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: item.title, url: window.location.href });
      else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard');
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') toast.error('Could not copy the link');
    }
  };

  return (
    <div className={styles.gallery}>
      <div className={styles.stage}>
        {current ? (
          <img key={current.id} src={current.url} alt={`${item.title} — photo ${index + 1} of ${item.images.length}`} className={styles.photo} />
        ) : (
          <div className={styles.placeholder}>
            <ProductArt kind={artFor(item.categorySlug, item.subcategory)} label={`${item.title} (illustration)`} className={styles.art} />
            <p>The owner hasn’t added photos yet — this is an illustration.</p>
          </div>
        )}

        <div className={styles.actions}>
          <button type="button" onClick={share} aria-label="Share this listing"><Share2 size={18} aria-hidden /></button>
          <button
            type="button"
            className={saved ? styles.saved : ''}
            onClick={() => toggle(item)}
            aria-pressed={saved}
            aria-label={saved ? 'Remove from saved' : 'Save this listing'}
          >
            <Heart size={18} fill={saved ? 'currentColor' : 'none'} aria-hidden />
          </button>
        </div>
      </div>

      {item.images.length > 1 && (
        <ul className={styles.thumbs} aria-label="Photo thumbnails">
          {item.images.map((img, i) => (
            <li key={img.id}>
              <button type="button" className={i === index ? styles.active : ''} onClick={() => setIndex(i)} aria-label={`Show photo ${i + 1}`} aria-current={i === index}>
                <img src={img.url} alt="" loading="lazy" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
