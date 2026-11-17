import { Loader2, Search, X } from 'lucide-react';
import { useRef, type FormEvent } from 'react';
import styles from './SearchBar.module.css';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  placeholder?: string;
  loading?: boolean;
  size?: 'md' | 'lg';
  /** Shows a button on the right (used on the hero) */
  actionLabel?: string;
  ariaLabel?: string;
  className?: string;
}

export default function SearchBar({
  value,
  onChange,
  onSubmit,
  placeholder = 'Search cameras, consoles, bikes…',
  loading = false,
  size = 'md',
  actionLabel,
  ariaLabel = 'Search rentals',
  className,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit?.(value.trim());
  };

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className={`${styles.bar} ${size === 'lg' ? styles.lg : ''} ${className ?? ''}`}
    >
      <Search className={styles.icon} size={size === 'lg' ? 22 : 18} aria-hidden />
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={styles.input}
      />
      {loading && <Loader2 className={styles.spin} size={18} aria-label="Searching" />}
      {value && !loading && (
        <button
          type="button"
          className={styles.clear}
          aria-label="Clear search"
          onClick={() => {
            onChange('');
            inputRef.current?.focus();
          }}
        >
          <X size={16} aria-hidden />
        </button>
      )}
      {actionLabel && (
        <button type="submit" className={styles.action}>
          {actionLabel}
        </button>
      )}
    </form>
  );
}
