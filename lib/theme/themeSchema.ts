// Canonical NativeFlow runtime theme schema.
// The Studio's Theme Settings writes to this shape; remote endpoints must
// return JSON that matches it.

export interface NativeFlowTheme {
  colors: Record<string, string>;
  typography?: {
    fontFamily?: string;
    scale?: Partial<Record<'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl', number>>;
    weight?: Partial<Record<'regular' | 'medium' | 'semibold' | 'bold', string>>;
  };
  spacing?: Partial<Record<'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl', number>>;
  borderRadius?: Partial<Record<'sm' | 'md' | 'lg' | 'xl' | 'full', number>>;
}

/**
 * Full structural validator for runtime theme payloads.
 * Mirrors supabase/functions/_shared/contract/theme.ts::validateThemeJson so
 * both ends reject the same malformed payloads. Unknown top-level keys are
 * tolerated (forward-compat); malformed known sections cause the payload to
 * be rejected before it lands in AsyncStorage.
 */
const SCALE_KEYS = ['xs','sm','md','lg','xl','xxl'] as const;
const WEIGHT_KEYS = ['regular','medium','semibold','bold'] as const;
const RADIUS_KEYS = ['sm','md','lg','xl','full'] as const;

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

export function isNativeFlowTheme(value: unknown): value is NativeFlowTheme {
  if (!isPlainObject(value)) return false;

  // colors — optional. Sections not present fall back to the bundled
  // snapshot. A typography-only override (no colors block) is valid.
  if (value.colors !== undefined) {
    if (!isPlainObject(value.colors)) return false;
    for (const v of Object.values(value.colors)) {
      if (typeof v !== 'string' || v.length === 0) return false;
    }
  }

  // typography — optional
  if (value.typography !== undefined) {
    const t = value.typography;
    if (!isPlainObject(t)) return false;
    if (t.fontFamily !== undefined && (typeof t.fontFamily !== 'string' || t.fontFamily.length === 0)) return false;
    if (t.scale !== undefined) {
      if (!isPlainObject(t.scale)) return false;
      for (const [k, v] of Object.entries(t.scale)) {
        if (!(SCALE_KEYS as readonly string[]).includes(k)) continue;
        if (typeof v !== 'number' || !Number.isFinite(v) || v <= 0) return false;
      }
    }
    if (t.weight !== undefined) {
      if (!isPlainObject(t.weight)) return false;
      for (const [k, v] of Object.entries(t.weight)) {
        if (!(WEIGHT_KEYS as readonly string[]).includes(k)) continue;
        if (typeof v !== 'string' || v.length === 0) return false;
      }
    }
  }

  // spacing — optional
  if (value.spacing !== undefined) {
    if (!isPlainObject(value.spacing)) return false;
    for (const [k, v] of Object.entries(value.spacing)) {
      if (!(SCALE_KEYS as readonly string[]).includes(k)) continue;
      if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) return false;
    }
  }

  // borderRadius — optional
  if (value.borderRadius !== undefined) {
    if (!isPlainObject(value.borderRadius)) return false;
    for (const [k, v] of Object.entries(value.borderRadius)) {
      if (!(RADIUS_KEYS as readonly string[]).includes(k)) continue;
      if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) return false;
    }
  }

  return true;
}
