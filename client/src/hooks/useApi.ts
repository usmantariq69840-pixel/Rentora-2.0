import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '../lib/api';

interface State<T> {
  data?: T;
  error?: ApiError | Error;
  loading: boolean;
}

/**
 * GET helper with loading / error state, request cancellation and retry.
 * Pass `null` to skip the request (for example while a route param is missing).
 */
export function useApi<T>(path: string | null) {
  const [state, setState] = useState<State<T>>({ loading: path !== null });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (path === null) {
      setState({ loading: false });
      return;
    }
    const controller = new AbortController();
    setState((s) => ({ data: s.data, loading: true }));
    api<T>(path, { signal: controller.signal })
      .then((data) => setState({ data, loading: false }))
      .catch((error: Error) => {
        if (error.name === 'AbortError') return;
        setState({ error, loading: false });
      });
    return () => controller.abort();
  }, [path, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { ...state, retry };
}
