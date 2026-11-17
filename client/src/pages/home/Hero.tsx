import { CalendarCheck, CheckCircle2, ShieldCheck, Sparkles, Star } from 'lucide-react';
import { useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ButtonLink } from '../../components/common/Button';
import ProductArt from '../../components/common/ProductArt';
import SearchBar from '../../components/common/SearchBar';
import styles from './Hero.module.css';

const popular = ['Sony A7 III', 'PlayStation 5', 'Projector', 'Mountain bike'];

export default function Hero() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const visualRef = useRef<HTMLDivElement>(null);

  const search = (value: string) => navigate(value ? `/browse?q=${encodeURIComponent(value)}` : '/browse');

  // Gentle pointer parallax on the product collage (desktop mouse only).
  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    if (e.pointerType !== 'mouse' || !visualRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    visualRef.current.style.setProperty('--mx', x.toFixed(3));
    visualRef.current.style.setProperty('--my', y.toFixed(3));
  };

  return (
    <section className={`${styles.hero} on-dark`} onPointerMove={onPointerMove} aria-labelledby="hero-title">
      <div className={styles.blob1} aria-hidden />
      <div className={styles.blob2} aria-hidden />
      <div className={styles.grid} aria-hidden />

      <div className={`${styles.inner} container`}>
        <div className={styles.copy}>
          <p className={styles.eyebrow} style={{ '--i': 0 } as CSSProperties}>
            <Sparkles size={14} aria-hidden /> Rent. Share. Earn.
          </p>
          <h1 id="hero-title" className={styles.title} style={{ '--i': 1 } as CSSProperties}>
            Rent smarter.
            <br />
            <span className={styles.gradient}>Spend less.</span>
          </h1>
          <p className={styles.lead} style={{ '--i': 2 } as CSSProperties}>
            Borrow cameras, consoles, bikes and equipment from people nearby — and earn from the things you
            already own.
          </p>

          <div className={styles.searchWrap} style={{ '--i': 3 } as CSSProperties}>
            <SearchBar
              size="lg"
              value={query}
              onChange={setQuery}
              onSubmit={search}
              actionLabel="Explore rentals"
              placeholder="Try “camera for two days”"
              ariaLabel="Search rentals"
            />
          </div>

          <div className={styles.popular} style={{ '--i': 4 } as CSSProperties}>
            <span>Popular:</span>
            {popular.map((term) => (
              <button key={term} type="button" className={styles.term} onClick={() => search(term)}>
                {term}
              </button>
            ))}
          </div>

          <ul className={styles.trust} style={{ '--i': 5 } as CSSProperties}>
            <li><CalendarCheck size={18} aria-hidden /> Owner-approved bookings</li>
            <li><ShieldCheck size={18} aria-hidden /> Refundable deposits (demo)</li>
            <li><Sparkles size={18} aria-hidden /> AI-assisted listings</li>
          </ul>

          <div className={styles.cta} style={{ '--i': 6 } as CSSProperties}>
            <ButtonLink to="/list-item" variant="light" size="md">
              Have something to rent out?
            </ButtonLink>
          </div>
        </div>

        <div ref={visualRef} className={styles.visual} aria-hidden>
          <div className={styles.glow} />

          <div className={`${styles.card} ${styles.cardMain}`}>
            <div className={styles.cardArt}>
              <ProductArt kind="camera" />
            </div>
            <div className={styles.cardFoot}>
              <div>
                <strong>Sony A7 III</strong>
                <span>Gulberg, Lahore</span>
              </div>
              <b>Rs. 2,500<small> / day</small></b>
            </div>
          </div>

          <div className={`${styles.card} ${styles.cardA}`}>
            <ProductArt kind="controller" />
          </div>
          <div className={`${styles.card} ${styles.cardB}`}>
            <ProductArt kind="bike" />
          </div>

          <div className={`${styles.chip} ${styles.chipRating}`}>
            <Star size={16} fill="currentColor" /> 4.9 · 124 reviews
          </div>
          <div className={`${styles.chip} ${styles.chipBooked}`}>
            <CheckCircle2 size={16} /> Booking approved
          </div>
        </div>
      </div>
    </section>
  );
}
