import React from 'react';
import { View, Text, Pressable, Animated, Easing, StyleSheet } from 'react-native';

const INSET = 2;
const SIZES = {
  sm: { height: 32, fontSize: 13, iconSize: 14, padX: 10, radius: 8 },
  md: { height: 38, fontSize: 14, iconSize: 16, padX: 12, radius: 10 },
  lg: { height: 46, fontSize: 16, iconSize: 18, padX: 14, radius: 12 },
};

function toList(raw) {
  if (Array.isArray(raw)) return raw.map(String);
  if (raw == null || typeof raw === 'object') return [];
  const t = String(raw).trim();
  if (!t) return [];
  if (t.charAt(0) === '[') {
    try {
      const p = JSON.parse(t);
      return Array.isArray(p) ? p.map(String) : [];
    } catch (e) {
      return [];
    }
  }
  return t.split(',').map((s) => s.trim()).filter(Boolean);
}

function toItems(raw) {
  let rows = raw;
  if (typeof raw === 'string') {
    const t = raw.trim();
    if (t.charAt(0) === '[') {
      try { rows = JSON.parse(t); } catch (e) { rows = t.split(','); }
    } else {
      rows = t.split(',');
    }
  }
  if (!Array.isArray(rows)) return [];
  const out = [];
  for (let i = 0; i < rows.length; i += 1) {
    const o = rows[i];
    if (o == null) continue;
    if (typeof o !== 'object') {
      const s = String(o).trim();
      if (s) out.push({ value: s, label: s });
      continue;
    }
    const value = o.value != null ? o.value : (o.id != null ? o.id : o.label);
    const label = o.label != null ? o.label : (o.name != null ? o.name : (o.text != null ? o.text : o.value));
    if (value == null && label == null) continue;
    out.push({
      value: String(value != null ? value : label),
      label: String(label != null ? label : value),
      icon: typeof o.icon === 'string' ? o.icon : undefined,
      disabled: o.disabled === true,
    });
  }
  return out;
}

function StudioSegmented({
  type = 'single',
  items,
  value,
  defaultValue,
  onChange,
  onSeed,
  size = 'md',
  colors = {},
  disabled = false,
  renderIcon,
  style,
}) {
  const multiple = type === 'multiple';
  const sz = SIZES[size] || SIZES.md;
  const list = React.useMemo(() => toItems(items), [items]);
  const flat = StyleSheet.flatten(style) || {};
  const radius = typeof flat.borderRadius === 'number' ? flat.borderRadius : sz.radius;
  const palette = {
    track: colors.track || '#EEEEF0',
    thumb: colors.thumb || '#FFFFFF',
    text: colors.text || '#52525B',
    selectedText: colors.selectedText || '#18181B',
  };

  // Unwired (static preview): keep the selection locally.
  const [inner, setInner] = React.useState(undefined);
  const controlled = value !== undefined && typeof onChange === 'function';
  const current = controlled ? value : inner;
  const selected = multiple ? toList(current) : toList(current).slice(0, 1);

  const write = (next, cb) => {
    if (!controlled) setInner(next);
    if (typeof cb === 'function') cb(next);
  };

  // Seed once the segments are known (a bound list may arrive later).
  const seeded = React.useRef(false);
  React.useEffect(() => {
    if (seeded.current || list.length === 0) return;
    seeded.current = true;
    if (selected.length > 0) return;
    const known = toList(defaultValue).filter((v) => list.some((i) => i.value === v));
    if (multiple) {
      if (known.length > 0) write(known, onSeed);
      return;
    }
    const firstEnabled = list.find((i) => !i.disabled);
    const first = known.length > 0 ? known[0] : (firstEnabled ? firstEnabled.value : undefined);
    if (first !== undefined) write(first, onSeed);
  }, [list.length]);

  const press = (v) => {
    if (disabled) return;
    if (multiple) {
      const has = selected.indexOf(v) !== -1;
      const next = list.map((i) => i.value).filter((x) => (x === v ? !has : selected.indexOf(x) !== -1));
      write(next, onChange);
      return;
    }
    if (selected[0] === v) return;
    write(v, onChange);
  };

  const n = Math.max(list.length, 1);
  const index = multiple ? -1 : list.findIndex((i) => i.value === selected[0]);
  const anim = React.useRef(new Animated.Value(Math.max(index, 0))).current;
  React.useEffect(() => {
    if (index < 0) return;
    Animated.timing(anim, { toValue: index, duration: 200, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [index]);
  const left = n > 1
    ? anim.interpolate({ inputRange: [0, n - 1], outputRange: ['0%', ((n - 1) * 100) / n + '%'] })
    : '0%';

  return (
    <View
      accessibilityRole="radiogroup"
      style={[
        { flexDirection: 'row', alignSelf: 'stretch', minHeight: sz.height, padding: INSET, borderRadius: radius, backgroundColor: palette.track, opacity: disabled ? 0.6 : 1 },
        style,
        { flexDirection: 'row' },
      ]}
    >
      {index >= 0 ? (
        <View pointerEvents="none" style={{ position: 'absolute', top: INSET, bottom: INSET, left: INSET, right: INSET }}>
          <Animated.View
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left,
              width: 100 / n + '%',
              borderRadius: radius - INSET,
              backgroundColor: palette.thumb,
              shadowColor: '#000',
              shadowOpacity: 0.12,
              shadowRadius: 2,
              shadowOffset: { width: 0, height: 1 },
            }}
          />
        </View>
      ) : null}
      {list.map((item) => {
        const on = selected.indexOf(item.value) !== -1;
        const off = disabled || !!item.disabled;
        const tint = on ? palette.selectedText : palette.text;
        const icon = item.icon && typeof renderIcon === 'function' ? renderIcon(item.icon, tint, sz.iconSize) : null;
        return (
          <Pressable
            key={item.value}
            accessibilityRole="button"
            accessibilityState={{ selected: on, disabled: off }}
            accessibilityLabel={item.label || item.value}
            disabled={off}
            onPress={() => press(item.value)}
            style={{
              flex: 1,
              minWidth: 0,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              paddingHorizontal: sz.padX,
              borderRadius: radius - INSET,
              backgroundColor: multiple && on ? palette.thumb : 'transparent',
              opacity: off ? 0.45 : 1,
              shadowColor: '#000',
              shadowOpacity: multiple && on ? 0.12 : 0,
              shadowRadius: 2,
              shadowOffset: { width: 0, height: 1 },
            }}
          >
            {icon}
            {item.label ? (
              <Text numberOfLines={1} style={{ flexShrink: 1, color: tint, fontSize: sz.fontSize, fontWeight: on ? '600' : '500' }}>
                {item.label}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

export default StudioSegmented;
