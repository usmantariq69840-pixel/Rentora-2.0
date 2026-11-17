import { useRef, type KeyboardEvent } from 'react';
import styles from './Tabs.module.css';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  /** Highlights the count (for example, requests waiting for a decision) */
  attention?: boolean;
}

interface Props {
  tabs: TabItem[];
  active: string;
  onChange: (id: string) => void;
  label: string;
  /** id prefix so tab panels can reference their tab */
  idBase: string;
}

/** Accessible tab list: arrow keys / Home / End move between tabs, and the underline slides in. */
export default function Tabs({ tabs, active, onChange, label, idBase }: Props) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (e: KeyboardEvent, index: number) => {
    const last = tabs.length - 1;
    const target =
      e.key === 'ArrowRight' ? (index + 1) % tabs.length
      : e.key === 'ArrowLeft' ? (index - 1 + tabs.length) % tabs.length
      : e.key === 'Home' ? 0
      : e.key === 'End' ? last
      : -1;
    if (target < 0) return;
    e.preventDefault();
    onChange(tabs[target].id);
    refs.current[target]?.focus();
  };

  return (
    <div className={`${styles.list} hide-scrollbar`} role="tablist" aria-label={label}>
      {tabs.map((tab, i) => {
        const selected = tab.id === active;
        return (
          <button
            key={tab.id}
            ref={(el) => { refs.current[i] = el; }}
            id={`${idBase}-tab-${tab.id}`}
            role="tab"
            type="button"
            aria-selected={selected}
            aria-controls={`${idBase}-panel`}
            tabIndex={selected ? 0 : -1}
            className={`${styles.tab} ${selected ? styles.selected : ''}`}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={`${styles.count} ${tab.attention ? styles.attention : ''}`}>{tab.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
