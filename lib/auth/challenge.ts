// AUTO-GENERATED.
import { create } from 'zustand';
import type { PendingAuthSession } from './types';

interface ChallengeState {
  pending: PendingAuthSession | null;
  set: (p: PendingAuthSession | null) => void;
}

/**
 * Deliberately NOT persisted. An app restart must drop the pending challenge:
 * the backend's session is single-use and short-lived, so restoring it would
 * only produce a confusing failure on a screen the user did not choose.
 */
export const useChallengeStore = create<ChallengeState>((set) => ({
  pending: null,
  set: (pending) => set({ pending }),
}));

const alive = (p: PendingAuthSession | null): PendingAuthSession | null =>
  p && p.expiresAt > Date.now() ? p : null;

export function setPendingChallenge(pending: PendingAuthSession | null) {
  useChallengeStore.getState().set(pending);
}

/** The live handle, or null when there is none or it has expired. */
export function readPendingChallenge(): PendingAuthSession | null {
  const p = alive(useChallengeStore.getState().pending);
  // Expired handles are cleared on read so the guard does not have to run a
  // timer: the next screen that asks gets a definite "no".
  if (!p && useChallengeStore.getState().pending) useChallengeStore.getState().set(null);
  return p;
}

export function clearPendingChallenge() {
  useChallengeStore.getState().set(null);
}

/** Reactive read for the challenge screens themselves. */
export function usePendingChallenge(): PendingAuthSession | null {
  return useChallengeStore((s) => alive(s.pending));
}
