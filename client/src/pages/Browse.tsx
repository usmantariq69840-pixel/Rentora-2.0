import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import SearchBar from '../components/common/SearchBar';
import ListingsExplorer from '../components/listings/ListingsExplorer';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import styles from './Browse.module.css';

export default function Browse() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const [text, setText] = useState(q);
  useDocumentTitle(q ? `“${q}” rentals` : 'Browse rentals');

  // keep the box in step when the filter chip or header search changes the URL
  useEffect(() => setText(q), [q]);

  const search = (value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set('q', value);
    else next.delete('q');
    setParams(next, { replace: true });
  };

  return (
    <ListingsExplorer
      header={
        <div className={styles.header}>
          <div>
            <h1>{q ? <>Results for <span>“{q}”</span></> : 'Browse rentals'}</h1>
            <p>Cameras, consoles, bikes and equipment from people nearby. Every booking is approved by the owner.</p>
          </div>
          <SearchBar value={text} onChange={setText} onSubmit={search} className={styles.search} placeholder="Search by item, brand or area…" />
        </div>
      }
    />
  );
}
