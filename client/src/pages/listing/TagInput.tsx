import { X } from 'lucide-react';
import { useId, useState, type KeyboardEvent } from 'react';
import styles from './Wizard.module.css';

interface Props {
  tags: string[];
  onChange: (tags: string[]) => void;
  max?: number;
}

/** Type a tag and press Enter or comma. Backspace on an empty box removes the last one. */
export default function TagInput({ tags, onChange, max = 8 }: Props) {
  const id = useId();
  const [text, setText] = useState('');
  const [note, setNote] = useState('');

  const add = (raw: string) => {
    const tag = raw.trim().toLowerCase().replace(/^#/, '');
    if (!tag) return;
    if (tag.length < 2 || tag.length > 24) return setNote('Tags need 2 to 24 characters.');
    if (tags.includes(tag)) return setNote('That tag is already added.');
    if (tags.length >= max) return setNote(`You can add up to ${max} tags.`);
    setNote('');
    onChange([...tags, tag]);
    setText('');
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(text); }
    else if (e.key === 'Backspace' && !text && tags.length) onChange(tags.slice(0, -1));
  };

  return (
    <div className={styles.tagField}>
      <label htmlFor={id} className={styles.tagLabel}>Tags <span>optional · help people find your item</span></label>
      <div className={styles.tagBox}>
        {tags.map((t) => (
          <span key={t} className={styles.tagChip}>
            {t}
            <button type="button" onClick={() => onChange(tags.filter((x) => x !== t))} aria-label={`Remove tag ${t}`}><X size={12} aria-hidden /></button>
          </span>
        ))}
        <input
          id={id}
          value={text}
          onChange={(e) => { setText(e.target.value); setNote(''); }}
          onKeyDown={onKey}
          onBlur={() => add(text)}
          placeholder={tags.length ? '' : 'for example mirrorless, 4k, travel'}
          disabled={tags.length >= max}
          aria-describedby={note ? `${id}-note` : undefined}
        />
      </div>
      {note && <p id={`${id}-note`} className={styles.tagNote} role="alert">{note}</p>}
    </div>
  );
}
