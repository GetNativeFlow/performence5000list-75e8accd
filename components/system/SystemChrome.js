import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const noop = () => {};

// Plain drawer actions (what DrawerActions.* return), so no extra package is needed.
function toggleDrawer(navigation) {
  try { navigation.dispatch({ type: 'TOGGLE_DRAWER' }); } catch (e) { /* no drawer */ }
}

export function makeHeader(Header, pageTitle, backFromHistory) {
  return function SystemHeaderHost(props) {
    const insets = useSafeAreaInsets();
    const navigation = props.navigation;
    const canGoBack = props.back != null || (backFromHistory && navigation.canGoBack());
    const systemNav = {
      pageTitle,
      canGoBack,
      goBack: () => navigation.goBack(),
      toggleDrawer: () => toggleDrawer(navigation),
      items: [],
    };
    return React.createElement(Header, { systemNav, systemInsets: insets });
  };
}

// Items keep the authored order (tab / drawer order), not route order.
function itemsFor(state, items, onNavigate) {
  const current = state.routes[state.index];
  return Object.keys(items)
    .map((name) => {
      const r = state.routes.find((x) => x.name === name);
      if (!r) return null;
      return Object.assign({}, items[name], { active: r.key === current.key, onPress: () => onNavigate(r, current) });
    })
    .filter(Boolean);
}

export function makeTabBar(Bar, items) {
  return function SystemTabBarHost({ state, navigation }) {
    const insets = useSafeAreaInsets();
    const current = state.routes[state.index];
    if (!items[current.name]) return null;
    const list = itemsFor(state, items, (r, cur) => {
      const e = navigation.emit({ type: 'tabPress', target: r.key, canPreventDefault: true });
      if (r.key !== cur.key && !e.defaultPrevented) navigation.navigate(r.name, r.params);
    });
    const systemNav = { pageTitle: items[current.name].label, canGoBack: false, goBack: noop, toggleDrawer: noop, items: list };
    return React.createElement(Bar, { systemNav, systemInsets: insets });
  };
}

export function makeDrawerContent(Drawer, items) {
  return function SystemDrawerHost({ state, navigation }) {
    const insets = useSafeAreaInsets();
    const list = itemsFor(state, items, (r) => {
      navigation.navigate(r.name);
      navigation.dispatch({ type: 'CLOSE_DRAWER' });
    });
    const current = state.routes[state.index];
    const systemNav = {
      pageTitle: (items[current.name] && items[current.name].label) || '',
      canGoBack: false,
      goBack: noop,
      toggleDrawer: () => toggleDrawer(navigation),
      items: list,
    };
    return React.createElement(Drawer, { systemNav, systemInsets: insets });
  };
}
