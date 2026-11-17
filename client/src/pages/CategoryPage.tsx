import { AlertTriangle, SearchX } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import Breadcrumbs from '../components/common/Breadcrumbs';
import Button, { ButtonLink } from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import ProductArt from '../components/common/ProductArt';
import ListingsExplorer from '../components/listings/ListingsExplorer';
import { useApi } from '../hooks/useApi';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { categoryArt } from '../lib/art';
import { formatCount } from '../lib/format';
import type { CategoryDetail, CategorySlug } from '../types';
import styles from './CategoryPage.module.css';

export default function CategoryPage() {
  const { slug } = useParams<{ slug: CategorySlug }>();
  const { data, error, loading, retry } = useApi<{ category: CategoryDetail }>(slug ? `/categories/${slug}` : null);
  const category = data?.category;
  useDocumentTitle(category?.name);

  if (error) {
    const notFound = 'status' in error && (error.status === 404 || error.status === 400);
    return (
      <div className="container" style={{ paddingBlock: 'var(--space-16)' }}>
        <EmptyState
          icon={notFound ? <SearchX size={30} aria-hidden /> : <AlertTriangle size={30} aria-hidden />}
          title={notFound ? 'That category doesn’t exist' : 'We couldn’t load this category'}
          description={notFound ? 'Pick one from the menu, or browse everything.' : 'Check that the API is running, then try again.'}
          action={notFound ? <ButtonLink to="/browse">Browse all rentals</ButtonLink> : <Button onClick={retry}>Try again</Button>}
        />
      </div>
    );
  }

  return (
    <ListingsExplorer
      key={slug}
      lockedCategory={slug}
      subcategories={category?.subcategories}
      header={
        <section className={`${styles.banner} on-dark`} aria-label="Category">
          <div className={styles.glow} aria-hidden />
          <div className={styles.copy}>
            <Breadcrumbs tone="dark" items={[{ label: 'Home', to: '/' }, { label: category?.name ?? 'Category' }]} />
            {loading && !category ? (
              <div className={styles.skeleton} aria-hidden><i /><i /></div>
            ) : (
              <>
                <h1>{category?.name}</h1>
                <p>{category?.description}</p>
                <p className={styles.count}>{category ? formatCount(category.itemCount, 'item') : ''} available · <Link to="/browse">Browse all categories</Link></p>
              </>
            )}
          </div>
          <div className={styles.art} aria-hidden>
            {slug && <ProductArt kind={categoryArt[slug]} />}
          </div>
        </section>
      }
    />
  );
}
