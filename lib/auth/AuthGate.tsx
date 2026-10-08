// AUTO-GENERATED.
import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from './store';
import { adapter } from './adapter';
import { startAuthBridge } from './useAuth';
import { BiometricGate } from './BiometricGate';

export function AuthGate({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  const status = useAuthStore((s) => s.status);
  useEffect(() => {
    let mounted = true;
    // Sessions that arrive without anyone asking — an OAuth redirect returning,
    // a provider-side refresh or sign-out — reach the store through here.
    const stopBridge = startAuthBridge();
    (async () => {
      try {
        // Cold start: the access token lives in memory only, so a returning
        // user arrives with nothing but the refresh token in secure storage.
        // Spend one refresh before declaring them signed out — otherwise every
        // launch logs out every user of a token-based provider.
        let user = await adapter.getCurrentUser();
        if (!user && (await adapter.refreshToken())) user = await adapter.getCurrentUser();
        if (!mounted) return;
        if (user) {
          const grants = await adapter.getGrants();
          const token = await adapter.getToken();
          useAuthStore.getState().setSession(user, grants, token);
        } else {
          useAuthStore.getState().clear();
        }
      } catch {
        useAuthStore.getState().clear();
      }
    })();
    return () => { mounted = false; stopBridge(); };
  }, []);
  if (status === 'idle') return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator /></View>;
  // BiometricGate sits INSIDE the session check: it re-locks a session that
  // already exists, it never stands in for having one. When biometrics are
  // off the generated gate is a passthrough.
  return <BiometricGate>{fallback && status !== 'authenticated' ? fallback : children}</BiometricGate>;
}
