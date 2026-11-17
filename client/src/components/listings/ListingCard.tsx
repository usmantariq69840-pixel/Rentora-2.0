import { Heart, MapPin, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { artFor } from '../../lib/art';
import { formatPKR, formatRating } from '../../lib/format';
import { useSaved } from '../../lib/SavedContext';
import type { Listing } from '../../types';
import StatusBadge from '../common/StatusBadge';
import ListingImage from './ListingImage';
import styles from './ListingCard.module.css';

export default function ListingCard({ listing }: { listing: Listing }) {
  const { isSaved, toggle } = useSaved();
  const saved = isSaved(listing.id);
  return (
    <article className={styles.card}>
      <Link to={`/items/${listing.id}`} className={styles.link} aria-label={`${listing.title}, ${formatPKR(listing.dailyPrice)} per day`}>
        <div className={styles.media}>
          <div className={styles.zoom}>
            <ListingImage title={listing.title} imageUrl={listing.imageUrl} art={artFor(listing.categorySlug, listing.subcategory)} />
          </div>
          {listing.featured && (
            <span className={styles.featured}>
              <StatusBadge status="featured" />
            </span>
          )}
        </div>
        <div className={styles.body}>
          <h3 className={styles.title}>{listing.title}</h3>
          <p className={styles.meta}>
            {listing.rating !== null ? (
              <span className={styles.rating}>
                <Star size={14} fill="currentColor" aria-hidden />
                {formatRating(listing.rating)}
                <span className={styles.count}>({listing.reviewCount})</span>
              </span>
            ) : (
              <span className={styles.new}>New</span>
            )}
            <span className={styles.location}>
              <MapPin size={13} aria-hidden />
              {listing.location}
            </span>
          </p>
          <p className={styles.price}>
            <strong>{formatPKR(listing.dailyPrice)}</strong> <span>/ day</span>
          </p>
        </div>
      </Link>

      <button
        type="button"
        className={`${styles.heart} ${saved ? styles.saved : ''}`}
        onClick={() => toggle(listing)}
        aria-pressed={saved}
        aria-label={saved ? `Remove ${listing.title} from saved` : `Save ${listing.title}`}
      >
        <Heart size={18} fill={saved ? 'currentColor' : 'none'} aria-hidden />
      </button>
    </article>
  );
}
