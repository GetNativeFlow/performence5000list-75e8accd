import { useWindowDimensions } from 'react-native';

const BREAKPOINTS = { phone: 480, tablet: 768 };
const TIERS = { tablet: 480, desktop: 992 };
const SCALE = { mobile: 1, tablet: 1, desktop: 1 };
const FONT_SCALE = { mobile: 1, tablet: 1, desktop: 1 };

export function tierForWidth(width) {
  if (width >= TIERS.desktop) return 'desktop';
  if (width >= TIERS.tablet) return 'tablet';
  return 'mobile';
}

/** Theme scale factor for a tier (spacing, radii, dimensions, icon sizes). */
export function scaleFor(tier) {
  return SCALE[tier] || 1;
}

/** Font scale factor for a tier (font size + line height only). */
export function fontScaleFor(tier) {
  return FONT_SCALE[tier] || 1;
}

/** Cumulative tier pick: desktop falls back to tablet, tablet to base. */
export function pickTier(tier, base, tablet, desktop) {
  if (tier === 'desktop') {
    if (desktop !== undefined) return desktop;
    if (tablet !== undefined) return tablet;
    return base;
  }
  if (tier === 'tablet' && tablet !== undefined) return tablet;
  return base;
}

export function useBreakpoint() {
  const { width } = useWindowDimensions();
  const isPhone = width < BREAKPOINTS.phone;
  const isTablet = width >= BREAKPOINTS.phone && width < BREAKPOINTS.tablet;
  const isLargeTablet = width >= BREAKPOINTS.tablet;
  const tier = tierForWidth(width);
  return {
    isPhone,
    isTablet,
    isLargeTablet,
    deviceType: isPhone ? 'phone' : isTablet ? 'tablet' : 'large',
    tier,
    scale: scaleFor(tier),
    fontScale: fontScaleFor(tier),
    width,
    breakpoints: BREAKPOINTS,
    tiers: TIERS,
    scales: SCALE,
    fontScales: FONT_SCALE,
  };
}
