// AUTO-GENERATED.
import { useAuthStore } from './store';
import { adapter } from './adapter';
import { AuthMethodUnsupportedError, AuthChallengeRequiredError, AuthChallengeExpiredError } from './types';
import { setPendingChallenge, readPendingChallenge, clearPendingChallenge } from './challenge';
import type { AuthState } from './types';

export function useAuth() {
  return useAuthStore((s) => ({ status: s.status, user: s.user, roles: s.roles, permissions: s.permissions }));
}

export function usePermission(perm: string): boolean {
  return useAuthStore((s) => s.permissions.includes(perm));
}

/** Role membership, which permissions cannot stand in for. */
export function useRole(role: string): boolean {
  return useAuthStore((s) => s.roles.includes(role));
}

/** Push an adapter result into the store, including the fresh access token. */
async function commit(state: AuthState): Promise<AuthState> {
  const token = await adapter.getToken().catch(() => null);
  useAuthStore.getState().setSession(state.user, { roles: state.roles, permissions: state.permissions }, token);
  return state;
}

/**
 * Keep the store in step with sessions the app did not ask for.
 *
 * Every adapter reports state changes, and until this existed nothing listened:
 * a session that arrived late — an OAuth redirect coming back, a token
 * refreshed by the provider SDK, a sign-out performed on another tab — reached
 * no one, and the app kept rendering as though it had never happened.
 *
 * Returns the unsubscribe; AuthGate owns the lifetime.
 */
export function startAuthBridge(): () => void {
  return adapter.onAuthStateChange((state) => {
    if (state.status === 'authenticated' && state.user) {
      adapter.getToken()
        .catch(() => null)
        .then((token) => useAuthStore.getState().setSession(state.user, { roles: state.roles, permissions: state.permissions }, token));
    } else {
      useAuthStore.getState().clear();
    }
  });
}

/** How long to wait for a redirect flow to come back before giving up. */
const OAUTH_TIMEOUT_MS = 120000;

/**
 * Resolve when a session actually exists.
 *
 * An OAuth login returns as soon as the browser has been handed off — the user
 * has not signed in yet, and the adapter answers "unauthenticated" without
 * throwing. A caller that treats that as success
 * navigates to a screen the user still cannot see. Waiting for the state
 * change makes the promise mean what its callers already assume it means.
 */
function waitForSession(): Promise<AuthState> {
  return new Promise((resolve, reject) => {
    let done = false;
    const finish = (fn: () => void) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      unsubscribe();
      fn();
    };
    const timer = setTimeout(
      () => finish(() => reject(new Error('Sign-in was not completed.'))),
      OAUTH_TIMEOUT_MS,
    );
    const unsubscribe = adapter.onAuthStateChange((state) => {
      if (state.status === 'authenticated' && state.user) finish(() => resolve(state));
    });
  });
}

function need<K extends keyof typeof adapter>(method: K) {
  const fn = adapter[method];
  if (typeof fn !== 'function') {
    throw new AuthMethodUnsupportedError(String(method), adapter.providerName);
  }
  return fn as NonNullable<typeof fn>;
}

