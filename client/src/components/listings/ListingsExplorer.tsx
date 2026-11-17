import { AlertTriangle, ChevronDown, SearchX, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { useListings } from '../../hooks/useListings';
import { formatShort } from '../../lib/dates';
import { formatCount, formatPKR } from '../../lib/format';
import type { Category, CategorySlug, Filters, SortKey, Subcategory } from '../../types';
import Button from '../common/Button';
import EmptyState from '../common/EmptyState';
import Modal from '../common/Modal';
import { SkeletonGrid } from '../common/SkeletonCard';
import FilterPanel, { FilterSheetFooter } from './FilterPanel';
import ListingCard from './ListingCard';
import styles from './ListingsExplorer.module.css';

const SORTS: { value: SortKey; label: string }[] = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'rating', label: 'Top rated' },
];
const SLUGS: CategorySlug[] = [
  'cameras-photography',
  'gaming-consoles',
  'bikes-cycles',
  'electronics-equipment',
  'furniture-appliances',
  'watches-accessories',
  'vehicles',
];

interface Props {
  /** When set, results are limited to this category and the category filter is hidden */
  lockedCategory?: CategorySlug;
  subcategories?: Subcategory[];
  /** Page heading area rendered above the toolbar */
  header: ReactNode;
}

/** Search results with URL-driven filters, sorting, "load more" and every loading/empty/error state. */
export default function ListingsExplorer({ lockedCategory, subcategories, header }: Props) {
  const [params, setParams] = useSearchParams();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [panelKey, setPanelKey] = useState(0); // remounts the filter panel after external changes
  const { data: categoryData } = useApi<{ categories: Category[] }>('/categories');
  const categories = categoryData?.categories ?? [];

  const numeric = (v: string | null) => (v && /^\d+$/.test(v) ? v : '');
  const rawCategory = params.get('category') as CategorySlug | null;
  const filters: Filters = {
    q: params.get('q') ?? '',
    category: lockedCategory ?? (rawCategory && SLUGS.includes(rawCategory) ? rawCategory : ''),
    subcategory: params.get('subcategory') ?? '',
    minPrice: numeric(params.get('minPrice')),
    maxPrice: numeric(params.get('maxPrice')),
    sort: SORTS.some((s) => s.value === params.get('sort')) ? (params.get('sort') as SortKey) : 'recommended',
    from: params.get('from') ?? '',
    to: params.get('to') ?? '',
  };

  const update = (patch: Partial<Filters>) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([key, value]) => {
      if (!value || (key === 'sort' && value === 'recommended')) next.delete(key);
      else next.set(key, String(value));
    });
    setParams(next, { replace: true });
  };

  const queryString = useMemo(() => {
    const qs = new URLSearchParams();
    if (filters.q) qs.set('q', filters.q);
    if (filters.category) qs.set('category', filters.category);
    if (filters.subcategory) qs.set('subcategory', filters.subcategory);
    if (filters.minPrice) qs.set('minPrice', filters.minPrice);
    if (filters.maxPrice) qs.set('maxPrice', filters.maxPrice);
    if (filters.from && filters.to) { qs.set('from', filters.from); qs.set('to', filters.to); }
    qs.set('sort', filters.sort);
    return qs.toString();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, lockedCategory]);

  const { items, total, status, loadingMore, hasMore, loadMore, retry } = useListings(queryString);

  // ----- active filter chips -----
  const chips: { key: string; label: string; clear: Partial<Filters> }[] = [];
  if (filters.q) chips.push({ key: 'q', label: `“${filters.q}”`, clear: { q: '' } });
  if (!lockedCategory && filters.category) {
    chips.push({ key: 'cat', label: categories.find((c) => c.slug === filters.category)?.name ?? 'Category', clear: { category: '' } });
  }
  if (filters.subcategory) chips.push({ key: 'sub', label: filters.subcategory, clear: { subcategory: '' } });
  if (filters.minPrice || filters.maxPrice) {
    const label = filters.minPrice && filters.maxPrice ? `${formatPKR(+filters.minPrice)} – ${formatPKR(+filters.maxPrice)}`
      : filters.maxPrice ? `Up to ${formatPKR(+filters.maxPrice)}` : `From ${formatPKR(+filters.minPrice)}`;
    chips.push({ key: 'price', label: `${label} / day`, clear: { minPrice: '', maxPrice: '' } });
  }
  if (filters.from && filters.to) {
    chips.push({ key: 'dates', label: filters.from === filters.to ? formatShort(filters.from) : `${formatShort(filters.from)} – ${formatShort(filters.to)}`, clear: { from: '', to: '' } });
  }
  const filterCount = chips.filter((c) => c.key !== 'q' && c.key !== 'sub').length;

  const clearChip = (patch: Partial<Filters>) => { update(patch); setPanelKey((k) => k + 1); };
  const clearAll = () => {
    setParams(new URLSearchParams(), { replace: true });
    setPanelKey((k) => k + 1);
  };

  const renderPanel = (inSheet: boolean) => (
    <FilterPanel
      key={panelKey}
      hideHeading={inSheet}
      filters={filters}
      onChange={update}
      onClear={clearAll}
      categories={categories}
      hideCategories={!!lockedCategory}
      activeCount={chips.length}
    />
  );

  const busy = status === 'loading' && items.length > 0;

  return (
    <div className={`${styles.page} container`}>
      {header}

      {lockedCategory && subcategories && subcategories.length > 1 && (
        <div className={`${styles.subs} hide-scrollbar`} role="group" aria-label="Subcategories">
          <button type="button" className={`${styles.sub} ${!filters.subcategory ? styles.subActive : ''}`} onClick={() => update({ subcategory: '' })}>
            All
          </button>
          {subcategories.map((s) => (
            <button
              key={s.name}
              type="button"
              className={`${styles.sub} ${filters.subcategory === s.name ? styles.subActive : ''}`}
              onClick={() => update({ subcategory: filters.subcategory === s.name ? '' : s.name })}
              aria-pressed={filters.subcategory === s.name}
            >
              {s.name} <small>{s.count}</small>
            </button>
          ))}
        </div>
      )}

      <div className={styles.layout}>
        <aside className={styles.sidebar} aria-label="Filters">{renderPanel(false)}</aside>

        <section className={styles.results} aria-label="Search results">
          <div className={styles.toolbar}>
            <p className={styles.count} aria-live="polite">
              {status === 'loading' && items.length === 0 ? 'Loading rentals…' : formatCount(total, 'rental')}
            </p>
            <div className={styles.controls}>
              <Button variant="outline" size="sm" className={styles.filterBtn} iconLeft={<SlidersHorizontal size={16} aria-hidden />} onClick={() => setSheetOpen(true)}>
                Filters{filterCount > 0 ? ` (${filterCount})` : ''}
              </Button>
              <label className={styles.sort}>
                <span>Sort by</span>
                <span className={styles.select}>
                  <select value={filters.sort} onChange={(e) => update({ sort: e.target.value as SortKey })}>
                    {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                  <ChevronDown size={16} aria-hidden />
                </span>
              </label>
            </div>
          </div>

          {chips.length > 0 && (
            <ul className={styles.chips} aria-label="Active filters">
              {chips.map((c) => (
                <li key={c.key}>
                  <button type="button" className={styles.chip} onClick={() => clearChip(c.clear)} aria-label={`Remove filter ${c.label}`}>
                    {c.label} <X size={14} aria-hidden />
                  </button>
                </li>
              ))}
              <li><button type="button" className={styles.clearAll} onClick={clearAll}>Clear all</button></li>
            </ul>
          )}

          {status === 'error' ? (
            <EmptyState
              icon={<AlertTriangle size={30} aria-hidden />}
              title="We couldn’t load the rentals"
              description="The server did not respond. Check that the API is running, then try again."
              action={<Button onClick={retry}>Try again</Button>}
            />
          ) : status === 'loading' && items.length === 0 ? (
            <div className={styles.grid}><SkeletonGrid count={8} /></div>
          ) : total === 0 ? (
            <EmptyState
              icon={<SearchX size={30} aria-hidden />}
              title="No rentals match your search"
              description="Try a broader search, remove a filter, or raise your maximum price. You can also describe what you need to the AI Rental Finder."
              action={
                <div className={styles.emptyActions}>
                  <Button onClick={clearAll}>Clear filters</Button>
                  <Link to={`/ai-finder${filters.q ? `?q=${encodeURIComponent(filters.q)}` : ''}`} className={styles.aiLink}>
                    <Sparkles size={16} aria-hidden /> Ask the AI Rental Finder
                  </Link>
                </div>
              }
            />
          ) : (
            <>
              <ul className={`${styles.grid} ${busy ? styles.busy : ''}`} aria-busy={busy}>
                {items.map((listing, i) => (
                  <li key={listing.id} className={styles.cardIn} style={{ ['--i' as string]: i % 12 }}>
                    <ListingCard listing={listing} />
                  </li>
                ))}
              </ul>

              {hasMore && (
                <div className={styles.more}>
                  <p>Showing {items.length} of {total}</p>
                  <Button variant="outline" loading={loadingMore} onClick={loadMore}>Load more rentals</Button>
                </div>
              )}

              <p className={styles.aiNote}>
                <Sparkles size={16} aria-hidden />
                Can’t find the right one? <Link to="/ai-finder">Describe it to the AI Rental Finder</Link>
              </p>
            </>
          )}
        </section>
      </div>

      <Modal
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Filters"
        footer={<FilterSheetFooter total={total} canClear={chips.length > 0} onClear={clearAll} onClose={() => setSheetOpen(false)} />}
      >
        {renderPanel(true)}
      </Modal>
    </div>
  );
}
