'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { authClient } from '@/lib/auth-client';

export type AppSessionData = Awaited<ReturnType<typeof authClient.getSession>>['data'];

type SessionContextValue = {
  data: AppSessionData | null;
  isPending: boolean;
  refresh: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({
  initialSession,
  children,
}: {
  initialSession: AppSessionData | null;
  children: ReactNode;
}) {
  const [data, setData] = useState<AppSessionData | null>(initialSession);
  const [isPending, setIsPending] = useState(false);

  const refresh = useCallback(async () => {
    const { data: session } = await authClient.getSession();
    setData(session ?? null);
    setIsPending(false);
  }, []);

  useEffect(() => {
    let hiddenAt = 0;
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now();
        return;
      }
      if (hiddenAt && Date.now() - hiddenAt > 60_000) {
        void refresh();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [refresh]);

  const value = useMemo(
    () => ({ data, isPending, refresh }),
    [data, isPending, refresh]
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useAppSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  const [data, setData] = useState<AppSessionData | null>(null);
  const [isPending, setIsPending] = useState(true);

  useEffect(() => {
    if (ctx) return;
    let cancelled = false;
    void authClient.getSession().then(({ data: session }) => {
      if (cancelled) return;
      setData(session ?? null);
      setIsPending(false);
    });
    return () => {
      cancelled = true;
    };
  }, [ctx]);

  if (ctx) {
    return ctx;
  }

  return {
    data,
    isPending,
    refresh: async () => {
      const { data: session } = await authClient.getSession();
      setData(session ?? null);
      setIsPending(false);
    },
  };
}
