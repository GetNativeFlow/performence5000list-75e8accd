// Auto-generated Application API. Do not edit — regenerate from the studio.
// Visual actions and hand-written action code both call these functions.

import { router } from 'expo-router';
import { Alert } from 'react-native';

var ROUTES = {
  "Page 1": "/page1"
};

function _route(name) {
  if (Object.prototype.hasOwnProperty.call(ROUTES, name)) return ROUTES[name];
  var guess = '/' + String(name == null ? '' : name).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  console.warn('[app] Unknown page name:', name, '- falling back to', guess);
  return guess;
}

function _qs(params) {
  if (!params) return '';
  var parts = [];
  for (var k in params) {
    if (!Object.prototype.hasOwnProperty.call(params, k)) continue;
    var v = params[k];
    if (v === undefined || v === null || v === '') continue;
    parts.push(encodeURIComponent(k) + '=' + encodeURIComponent(String(v)));
  }
  return parts.length ? '?' + parts.join('&') : '';
}

function _noOverlay(id) {
  console.warn('[app.overlay] No overlay "' + id + '" on this screen.');
}

function _noStepper(id) {
  console.warn('[app.stepper] No stepper "' + id + '" on this screen.');
}

function _stringParams(params) {
  var out = {};
  if (!params) return out;
  for (var k in params) {
    if (!Object.prototype.hasOwnProperty.call(params, k)) continue;
    var v = params[k];
    if (v === undefined || v === null) continue;
    out[k] = String(v);
  }
  return out;
}

export const appRuntime = {
  navigate: function (pageName, params) {
    var pathname = _route(pageName);
    if (params) router.push({ pathname: pathname, params: _stringParams(params) });
    else router.push(pathname);
  },
  replace: function (pageName, params) {
    var pathname = _route(pageName);
    if (params) router.replace({ pathname: pathname, params: _stringParams(params) });
    else router.replace(pathname);
  },
  goBack: function () {
    router.back();
  },
  toast: function (message) {
    Alert.alert('', String(message == null ? '' : message));
  },
  alert: function (title, message) {
    Alert.alert(String(title == null ? '' : title), String(message == null ? '' : message));
  },
  overlay: { open: _noOverlay, close: _noOverlay, toggle: _noOverlay },
  stepper: { next: _noStepper, prev: _noStepper, goTo: _noStepper, reset: _noStepper },
  params: {},
  fn: {},
};

export default appRuntime;
