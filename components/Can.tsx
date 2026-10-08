// AUTO-GENERATED.
import React from 'react';
import { View, Text } from 'react-native';
import { useAuthStore } from '@/lib/auth/store';
import app from '@/lib/app';

/**
 * An EMPTY `permissions` AND `roles` list means "signed in, any role" — that
 * is how enforcement.ts encodes the `authenticated` access level. It is not
 * the same as "no check": the status test below always runs.
 *
 * `roles` is checked as membership, not as the permissions the role expands
 * to. Expanding first made a role with no permissions identical to plain
 * "signed in", and two roles sharing one permission identical to each other.
 * Any ONE of the listed roles admits, matching the server policies, which are
 * emitted one per role and therefore OR together.
 *
 * `redirectTo` sends a SIGNED-OUT visitor to the sign-in screen instead of
 * showing them a locked door. It deliberately does not fire for a signed-in
 * user who lacks a permission: bouncing them to sign in implies signing in
 * again would help, and it would not — they need a role, not a session.
 */
export function Can({ permissions = [], roles = [], children, fallback, redirectTo }: {
  permissions?: string[];
  roles?: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}) {
  const status = useAuthStore((s) => s.status);
  const held = useAuthStore((s) => s.permissions);
  const heldRoles = useAuthStore((s) => s.roles);
  const ok =
    status === 'authenticated' &&
    permissions.every((p) => held.includes(p)) &&
    (roles.length === 0 || roles.some((r) => heldRoles.includes(r)));
  const shouldRedirect = !ok && status === 'unauthenticated' && !!redirectTo;

  React.useEffect(() => {
    // `replace`, not `navigate`: the gated screen must not stay on the back
    // stack, or Back walks straight into it again.
    if (shouldRedirect) app.replace(redirectTo as string);
  }, [shouldRedirect, redirectTo]);

  if (ok) return <>{children}</>;
  // 'idle' is the moment before the session is known — render nothing rather
  // than flashing "sign in" at a user who turns out to be signed in.
  if (shouldRedirect || status === 'idle') return null;
  if (fallback !== undefined) return <>{fallback}</>;
  // Default fallback is a visible message, never null: a silently blank
  // screen is indistinguishable from a rendering bug.
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 4 }}>
        {status === 'authenticated' ? 'You do not have access to this screen' : 'Sign in to continue'}
      </Text>
      <Text style={{ fontSize: 13, opacity: 0.6, textAlign: 'center' }}>
        {status === 'authenticated'
          ? 'Ask an administrator for the required role.'
          : 'This screen is only available to signed-in users.'}
      </Text>
    </View>
  );
}
