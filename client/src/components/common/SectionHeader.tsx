import type { ReactNode } from 'react';
import styles from './SectionHeader.module.css';

interface Props {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  action?: ReactNode;
  id?: string;
}

export default function SectionHeader({ title, subtitle, eyebrow, action, id }: Props) {
  return (
    <div className={styles.header}>
      <div>
        {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
        <h2 id={id}>{title}</h2>
        {subtitle && <p className={styles.sub}>{subtitle}</p>}
      </div>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
