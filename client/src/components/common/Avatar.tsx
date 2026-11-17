import { initials } from '../../lib/format';
import styles from './Avatar.module.css';

const PALETTE = ['#0f766e', '#1e3a5f', '#7c3aed', '#be185d', '#b45309', '#0369a1', '#4d7c0f'];

/** Initials on a colour picked from the name, so the same person always looks the same. */
export default function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const hue = [...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % PALETTE.length;
  return (
    <span
      className={styles.avatar}
      style={{ width: size, height: size, fontSize: size * 0.38, background: PALETTE[hue] }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}
