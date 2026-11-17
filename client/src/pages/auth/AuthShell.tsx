import { CalendarCheck, ShieldCheck, Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';
import ProductArt from '../../components/common/ProductArt';
import styles from './Auth.module.css';

const points = [
  { icon: CalendarCheck, title: 'Request in seconds', text: 'Pick your dates and the owner confirms.' },
  { icon: ShieldCheck, title: 'Clear demo safeguards', text: 'Refundable deposit and payment are simulated.' },
  { icon: Sparkles, title: 'List in minutes', text: 'Turn gear you already own into income.' },
];

/** Two-panel layout shared by the sign-in and create-account pages. */
export default function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className={`${styles.page} container`}>
      <div className={styles.card}>
        <aside className={`${styles.brand} on-dark`} aria-hidden="true">
          <span className={styles.orbA} />
          <span className={styles.orbB} />
          <div className={styles.brandText}>
            <p className={styles.eyebrow}>Rentora</p>
            <h2>Rent what you need.<br />Share what you own.</h2>
            <ul>
              {points.map(({ icon: Icon, title: t, text }, i) => (
                <li key={t} style={{ animationDelay: `${300 + i * 140}ms` }}>
                  <span><Icon size={18} /></span>
                  <div><strong>{t}</strong><p>{text}</p></div>
                </li>
              ))}
            </ul>
          </div>
          <div className={styles.art}>
            <ProductArt kind="camera" />
          </div>
        </aside>

        <section className={styles.formSide}>
          <h1>{title}</h1>
          <p className={styles.sub}>{subtitle}</p>
          {children}
        </section>
      </div>
    </div>
  );
}
