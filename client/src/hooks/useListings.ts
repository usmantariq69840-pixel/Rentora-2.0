import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import type { ItemsResponse, Listing } from '../types';

const PAGE_SIZE = 12;

/**
 * Loads search results for a query string (without limit/offset) and supports "Load more".
 * Previous results stay on screen (dimmed) while a new search loads, so the page never flashes empty.
 */
export function useListings(queryString: string) {
  const [items, setItems] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [loadingMore, setLoadingMore] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const controller = useRef<AbortController | null>(null);

  const url = useCallback(
    (offset: number) => `/items?${queryString}${queryString ? '&' : ''}limit=${PAGE_SIZE}&offset=${offset}`,
    [queryString],
  );

  useEffect(() => {
    controller.current?.abort();
    const ctrl = new AbortController();
    controller.current = ctrl;
    setStatus('loading');
    api<ItemsResponse>(url(0), { signal: ctrl.signal })
      .then((res) => {
        setItems(res.items);
        setTotal(res.total);
        setStatus('ready');
      })
      .catch((e: Error) => {
        if (e.name !== 'AbortError') setStatus('error');
      });
    return () => ctrl.abort();
  }, [url, attempt]);

  const loadMore = useCallback(async () => {
    setLoadingMore(true);
    try {
      const res = await api<ItemsResponse>(url(items.length));
      setItems((prev) => [...prev, ...res.items]);
      setTotal(res.total);
    } catch {
      setStatus('error');
    } finally {
      setLoadingMore(false);
    }
  }, [url, items.length]);

  return {
    items,
    total,
    status,
    loadingMore,
    hasMore: items.length < total,
    loadMore,
    retry: () => setAttempt((n) => n + 1),
  };
}
