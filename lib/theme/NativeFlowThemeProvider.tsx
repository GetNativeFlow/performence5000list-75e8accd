import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import type { NativeFlowTheme } from './themeSchema';
import { isNativeFlowTheme } from './themeSchema';
import { themes, defaultMode, setRuntimeThemeColors, setRuntimeTypography, setRuntimeSpacing, setRuntimeBorderRadius } from '../../config/theme';

const CACHE_KEY = 'nf.theme.cache.v1';
const FETCH_TIMEOUT_MS = 5000;

type Status = 'idle' | 'loading' | 'ready' | 'error';

interface ThemeContextValue {
  theme: NativeFlowTheme;
  mode: string;
  setMode: (mode: string) => void;
  status: Status;
  error: string | null;
  refresh: () => Promise<void>;
}

function bundledThemeForMode(mode: string): NativeFlowTheme {
  const t = themes[mode] || themes[defaultMode] || { colors: {} };
  return { colors: { ...t.colors } };
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export interface NativeFlowThemeProviderProps {
  children: React.ReactNode;
  /** Optional override for the configured themeApiUrl (testing/regional routing). */
  themeApiUrl?: string | null;
  /** Region or any other querystring/header used by the backing API. */
  region?: string;
}

export function NativeFlowThemeProvider({ children, themeApiUrl, region }: NativeFlowThemeProviderProps) {
  const configuredUrl = (themeApiUrl !== undefined
    ? themeApiUrl
    : (Constants.expoConfig?.extra as any)?.nativeflow?.themeApiUrl) || null;

  const [mode, setMode] = useState<string>(defaultMode);
  const [theme, setTheme] = useState<NativeFlowTheme>(() => bundledThemeForMode(defaultMode));
  const [status, setStatus] = useState<Status>(configuredUrl ? 'loading' : 'ready');
  const [error, setError] = useState<string | null>(null);

  const applyTheme = (next: NativeFlowTheme) => {
    setTheme(next);
    // Mirror every section the payload carries into the bundled module so
    // generated screens see the new values without prop drilling. Sections
    // not present in the payload are left untouched (bundled defaults win).
    setRuntimeThemeColors({ [mode]: next.colors, [defaultMode]: next.colors });
    if (next.typography) {
      setRuntimeTypography({ [mode]: next.typography as any, [defaultMode]: next.typography as any });
    }
    if (next.spacing) {
      setRuntimeSpacing({ [mode]: next.spacing as any, [defaultMode]: next.spacing as any });
    }
    if (next.borderRadius) {
      setRuntimeBorderRadius({ [mode]: next.borderRadius as any, [defaultMode]: next.borderRadius as any });
    }
  };

  const fetchRemote = async () => {
    if (!configuredUrl) return;
    setStatus('loading');
    setError(null);
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      const url = region ? `${configuredUrl}${configuredUrl.includes('?') ? '&' : '?'}region=${encodeURIComponent(region)}` : configuredUrl;
      const res = await fetch(url, {
        signal: controller.signal,
        headers: region ? { 'x-nf-region': region } : undefined,
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!isNativeFlowTheme(json)) throw new Error('Invalid theme payload');
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(json));
      applyTheme(json as NativeFlowTheme);
      setStatus('ready');
    } catch (e: any) {
      setError(e?.message || String(e));
      setStatus('error');
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // 1. Hydrate from cache for instant first paint.
      try {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (!cancelled && cached) {
          const parsed = JSON.parse(cached);
          if (isNativeFlowTheme(parsed)) applyTheme(parsed as NativeFlowTheme);
        }
      } catch {
        /* ignore cache read failures */
      }
      // 2. Kick off remote fetch in the background.
      if (!cancelled && configuredUrl) await fetchRemote();
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configuredUrl, region]);

  useEffect(() => {
    // Mode change → re-pull bundled colors when no runtime theme is loaded.
    if (status !== 'ready' || !configuredUrl) {
      applyTheme(bundledThemeForMode(mode));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const value = useMemo<ThemeContextValue>(() => ({
    theme, mode, setMode, status, error, refresh: fetchRemote,
  }), [theme, mode, status, error]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useNativeFlowTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Permissive fallback so generated components don't crash if the provider
    // is somehow not mounted (e.g. during isolated previews).
    return {
      theme: bundledThemeForMode(defaultMode),
      mode: defaultMode,
      setMode: () => {},
      status: 'ready',
      error: null,
      refresh: async () => {},
    };
  }
  return ctx;
}
