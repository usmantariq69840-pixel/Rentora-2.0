import { Sparkles } from 'lucide-react';
import styles from './AiChip.module.css';

/** Marks text that came from the AI and has not been edited yet. */
export default function AiChip({ label = 'AI suggestion' }: { label?: string }) {
  return (
    <span className={styles.chip}>
      <Sparkles size={12} aria-hidden /> {label}
    </span>
  );
}
