import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { categoryArt } from '../../lib/art';
import { formatCount } from '../../lib/format';
import type { Category } from '../../types';
import ProductArt from '../common/ProductArt';
import styles from './CategoryCard.module.css';

export default function CategoryCard({ category }: { category: Category }) {
  return (
    <Link to={`/category/${category.slug}`} className={styles.card}>
      <div className={styles.art}>
        <ProductArt kind={categoryArt[category.slug]} className={styles.svg} />
      </div>
      <div className={styles.text}>
        <h3 className={styles.name}>{category.name}</h3>
        <p className={styles.count}>
          {formatCount(category.itemCount, 'item')}
        </p>
      </div>
      <span className={styles.arrow} aria-hidden>
        <ArrowRight size={18} />
      </span>
    </Link>
  );
}
