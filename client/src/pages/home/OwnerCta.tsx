import { ArrowRight, Wand2 } from 'lucide-react';
import { ButtonLink } from '../../components/common/Button';
import ProductArt from '../../components/common/ProductArt';
import Reveal from '../../components/common/Reveal';
import styles from './OwnerCta.module.css';

export default function OwnerCta() {
  return (
    <section className={`${styles.wrap} container`} aria-labelledby="owner-title">
      <Reveal>
        <div className={styles.panel}>
          <div className={styles.copy}>
            <h2 id="owner-title" className={styles.title}>
              Have something sitting unused? List it on Rentora.
            </h2>
            <p className={styles.text}>
              Upload a photo, review an AI-drafted description, set your daily price and start receiving
              booking requests.
            </p>
            <div className={styles.actions}>
              <ButtonLink to="/list-item" variant="secondary" size="lg" iconRight={<ArrowRight size={18} aria-hidden />}>
                List an item
              </ButtonLink>
              <span className={styles.note}>
                <Wand2 size={16} aria-hidden /> AI can draft your listing from a photo
              </span>
            </div>
          </div>

          <div className={styles.art} aria-hidden>
            <div className={`${styles.tile} ${styles.t1}`}><ProductArt kind="camera" /></div>
            <div className={`${styles.tile} ${styles.t2}`}><ProductArt kind="projector" /></div>
            <div className={`${styles.tile} ${styles.t3}`}><ProductArt kind="laptop" /></div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
