'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';
import { LoadingOverlay } from '@/components/loading-indicator';

type AppLoadingContextValue = {
  /** Show overlay with optional message (ref-counted for overlapping actions). */
  startLoading: (message?: string) => void;
  stopLoading: () => void;
  /** One-shot overlay until pathname changes (e.g. after sign-in redirect). */
  showUntilNavigate: (message?: string) => void;
  isLoading: boolean;
};

const AppLoadingContext = createContext<AppLoadingContextValue | null>(null);

export function AppLoadingProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [busyCount, setBusyCount] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [navigating, setNavigating] = useState(false);
  const [untilNavigate, setUntilNavigate] = useState(false);
  const untilNavigateRef = useRef(false);

  const startLoading = useCallback((msg?: string) => {
    setBusyCount((c) => c + 1);
    if (msg) setMessage(msg);
  }, []);

  const stopLoading = useCallback(() => {
    setBusyCount((c) => {
      const next = Math.max(0, c - 1);
      if (next === 0 && !untilNavigateRef.current) {
        setMessage(null);
      }
      return next;
    });
  }, []);

  const showUntilNavigate = useCallback((msg?: string) => {
    untilNavigateRef.current = true;
    setUntilNavigate(true);
    if (msg) setMessage(msg);
  }, []);

  useEffect(() => {
    setNavigating(false);
    if (untilNavigateRef.current) {
      untilNavigateRef.current = false;
      setUntilNavigate(false);
      setMessage(null);
      setBusyCount(0);
    }
  }, [pathname]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest('a[href]');
      if (!anchor || anchor.getAttribute('target') === '_blank') return;
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        return;
      }
      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === pathname && url.search === window.location.search) return;

      setNavigating(true);
      setMessage((m) => m ?? 'Loading…');
    };

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [pathname]);

  const isLoading = busyCount > 0 || navigating || untilNavigate;
  const overlayLabel =
    message ??
    (untilNavigate ? 'Loading…' : navigating ? 'Loading…' : busyCount > 0 ? 'Please wait…' : 'Loading…');

  const value = useMemo(
    () => ({
      startLoading,
      stopLoading,
      showUntilNavigate,
      isLoading,
    }),
    [startLoading, stopLoading, showUntilNavigate, isLoading]
  );

  return (
    <AppLoadingContext.Provider value={value}>
      {children}
      {isLoading && <LoadingOverlay label={overlayLabel} />}
    </AppLoadingContext.Provider>
  );
}

export function useAppLoading(): AppLoadingContextValue {
  const ctx = useContext(AppLoadingContext);
  if (!ctx) {
    return {
      startLoading: () => {},
      stopLoading: () => {},
      showUntilNavigate: () => {},
      isLoading: false,
    };
  }
  return ctx;
}
