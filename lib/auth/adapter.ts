// AUTO-GENERATED supabase adapter.
import { createClient } from '@supabase/supabase-js';
import type { AuthProvider, Grants, LoginInput, NormalizedUser, AuthState, SignUpInput } from './types';

export const supabase = createClient("https://wylsvmumemzvltauwqno.supabase.co", "sb_publishable_7a7JrfhaF6ofII_rSFE8mQ_dZWL0adq");

const REDIRECT_TO = "";
const emailRedirect = REDIRECT_TO ? { emailRedirectTo: REDIRECT_TO } : {};

const PERMS_BY_ROLE: Record<string, string[]> = {};
const ROLE_MAPPING: Record<string, string> = {};

const listeners: Array<(s: AuthState) => void> = [];
function emit(s: AuthState) { listeners.forEach((l) => l(s)); }

async function loadGrants(userId: string): Promise<Grants> {
  const { data } = await supabase.from("user_roles").select("role").eq('user_id', userId);
  const raw: string[] = (data || []).map((r: any) => String(r["role"]));
  const mapped = raw.map((r) => ROLE_MAPPING[r] || r);
  const perms = new Set<string>();
  for (const r of mapped) for (const p of (PERMS_BY_ROLE[r] || [])) perms.add(p);
  // Roles are kept, not just their expansion: a role with no permissions, or
  // one sharing a permission with another role, is otherwise unidentifiable.
  return { roles: [...new Set(mapped)], permissions: [...perms] };
}

function toUser(u: any): NormalizedUser {
  return { id: u.id, email: u.email ?? null, displayName: (u.user_metadata as any)?.name ?? null };
}

/** Build the AuthState for a just-returned Supabase user (may be null). */
async function stateFor(u: any): Promise<AuthState> {
  const user = u ? toUser(u) : null;
  const grants = user ? await loadGrants(user.id) : { roles: [], permissions: [] };
  const state: AuthState = { status: user ? 'authenticated' : 'unauthenticated', user, ...grants };
  emit(state);
  return state;
}

export const adapter: AuthProvider = {
  providerName: 'Supabase',

  async login(input: LoginInput) {
    let user: NormalizedUser | null = null;
    if (input.kind === 'password') {
      const { data, error } = await supabase.auth.signInWithPassword({ email: input.email, password: input.password });
      if (error || !data.user) throw error || new Error('login failed');
      user = { id: data.user.id, email: data.user.email ?? null, displayName: (data.user.user_metadata as any)?.name ?? null };
    } else if (input.kind === 'oauth') {
      await supabase.auth.signInWithOAuth({ provider: input.provider as any });
    }
    const grants = user ? await loadGrants(user.id) : { roles: [], permissions: [] };
    const state: AuthState = { status: user ? 'authenticated' : 'unauthenticated', user, ...grants };
    emit(state);
    return state;
  },
  async signUp(input: SignUpInput) {
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: { ...emailRedirect, data: input.displayName ? { name: input.displayName } : undefined },
    });
    if (error) throw error;
    // With email confirmation on, Supabase returns a user but NO session —
    // the caller stays unauthenticated until the link is clicked, which is
    // exactly what the "Confirm email" screen is for.
    const confirmed = data.session ? data.user : null;
    return stateFor(confirmed);
  },

  async sendOtp(phone: string) {
    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) throw error;
  },

  async verifyOtp(phone: string, code: string) {
    const { data, error } = await supabase.auth.verifyOtp({ phone, token: code, type: 'sms' });
    if (error) throw error;
    return stateFor(data.user);
  },

  async sendMagicLink(email: string) {
    const { error } = await supabase.auth.signInWithOtp({ email, options: { ...emailRedirect } });
    if (error) throw error;
  },

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(
      email,
      REDIRECT_TO ? { redirectTo: REDIRECT_TO } : undefined,
    );
    if (error) throw error;
  },

  async logout() {
    // signOut covers SSO end-session for Supabase-hosted OAuth providers.
    await supabase.auth.signOut();
    emit({ status: 'unauthenticated', user: null, roles: [], permissions: [] });
  },
  async getToken() {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  },
  async refreshToken() {
    const { data } = await supabase.auth.refreshSession();
    return data.session?.access_token ?? null;
  },
  async getCurrentUser() {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return null;
    return { id: data.user.id, email: data.user.email ?? null, displayName: (data.user.user_metadata as any)?.name ?? null };
  },
  async getGrants() {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return { roles: [], permissions: [] };
    return loadGrants(data.user.id);
  },
  onAuthStateChange(cb) {
    listeners.push(cb);
    const { data: sub } = supabase.auth.onAuthStateChange(() => {});
    return () => { const i = listeners.indexOf(cb); if (i >= 0) listeners.splice(i, 1); sub.subscription.unsubscribe(); };
  },
};
