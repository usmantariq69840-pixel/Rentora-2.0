import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import AiSetupModal from '../components/ai/AiSetupModal';
import { api } from './api';
import { useAuth } from './AuthContext';
import type { AiStatus } from '../types';

interface AiContextValue {
  /** null until the first answer arrives */
  status: AiStatus | null;
  refresh: () => Promise<void>;
  /** Opens the "add your Gemini key" dialog. Resolves true when a key was saved. */
  requestSetup: () => Promise<boolean>;
}

const AiContext = createContext<AiContextValue | null>(null);

export function AiProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [status, setStatus] = useState<AiStatus | null>(null);
  const [open, setOpen] = useState(false);
  const resolver = useRef<((saved: boolean) => void) | null>(null);

  const refresh = useCallback(async () => {
    try {
      setStatus(await api<AiStatus>('/ai/status'));
    } catch {
      /* keep the last known status; the AI features show their own errors */
    }
  }, []);

  // canConfigure depends on who is signed in, so look again when that changes.
  useEffect(() => { void refresh(); }, [refresh, user?.id, user?.role]);

  const requestSetup = useCallback(
    () =>
      new Promise<boolean>((resolve) => {
        resolver.current?.(false);
        resolver.current = resolve;
        setOpen(true);
      }),
    [],
  );

  const finish = (saved: boolean) => {
    setOpen(false);
    resolver.current?.(saved);
    resolver.current = null;
  };

  const value = useMemo(() => ({ status, refresh, requestSetup }), [status, refresh, requestSetup]);

  return (
    <AiContext.Provider value={value}>
      {children}
      <AiSetupModal
        open={open}
        isAdmin={user?.role === 'admin'}
        onClose={() => finish(false)}
        onSaved={async () => {
          await refresh();
          finish(true);
        }}
      />
    </AiContext.Provider>
  );
}

export function useAi() {
  const ctx = useContext(AiContext);
  if (!ctx) throw new Error('useAi must be used inside <AiProvider>');
  return ctx;
}
