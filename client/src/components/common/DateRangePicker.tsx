import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { addDays, formatLong, formatMonthYear, monthGrid, parseISO, rangesOverlap, todayISO, toISO } from '../../lib/dates';
import styles from './DateRangePicker.module.css';

interface Props {
  start: string | null;
  end: string | null;
  onChange: (start: string | null, end: string | null) => void;
  /** Inclusive ranges that cannot be selected (already booked) */
  unavailable?: { start: string; end: string }[];
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MAX_AHEAD_DAYS = 365;

/**
 * Inline range calendar. Past days and already-booked days cannot be chosen, and a
 * range that would span a booked day is rejected, so the UI never offers impossible dates.
 */
export default function DateRangePicker({ start, end, onChange, unavailable = [] }: Props) {
  const today = todayISO();
  const maxDate = addDays(today, MAX_AHEAD_DAYS);
  const initial = parseISO(start ?? today);
  const [view, setView] = useState({ year: initial.getFullYear(), month: initial.getMonth() });
  const [hover, setHover] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const cells = useMemo(() => monthGrid(view.year, view.month), [view]);
  const isBlocked = (iso: string) => unavailable.some((r) => iso >= r.start && iso <= r.end);
  const spansBlocked = (a: string, b: string) => unavailable.some((r) => rangesOverlap(a, b, r.start, r.end));
  const isDisabled = (iso: string) => iso < today || iso > maxDate || isBlocked(iso);

  const currentMonthKey = toISO(view.year, view.month, 1);
  const canGoBack = currentMonthKey > toISO(parseISO(today).getFullYear(), parseISO(today).getMonth(), 1);
  const canGoForward = currentMonthKey < toISO(parseISO(maxDate).getFullYear(), parseISO(maxDate).getMonth(), 1);

  const shift = (delta: number) => {
    const d = new Date(view.year, view.month + delta, 1);
    setView({ year: d.getFullYear(), month: d.getMonth() });
  };

  const pick = (iso: string) => {
    if (isDisabled(iso)) return;
    setNotice(null);
    if (!start || end) {
      onChange(iso, null);
      return;
    }
    if (iso < start) {
      onChange(iso, null);
      return;
    }
    if (spansBlocked(start, iso)) {
      setNotice('That range includes a day that is already booked. Choose a new start date.');
      onChange(iso, null);
      return;
    }
    onChange(start, iso);
  };

  const previewEnd = start && !end && hover && hover >= start && !spansBlocked(start, hover) ? hover : null;

  return (
    <div className={styles.picker} role="group" aria-label="Choose rental dates">
      <div className={styles.head}>
        <button type="button" onClick={() => shift(-1)} disabled={!canGoBack} aria-label="Previous month" className={styles.nav}>
          <ChevronLeft size={18} aria-hidden />
        </button>
        <p className={styles.month} aria-live="polite">{formatMonthYear(currentMonthKey)}</p>
        <button type="button" onClick={() => shift(1)} disabled={!canGoForward} aria-label="Next month" className={styles.nav}>
          <ChevronRight size={18} aria-hidden />
        </button>
      </div>

      <div className={styles.weekdays} aria-hidden>
        {WEEKDAYS.map((d) => <span key={d}>{d.slice(0, 2)}</span>)}
      </div>

      <ul key={currentMonthKey} className={styles.grid} onMouseLeave={() => setHover(null)}>
        {cells.map((iso, i) => {
          if (!iso) return <li key={`b${i}`} aria-hidden />;
          const blocked = isBlocked(iso);
          const disabled = isDisabled(iso);
          const isStart = iso === start;
          const isEnd = iso === end || (!end && iso === previewEnd && !!start);
          const inRange = !!start && ((!!end && iso > start && iso < end) || (!end && !!previewEnd && iso > start && iso < previewEnd));
          const band = inRange || (isStart && !!(end ?? previewEnd) && (end ?? previewEnd) !== start) || (isEnd && start !== iso);
          const label = `${formatLong(iso)}${blocked ? ', already booked' : iso < today ? ', in the past' : ''}`;
          return (
            <li
              key={iso}
              className={`${styles.cell} ${band ? styles.band : ''} ${isStart ? styles.bandStart : ''} ${isEnd ? styles.bandEnd : ''}`}
            >
              <button
                type="button"
                className={[
                  styles.day,
                  isStart || isEnd ? styles.selected : '',
                  inRange ? styles.inRange : '',
                  iso === today ? styles.today : '',
                  blocked ? styles.blocked : '',
                ].join(' ')}
                disabled={disabled}
                aria-label={label}
                aria-pressed={isStart || iso === end}
                title={blocked ? 'Already booked' : undefined}
                onClick={() => pick(iso)}
                onMouseEnter={() => setHover(iso)}
              >
                {Number(iso.slice(8))}
              </button>
            </li>
          );
        })}
      </ul>

      <div className={styles.foot}>
        <span className={styles.legend}><i className={styles.dotBlocked} /> Booked</span>
        {(start || end) && (
          <button type="button" className={styles.clear} onClick={() => { setNotice(null); onChange(null, null); }}>
            Clear dates
          </button>
        )}
      </div>
      {notice && <p className={styles.notice} role="alert">{notice}</p>}
    </div>
  );
}