export const authActions = {
  /** Password sign-in, or OAuth when `provider` is set. */
  async signIn(input: { email?: string; password?: string; provider?: string }) {
    // Deliberately does NOT flip status to 'idle' while in flight: AuthGate
    // renders a full-screen spinner on 'idle', which would blank the sign-in
    // form the user is standing on. Buttons show their own loading state.
    try {
      if (input.provider) {
        // Start listening BEFORE the redirect: on a fast return the state
        // change can land before this line would otherwise have run.
        const session = waitForSession();
        await adapter.login({ kind: 'oauth', provider: input.provider });
        return await commit(await session);
      }
      const state = await adapter.login({
        kind: 'password',
        email: input.email || '',
        password: input.password || '',
      });
      return await commit(state);
    } catch (e) {
      useAuthStore.getState().clear();
      // A challenge is not a failure: the backend accepted the password and
      // wants one more answer. Park the handle in memory so the challenge
      // screen has something to answer with, then rethrow so the button's
      // onChallenge chain can navigate there.
      if (e && (e as any).name === 'AuthChallengeRequiredError') {
        setPendingChallenge((e as AuthChallengeRequiredError).pending);
      }
      throw e;
    }
  },

  async signUp(input: { email: string; password: string; displayName?: string }) {
    const state = await (need('signUp') as any).call(adapter, input);
    // Backends that require confirmation return no session. Committing that
    // would overwrite the store with a null user and read as a sign-out.
    if (!state || state.status !== 'authenticated' || !state.user) return state;
    return commit(state);
  },

  async signOut() {
    await adapter.logout();
    useAuthStore.getState().clear();
    // A half-finished sign-in left over from before is meaningless now, and
    // leaving it would let a challenge screen open on the next attempt.
    clearPendingChallenge();
  },

  async sendOtp(input: { phone: string }) {
    await (need('sendOtp') as any).call(adapter, input.phone);
  },

  async verifyOtp(input: { phone: string; code: string }) {
    const state = await (need('verifyOtp') as any).call(adapter, input.phone, input.code);
    return commit(state);
  },

  async sendMagicLink(input: { email: string }) {
    await (need('sendMagicLink') as any).call(adapter, input.email);
  },

  async resetPassword(input: { email: string }) {
    await (need('resetPassword') as any).call(adapter, input.email);
  },

  /**
   * Code-based confirmation. Deliberately does NOT commit a session: such a
   * ConfirmSignUp only makes the account usable, it returns no tokens, so the
   * screen sends the user to sign in rather than to a gated home screen.
   */
  async confirmSignUp(input: { email: string; code: string }) {
    await (need('confirmSignUp') as any).call(adapter, input.email, input.code);
  },

  async resendConfirmationCode(input: { email: string }) {
    await (need('resendConfirmationCode') as any).call(adapter, input.email);
  },

  /** The challenge waiting to be answered, or null. Drives the routing step. */
  async pendingChallenge(): Promise<string | null> {
    const pending = readPendingChallenge();
    return pending ? pending.challenge : null;
  },

  /**
   * The guard every challenge screen runs on load. There is no route param and
   * no stored state to forge — without a live handle in memory there is
   * nothing to answer, so the screen throws and its onError chain returns the
   * user to sign-in. This is what makes a challenge screen unreachable by a
   * deep link or by an app restart.
   */
  async requireAuthChallenge() {
    if (!readPendingChallenge()) throw new AuthChallengeExpiredError();
  },

  /**
   * Answer the pending challenge. Backends can chain them, so a further
   * challenge replaces the handle and leaves the user on a challenge screen
   * rather than pretending the sign-in finished.
   */
  async respondToChallenge(input: { newPassword?: string; code?: string; fullName?: string; attributes?: Record<string, string> }) {
    const pending = readPendingChallenge();
    if (!pending) throw new AuthChallengeExpiredError();
    // A name is the one required attribute a generated screen can collect;
    // the adapter replays everything else the backend already knows.
    const attributes = {
      ...(input.attributes || {}),
      ...(input.fullName ? { name: input.fullName } : {}),
    };
    const result = await (need('respondToChallenge') as any).call(adapter, pending, pending.challenge, {
      newPassword: input.newPassword,
      code: input.code,
      attributes,
    });
    if (result && result.kind === 'challenge') {
      // Chained challenge: a forced password change on an MFA account asks
      // twice. Thrown, not returned, so the same onChallenge routing that
      // brought the user here sends them on to the next screen instead of the
      // success chain navigating to a home screen they cannot see yet.
      setPendingChallenge(result.pending);
      throw new AuthChallengeRequiredError(result.pending);
    }
    clearPendingChallenge();
    return commit(result.state);
  },

  /**
   * Passwordless sign-in. The code is sent by the sign-in call itself, so this
   * ALWAYS ends in a challenge rather than a session — the throw is the normal
   * path, and the screen's onChallenge chain routes to the code screen.
   */
  async startPasswordlessSignIn(input: { username: string; method: string }) {
    clearPendingChallenge();
    try {
      const result = await (need('startPasswordlessSignIn') as any).call(
        adapter, input.username, input.method === 'smsOtp' ? 'smsOtp' : 'emailOtp',
      );
      if (result && result.kind === 'challenge') {
        setPendingChallenge(result.pending);
        throw new AuthChallengeRequiredError(result.pending);
      }
      return commit(result.state);
    } catch (e) {
      if (e && (e as any).name !== 'AuthChallengeRequiredError') useAuthStore.getState().clear();
      throw e;
    }
  },

  /**
   * Answer a "how do you want to finish?" challenge with the user's pick. The
   * backend replies with the next challenge — the code it just sent — so this
   * behaves exactly like starting one.
   */
  async chooseAuthChallenge(input: { challenge: string }) {
    const pending = readPendingChallenge();
    if (!pending) throw new AuthChallengeExpiredError();
    const result = await (need('respondToChallenge') as any).call(adapter, pending, pending.challenge, {
      chosenChallenge: input.challenge,
    });
    if (result && result.kind === 'challenge') {
      setPendingChallenge(result.pending);
      throw new AuthChallengeRequiredError(result.pending);
    }
    clearPendingChallenge();
    return commit(result.state);
  },

  /**
   * Send the same sign-in code again. Replaces the handle: the backend issues
   * a fresh session string, and answering with the stale one fails.
   */
  async resendAuthChallengeCode() {
    const pending = readPendingChallenge();
    if (!pending) throw new AuthChallengeExpiredError();
    const next = await (need('resendChallengeCode') as any).call(adapter, pending);
    if (next) setPendingChallenge(next);
  },



  async confirmResetPassword(input: { email: string; code: string; newPassword: string }) {
    await (need('confirmResetPassword') as any).call(adapter, input.email, input.code, input.newPassword);
  },

  /**
   * Finish a hosted sign-in on the callback screen.
   *
   * The provider's page redirects back into the app, and by the time this
   * screen mounts the code exchange has either already landed or is still in
   * flight. Checking the store first avoids waiting on a state change that
   * has already happened; otherwise it waits for a definite answer rather
   * than navigating a user who is not actually signed in yet.
   */
  async completeAuthRedirect() {
    const current = useAuthStore.getState();
    if (current.status === 'authenticated' && current.user) {
      return { status: current.status, user: current.user, roles: current.roles, permissions: current.permissions } as AuthState;
    }
    const session = waitForSession();
    // A cold start after a full-page redirect has no in-memory token; the
    // stored refresh token is what turns the return trip back into a session.
    // Adapters that don't emit on refresh are handled inline so the screen
    // never sits on the spinner waiting for an event that isn't coming.
    try {
      const token = await adapter.refreshToken();
      if (token) {
        const user = await adapter.getCurrentUser();
        if (user) {
          const grants = await adapter.getGrants();
          return commit({ status: 'authenticated', user, roles: grants.roles, permissions: grants.permissions });
        }
      }
    } catch { /* fall through to the in-flight exchange */ }
    return commit(await session);
  },
};

export function useAuthActions() {
  return authActions;
}
