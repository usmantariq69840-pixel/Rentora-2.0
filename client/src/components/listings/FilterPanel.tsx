import { useEffect, useState } from 'react';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { addDays, todayISO } from '../../lib/dates';
import type { Category, Filters } from '../../types';
import Button from '../common/Button';
import styles from './FilterPanel.module.css';

interface Props {
  filters: Filters;
  onChange: (patch: Partial<Filters>) => void;
  onClear: () => void;
  categories: Category[];
  /** Hide the category list (Category pages are already scoped) */
  hideCategories?: boolean;
  /** The mobile sheet already has a title, so it hides this one */
  hideHeading?: boolean;
  activeCount: number;
}

const digits = (v: string) => v.replace(/\D/g, '').slice(0, 7);

/** Category, daily price and availability filters. Shared by the sidebar and the mobile sheet. */
export default function FilterPanel({ filters, onChange, onClear, categories, hideCategories, hideHeading, activeCount }: Props) {
  const [min, setMin] = useState(filters.minPrice);
  const [max, setMax] = useState(filters.maxPrice);
  const dMin = useDebouncedValue(min);
  const dMax = useDebouncedValue(max);

  const priceError = min && max && Number(min) > Number(max) ? 'Minimum price cannot be higher than maximum.' : '';

  // Apply typed prices a moment after typing stops — but only when they are valid.
  useEffect(() => {
    if (dMin === filters.minPrice && dMax === filters.maxPrice) return;
    if (dMin && dMax && Number(dMin) > Number(dMax)) return;
    onChange({ minPrice: dMin, maxPrice: dMax });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dMin, dMax]);

  const today = todayISO();
  const setFrom = (from: string) => {
    if (!from) return onChange({ from: '', to: '' });
    onChange({ from, to: filters.to && filters.to >= from ? filters.to : from });
  };
  const setTo = (to: string) => {
    if (!to) return onChange({ from: '', to: '' });
    const from = filters.from || to;
    onChange({ from: from <= to ? from : to, to });
  };

  return (
    <div className={styles.panel}>
      <div className={styles.top}>
        {!hideHeading && <h2 className={styles.title}>Filters</h2>}
        {activeCount > 0 && (
          <button type="button" className={styles.clear} onClick={onClear}>
            Clear all ({activeCount})
          </button>
        )}
      </div>

      {!hideCategories && (
        <fieldset className={styles.group}>
          <legend>Category</legend>
          <label className={styles.radio}>
            <input type="radio" name="category" checked={filters.category === ''} onChange={() => onChange({ category: '' })} />
            <span>All categories</span>
          </label>
          {categories.map((c) => (
            <label key={c.slug} className={styles.radio}>
              <input type="radio" name="category" checked={filters.category === c.slug} onChange={() => onChange({ category: c.slug })} />
              <span>{c.name}</span>
              <small>{c.itemCount}</small>
            </label>
          ))}
        </fieldset>
      )}

      <fieldset className={styles.group}>
        <legend>Daily price (PKR)</legend>
        <div className={styles.prices}>
          <label>
            <span className="sr-only">Minimum daily price</span>
            <span className={styles.money}>
              <b aria-hidden>Rs.</b>
              <input inputMode="numeric" placeholder="Min" value={min} onChange={(e) => setMin(digits(e.target.value))} aria-invalid={!!priceError} />
            </span>
          </label>
          <span aria-hidden className={styles.dash}>–</span>
          <label>
            <span className="sr-only">Maximum daily price</span>
            <span className={styles.money}>
              <b aria-hidden>Rs.</b>
              <input inputMode="numeric" placeholder="Max" value={max} onChange={(e) => setMax(digits(e.target.value))} aria-invalid={!!priceError} />
            </span>
          </label>
        </div>
        {priceError && <p className={styles.error} role="alert">{priceError}</p>}
      </fieldset>

      <fieldset className={styles.group}>
        <legend>Available on</legend>
        <div className={styles.dates}>
          <label>
            <span>From</span>
            <input type="date" min={today} max={addDays(today, 365)} value={filters.from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label>
            <span>To</span>
            <input type="date" min={filters.from || today} max={addDays(today, 365)} value={filters.to} onChange={(e) => setTo(e.target.value)} />
          </label>
        </div>
        <p className={styles.hint}>Hides items with an approved booking on those days. The owner still confirms every request.</p>
      </fieldset>
    </div>
  );
}

/** Footer for the mobile filter sheet */
export function FilterSheetFooter({ total, onClear, onClose, canClear }: { total: number; onClear: () => void; onClose: () => void; canClear: boolean }) {
  return (
    <>
      <Button variant="outline" onClick={onClear} disabled={!canClear}>Clear all</Button>
      <Button onClick={onClose}>Show {total} {total === 1 ? 'result' : 'results'}</Button>
    </>
  );
}
