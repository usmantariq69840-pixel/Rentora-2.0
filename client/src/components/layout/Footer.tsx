import { Link } from 'react-router-dom';
import Logo from '../common/Logo';
import { categoryNav } from './categories';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={`${styles.footer} on-dark`}>
      <div className="container">
        <div className={styles.grid}>
          <div className={styles.brand}>
            <Logo tone="light" />
            <p className={styles.blurb}>
              Rent useful things nearby without buying them — and earn from the things you already own.
            </p>
            <p className={styles.tagline}>Rent. Share. Earn.</p>
          </div>

          <div>
            <h2 className={styles.heading}>Browse</h2>
            <ul className={styles.list}>
              {categoryNav.map((c) => (
                <li key={c.slug}>
                  <Link to={`/category/${c.slug}`}>{c.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className={styles.heading}>Rentora</h2>
            <ul className={styles.list}>
              <li><Link to="/#how-it-works">How it works</Link></li>
              <li><Link to="/list-item">List an item</Link></li>
              <li><Link to="/ai-finder">AI Rental Finder</Link></li>
              <li><Link to="/saved">Saved items</Link></li>
            </ul>
          </div>

          <div>
            <h2 className={styles.heading}>Demo information</h2>
            <ul className={styles.list}>
              <li><Link to="/demo-info">Demo privacy &amp; help</Link></li>
              <li><Link to="/demo-info#simulated">What is simulated?</Link></li>
            </ul>
          </div>
        </div>

        <div className={styles.bottom}>
          <p>
            Rentora is a university project demonstration. Payments, deposits and verification are simulated —
            no real money is charged.
          </p>
          <p>© {new Date().getFullYear()} Rentora demo</p>
        </div>
      </div>
    </footer>
  );
}
