import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { AlertTriangle } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ButtonLink } from '../../components/common/Button';
import Reveal from '../../components/common/Reveal';
import SectionHeader from '../../components/common/SectionHeader';
import ListingCard from '../../components/listings/ListingCard';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import SkeletonCard from '../../components/common/SkeletonCard';
import { useApi } from '../../hooks/useApi';
import type { ItemsResponse } from '../../types';
import styles from './Home.module.css';

/** Snap-scrolling featured row with arrow controls (swipe on touch screens). */
export default function FeaturedSection() {
  const { data, error, loading, retry } = useApi<ItemsResponse>('/items?featured=1&limit=8');
  const listings = data?.items ?? [];
  const scroller = useRef<HTMLUListElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const updateArrows = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateArrows();
    window.addEventListener('resize', updateArrows);
    return () => window.removeEventListener('resize', updateArrows);
  }, [updateArrows, listings.length]);

  const scrollByCard = (direction: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    const card = el.querySelector('li');
    const step = (card?.getBoundingClientRect().width ?? 280) + 20;
    el.scrollBy({ left: direction * step * 2, behavior: 'smooth' });
  };

  return (
    <section className={`${styles.section} container`} aria-labelledby="featured-title">
      <Reveal>
        <SectionHeader
          id="featured-title"
          eyebrow="Featured"
          title="Featured rentals"
          subtitle="Popular gear from owners near you, ready to request."
          action={
            <div className={styles.featuredActions}>
              <div className={styles.arrows}>
                <button type="button" onClick={() => scrollByCard(-1)} disabled={!canPrev} aria-label="Previous listings">
                  <ChevronLeft size={20} aria-hidden />
                </button>
                <button type="button" onClick={() => scrollByCard(1)} disabled={!canNext} aria-label="Next listings">
                  <ChevronRight size={20} aria-hidden />
                </button>
              </div>
              <ButtonLink to="/browse" variant="outline" size="sm" iconRight={<ArrowRight size={16} aria-hidden />}>
                See all
              </ButtonLink>
            </div>
          }
        />
      </Reveal>

      {error ? (
        <EmptyState
          icon={<AlertTriangle size={28} aria-hidden />}
          title="Featured rentals didn’t load"
          description="Check that the API is running, then try again."
          action={<Button onClick={retry}>Try again</Button>}
        />
      ) : (
        <Reveal delay={120}>
          <ul ref={scroller} className={`${styles.featuredRow} hide-scrollbar`} onScroll={updateArrows} aria-busy={loading}>
            {loading && !data
              ? Array.from({ length: 4 }, (_, i) => <li key={i}><SkeletonCard /></li>)
              : listings.map((listing) => (
                  <li key={listing.id}>
                    <ListingCard listing={listing} />
                  </li>
                ))}
          </ul>
        </Reveal>
      )}
    </section>
  );
}
