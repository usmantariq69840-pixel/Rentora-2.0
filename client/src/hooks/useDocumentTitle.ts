import { useEffect } from 'react';

/** Sets the browser tab title, e.g. "Sony A7 III · Rentora". */
export function useDocumentTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · Rentora` : 'Rentora — Rent. Share. Earn.';
  }, [title]);
}
