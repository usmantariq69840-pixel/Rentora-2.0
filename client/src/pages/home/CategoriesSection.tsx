import { AlertTriangle } from 'lucide-react';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import Reveal from '../../components/common/Reveal';
import SectionHeader from '../../components/common/SectionHeader';
import CategoryCard from '../../components/listings/CategoryCard';
import { useApi } from '../../hooks/useApi';
import type { Category } from '../../types';
import styles from './Home.module.css';

export default function CategoriesSection() {
  const { data, error, loading, retry } = useApi<{ categories: Category[] }>('/categories');

  return (
    <section id="categories" className={`${styles.section} container`} aria-labelledby="categories-title">
      <Reveal>
        <SectionHeader
          id="categories-title"
          eyebrow="Categories"
          title="Browse by category"
          subtitle="From cameras and phones to furniture and vehicles, find what you need nearby."
        />
      </Reveal>

      {error ? (
        <EmptyState
          icon={<AlertTriangle size={28} aria-hidden />}
          title="Categories didn’t load"
          description="Check that the API is running, then try again."
          action={<Button onClick={retry}>Try again</Button>}
        />
      ) : (
        <div className={styles.categoryGrid}>
          {loading && !data
            ? Array.from({ length: 7 }, (_, i) => <div key={i} className={styles.categorySkeleton} aria-hidden />)
            : data?.categories.map((category, i) => (
                <Reveal key={category.id} delay={i * 90} from="scale">
                  <CategoryCard category={category} />
                </Reveal>
              ))}
        </div>
      )}
    </section>
  );
}
