// AUTO-GENERATED.
import { adapter } from './adapter';
import { useAuthStore } from './store';

const TTL_MS = 900 * 1000;
const PROACTIVE_AT = TTL_MS * 0.8;

let lastRefreshAt = 0;
let refreshInFlight: Promise<string | null> | null = null;

async function coalescedRefresh(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    try {
      const token = await adapter.refreshToken();
      lastRefreshAt = Date.now();
      if (token) {
        const grants = await adapter.getGrants();
        const user = await adapter.getCurrentUser();
        useAuthStore.getState().setSession(user, grants, token);
      } else {
        useAuthStore.getState().clear();
      }
      return token;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const now = Date.now();
  if (now - lastRefreshAt > PROACTIVE_AT) {
    await coalescedRefresh().catch(() => null);
  }
  const token = useAuthStore.getState().accessToken;
  const headers = new Headers(init.headers || {});
  if (token) headers.set('Authorization', 'Bearer ' + token);
  let res = await fetch(input, { ...init, headers });
  if (res.status === 401) {
    const newToken = await coalescedRefresh();
    if (newToken) {
      const h2 = new Headers(init.headers || {});
      h2.set('Authorization', 'Bearer ' + newToken);
      res = await fetch(input, { ...init, headers: h2 });
    }
  }
  return res;
}
