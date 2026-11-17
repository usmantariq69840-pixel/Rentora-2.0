import { LayoutGrid } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { categoryNav } from './categories';
import styles from './CategoryNav.module.css';

/** Horizontal category row under the header. Scrolls sideways on small screens. */
export default function CategoryNav() {
  return (
    <nav className={styles.nav} aria-label="Categories">
      <ul className={`${styles.list} hide-scrollbar container`}>
        <li>
          <NavLink to="/browse" end className={({ isActive }) => `${styles.chip} ${isActive ? styles.active : ''}`}>
            <LayoutGrid size={16} aria-hidden />
            All rentals
          </NavLink>
        </li>
        {categoryNav.map(({ slug, name, short, icon: Icon }) => (
          <li key={slug}>
            <NavLink
              to={`/category/${slug}`}
              aria-label={name}
              className={({ isActive }) => `${styles.chip} ${isActive ? styles.active : ''}`}
            >
              <Icon size={16} aria-hidden />
              {short}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
