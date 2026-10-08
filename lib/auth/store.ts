// AUTO-GENERATED.
import { create } from 'zustand';
import type { AuthState, Grants, NormalizedUser } from './types';

interface Store extends AuthState {
  accessToken: string | null;
  setSession: (u: NormalizedUser | null, grants: Grants, token: string | null) => void;
  setStatus: (s: AuthState['status']) => void;
  clear: () => void;
}

export const useAuthStore = create<Store>((set) => ({
  status: 'idle',
  user: null,
  roles: [],
  permissions: [],
  accessToken: null,
  setSession: (user, grants, accessToken) =>
    set({
      user,
      roles: grants.roles,
      permissions: grants.permissions,
      accessToken,
      status: user ? 'authenticated' : 'unauthenticated',
    }),
  setStatus: (status) => set({ status }),
  clear: () => set({ status: 'unauthenticated', user: null, roles: [], permissions: [], accessToken: null }),
}));
