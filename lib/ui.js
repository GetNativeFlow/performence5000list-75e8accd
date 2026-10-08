// Auto-generated UI API. Do not edit — regenerate from the studio.
// Screens that call ui.* bind this module to their own state via bindUi().

function _unbound(method) {
  console.warn('[ui.' + method + '] This screen has no ui bindings.');
}

export const uiRuntime = {
  show: function () { _unbound('show'); },
  hide: function () { _unbound('hide'); },
  toggle: function () { _unbound('toggle'); },
  style: function () { _unbound('style'); },
  set: function () { _unbound('set'); },
  get: function () { _unbound('get'); return {}; },
  reset: function () { _unbound('reset'); },
};

/**
 * Specialise the module for one screen.
 *
 * names    — display label -> style key ("Error banner" -> "node_c3d4")
 * setters  — style key -> the node's useState setter
 * settable — style key -> prop names ui.set may write
 * values   — style key -> the node's current state object (for ui.get)
 */
export function bindUi(ov, setOv, names, setters, settable, values) {
  var known = Object.keys(names);

  function _key(ref) {
    if (Object.prototype.hasOwnProperty.call(names, ref)) return names[ref];
    // Raw node id, or an already-sanitised key, both accepted as a fallback.
    var direct = String(ref == null ? '' : ref).replace(/-/g, '_');
    if (direct.indexOf('node_') !== 0) direct = 'node_' + direct;
    for (var i = 0; i < known.length; i++) {
      if (names[known[i]] === direct) return direct;
    }
    console.warn('[ui] Unknown component: "' + ref + '". On this screen: ' + (known.length ? known.join(', ') : '(none)'));
    return null;
  }

  // Always the functional form: two ui.* calls in one tick must not clobber
  // each other by both reading the `ov` captured at render time.
  function _patch(key, fields) {
    setOv(function (prev) {
      var next = {};
      for (var k in prev) if (Object.prototype.hasOwnProperty.call(prev, k)) next[k] = prev[k];
      var cur = prev[key] || {};
      var merged = {};
      for (var c in cur) if (Object.prototype.hasOwnProperty.call(cur, c)) merged[c] = cur[c];
      for (var f in fields) if (Object.prototype.hasOwnProperty.call(fields, f)) merged[f] = fields[f];
      next[key] = merged;
      return next;
    });
  }

  return {
    show: function (ref) { var k = _key(ref); if (k) _patch(k, { hidden: false }); },
    hide: function (ref) { var k = _key(ref); if (k) _patch(k, { hidden: true }); },

    toggle: function (ref) {
      var k = _key(ref);
      if (!k) return;
      setOv(function (prev) {
        var next = {};
        for (var p in prev) if (Object.prototype.hasOwnProperty.call(prev, p)) next[p] = prev[p];
        var cur = prev[k] || {};
        var merged = {};
        for (var c in cur) if (Object.prototype.hasOwnProperty.call(cur, c)) merged[c] = cur[c];
        merged.hidden = !cur.hidden;
        next[k] = merged;
        return next;
      });
    },

    style: function (ref, patch) {
      var k = _key(ref);
      if (!k) return;
      if (!patch || typeof patch !== 'object') return console.warn('[ui.style] Second argument must be a style object.');
      setOv(function (prev) {
        var next = {};
        for (var p in prev) if (Object.prototype.hasOwnProperty.call(prev, p)) next[p] = prev[p];
        var cur = prev[k] || {};
        var style = {};
        for (var s in cur.style) if (Object.prototype.hasOwnProperty.call(cur.style, s)) style[s] = cur.style[s];
        for (var n in patch) if (Object.prototype.hasOwnProperty.call(patch, n)) style[n] = patch[n];
        var merged = {};
        for (var c in cur) if (Object.prototype.hasOwnProperty.call(cur, c)) merged[c] = cur[c];
        merged.style = style;
        next[k] = merged;
        return next;
      });
    },

    /**
     * Applies per prop, not all-or-nothing: a write of settable and unsettable
     * keys together lands the settable ones and warns about the rest. Refusing
     * the whole object over one bad key would be the more surprising choice.
     */
    set: function (ref, props) {
      var k = _key(ref);
      if (!k) return;
      if (!props || typeof props !== 'object') return console.warn('[ui.set] Second argument must be a props object.');
      var allowed = settable[k] || [];
      var setter = setters[k];
      var accepted = {};
      var rejected = [];
      for (var p in props) {
        if (!Object.prototype.hasOwnProperty.call(props, p)) continue;
        if (allowed.indexOf(p) === -1) rejected.push(p);
        else accepted[p] = props[p];
      }
      if (rejected.length) {
        console.warn(
          '[ui.set] "' + ref + '" — ' + rejected.map(function (r) { return '"' + r + '"'; }).join(', ') +
          ' not settable. Settable here: ' + (allowed.length ? allowed.join(', ') : 'none') +
          '. (Overlays: use app.overlay.open/close instead.)'
        );
      }
      if (!setter) return;
      var keys = Object.keys(accepted);
      if (!keys.length) return;
      setter(function (prev) {
        var next = {};
        for (var q in prev) if (Object.prototype.hasOwnProperty.call(prev, q)) next[q] = prev[q];
        for (var a in accepted) if (Object.prototype.hasOwnProperty.call(accepted, a)) next[a] = accepted[a];
        return next;
      });
    },

    // The one correct direct read of `ov`: get() runs during render.
    get: function (ref) {
      var k = _key(ref);
      if (!k) return {};
      var out = {};
      var vals = values[k] || {};
      for (var v in vals) if (Object.prototype.hasOwnProperty.call(vals, v)) out[v] = vals[v];
      var cur = ov[k] || {};
      if (cur.hidden !== undefined) out.hidden = cur.hidden;
      if (cur.style !== undefined) out.style = cur.style;
      return out;
    },

    reset: function (ref) {
      if (ref === undefined) return setOv({});
      var k = _key(ref);
      if (!k) return;
      setOv(function (prev) {
        var next = {};
        for (var p in prev) if (Object.prototype.hasOwnProperty.call(prev, p) && p !== k) next[p] = prev[p];
        return next;
      });
    },
  };
}

export default uiRuntime;
