import { AlertTriangle, MapPin, SearchX, ShieldCheck, Star } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import Breadcrumbs from '../components/common/Breadcrumbs';
import Button, { ButtonLink } from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import Reveal from '../components/common/Reveal';
import StatusBadge from '../components/common/StatusBadge';
import ListingCard from '../components/listings/ListingCard';
import { useApi } from '../hooks/useApi';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { formatPKR, formatRating } from '../lib/format';
import type { ItemsResponse, ListingDetail } from '../types';
import BookingPanel from './item/BookingPanel';
import ReviewBanner from './item/ReviewBanner';
import Gallery from './item/Gallery';
import OwnerCard from './item/OwnerCard';
import ReportListing from './item/ReportListing';
import Reviews from './item/Reviews';
import styles from './ItemDetail.module.css';

function DetailSkeleton() {
  return (
    <div className={`${styles.page} container`} aria-hidden="true">
      <div className={styles.layout}>
        <div className={styles.main}>
          <div className={`${styles.sk} ${styles.skStage}`} />
          <div className={`${styles.sk} ${styles.skLine}`} style={{ width: '70%', height: 34 }} />
          <div className={`${styles.sk} ${styles.skLine}`} style={{ width: '40%' }} />
          <div className={`${styles.sk} ${styles.skLine}`} />
          <div className={`${styles.sk} ${styles.skLine}`} style={{ width: '90%' }} />
        </div>
        <div className={`${styles.sk} ${styles.skPanel}`} />
      </div>
    </div>
  );
}

export default function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const valid = !!id && /^\d+$/.test(id);
  const { data, error, retry } = useApi<{ item: ListingDetail }>(valid ? `/items/${id}` : null);
  const item = data?.item;
  const { data: similar } = useApi<ItemsResponse>(item ? `/items?category=${item.categorySlug}&exclude=${item.id}&limit=4` : null);
  useDocumentTitle(item?.title);

  if (!valid || (error && 'status' in error && (error.status === 404 || error.status === 400))) {
    return (
      <div className="container" style={{ paddingBlock: 'var(--space-16)' }}>
        <EmptyState
          icon={<SearchX size={30} aria-hidden />}
          title="This listing isn’t available"
          description="It may have been removed or is still waiting for approval. Browse other rentals instead."
          action={<ButtonLink to="/browse">Browse rentals</ButtonLink>}
        />
      </div>
    );
  }
  if (error) {
    return (
      <div className="container" style={{ paddingBlock: 'var(--space-16)' }}>
        <EmptyState
          icon={<AlertTriangle size={30} aria-hidden />}
          title="We couldn’t load this listing"
          description="Check that the API is running, then try again."
          action={<Button onClick={retry}>Try again</Button>}
        />
      </div>
    );
  }
  // Show the skeleton only when we have nothing for THIS listing yet. A background refresh keeps the page (and any open dialog).
  if (!item || item.id !== Number(id)) return <DetailSkeleton />;

  return (
    <div className={`${styles.page} container`}>
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: item.categoryName, to: `/category/${item.categorySlug}` }, { label: item.title }]} />
      <ReviewBanner item={item} onChanged={retry} />

      <div className={styles.layout}>
        <div className={styles.main}>
          <Gallery key={item.id} item={item} />

          <header className={styles.header}>
            <div className={styles.badges}>
              {item.featured && <StatusBadge status="featured" />}
              {item.status === 'pending' && <StatusBadge status="pending" label="Awaiting approval" />}
              <span className={styles.condition}>Condition: {item.condition}</span>
            </div>
            <h1>{item.title}</h1>
            <p className={styles.meta}>
              {item.rating !== null ? (
                <a href="#reviews" className={styles.rating}>
                  <Star size={16} fill="currentColor" aria-hidden /> {formatRating(item.rating)} <span>({item.reviewCount} reviews)</span>
                </a>
              ) : (
                <span className={styles.newTag}>New listing</span>
              )}
              <span className={styles.loc}><MapPin size={15} aria-hidden /> {item.location}</span>
            </p>
            <p className={styles.mobilePrice}><strong>{formatPKR(item.dailyPrice)}</strong> / day</p>
          </header>

          <Reveal><section className={styles.section}>
            <h2>About this item</h2>
            <p className={styles.description}>{item.description}</p>
            {item.tags.length > 0 && (
              <ul className={styles.tags} aria-label="Tags">
                {item.tags.map((t) => <li key={t}>{t}</li>)}
              </ul>
            )}
          </section></Reveal>

          <Reveal><section className={styles.section}>
            <h2>Details</h2>
            <dl className={styles.specs}>
              <div><dt>Daily rate</dt><dd>{formatPKR(item.dailyPrice)}</dd></div>
              <div><dt>Refundable deposit (demo)</dt><dd>{formatPKR(item.depositAmount)}</dd></div>
              <div><dt>Condition</dt><dd>{item.condition}</dd></div>
              <div><dt>Pickup area</dt><dd>{item.location}</dd></div>
              {item.specs.map((s) => <div key={s.label}><dt>{s.label}</dt><dd>{s.value}</dd></div>)}
              {item.availabilityNote && <div className={styles.wide}><dt>Owner’s availability note</dt><dd>{item.availabilityNote}</dd></div>}
            </dl>
            <p className={styles.avail}>
              <ShieldCheck size={16} aria-hidden />
              Availability is shown from approved bookings only. The owner confirms every request.
            </p>
          </section></Reveal>

          <Reveal><section className={styles.section}>
            <h2>Meet the owner</h2>
            <OwnerCard owner={item.owner} />
          </section></Reveal>

          <Reveal><section id="reviews" className={styles.section}>
            <h2>Reviews</h2>
            <Reviews item={item} />
          </section></Reveal>

          <ReportListing item={item} />
        </div>

        <div className={styles.side}><BookingPanel key={item.id} item={item} onRefresh={retry} /></div>
      </div>

      {similar && similar.items.length > 0 && (
        <section className={styles.similar} aria-labelledby="similar-title">
          <Reveal><h2 id="similar-title">More in {item.categoryName}</h2></Reveal>
          <div className={styles.similarGrid}>
            {similar.items.map((l, i) => <Reveal key={l.id} delay={i * 80}><ListingCard listing={l} /></Reveal>)}
          </div>
          <p className={styles.seeAll}><Link to={`/category/${item.categorySlug}`}>See all {item.categoryName}</Link></p>
        </section>
      )}

      {/* Small screens: the booking panel is below the details, so keep a quick action in reach */}
      <div className={styles.bar}>
        <p><strong>{formatPKR(item.dailyPrice)}</strong> <span>/ day</span></p>
        <Button onClick={() => document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' })}>Check dates</Button>
      </div>
    </div>
  );
}
