import { Check } from 'lucide-react';
import { STEPS } from './wizardModel';
import styles from './Wizard.module.css';

interface Props {
  current: number;
  reached: number;
  onGo: (index: number) => void;
}

/** Four numbered steps. You can go back freely and forward only to steps you have already reached. */
export default function StepIndicator({ current, reached, onGo }: Props) {
  return (
    <>
      <ol className={styles.steps} aria-label="Listing steps">
        {STEPS.map((s, i) => (
          <li key={s.id}>
            <button
              type="button"
              className={`${styles.step} ${i === current ? styles.current : ''} ${i < current ? styles.done : ''}`}
              disabled={i > reached}
              aria-current={i === current ? 'step' : undefined}
              onClick={() => onGo(i)}
              style={{ width: '100%' }}
            >
              <span className={styles.bullet}>{i < current ? <Check size={15} aria-hidden /> : i + 1}</span>
              {s.label}
            </button>
          </li>
        ))}
      </ol>
      <div className={styles.mobileStep}>
        <p>Step {current + 1} of {STEPS.length} <span>{STEPS[current].label}</span></p>
        <div className={styles.progress} role="progressbar" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={current + 1} aria-label="Listing progress">
          <i style={{ width: `${((current + 1) / STEPS.length) * 100}%` }} />
        </div>
      </div>
    </>
  );
}
