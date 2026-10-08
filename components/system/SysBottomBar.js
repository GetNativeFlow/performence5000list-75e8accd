import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, Text } from 'react-native';
import { Svg, Path, Circle, Rect, Line, G, Polyline, Polygon, Ellipse } from 'react-native-svg';
import { default as LucideDynamic } from '../../components/LucideDynamic';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { appRuntime as app } from '../../lib/app';

export default function BottomBar({ systemNav, systemInsets }) {
  const router = useRouter();
  const routeParams = useLocalSearchParams();
  // ── Auto-generated fetch helpers ──
  const __vars = {};
  // Tokenise a variable path the same way resolvePathValue does (see
  // src/lib/apiResponseUtils.ts — one grammar for canvas, codegen and preview):
  // dot keys, [0] indices, and [] meaning index 0. Guarded by the parity test in
  // src/lib/__tests__/apiPayloadVariables.test.ts.
  const __pathTokens = (path) => {
    const out = [];
    const re = /([^\.\[\]]+)|\[(\d*)\]/g;
    let m;
    while ((m = re.exec(path)) !== null) {
      if (m[1] != null) out.push(m[1]);
      else out.push(m[2] === '' ? 0 : Number(m[2]));
    }
    return out;
  };
  // Longest-prefix match on the scope, then walk the remainder, so
  // `cart.user.address.city` and `cart.lines[0].sku` reach into object and array
  // variables. `found` stays false when a segment is absent (a typo) but is true
  // for a variable that legitimately holds null.
  const __lookupVar = (key) => {
    const tokens = __pathTokens(String(key).trim());
    for (let i = tokens.length; i >= 1; i--) {
      const head = tokens.slice(0, i).join('.');
      if (!(head in __vars)) continue;
      let v = __vars[head];
      for (const tok of tokens.slice(i)) {
        if (v == null) return { found: false };
        if (typeof tok === 'number') {
          if (!Array.isArray(v) || !(tok in v)) return { found: false };
        } else {
          // Same array auto-unwrap as resolvePathValue: a string key against an
          // array reads the first item, so `lines.sku` == `lines[0].sku`.
          if (Array.isArray(v)) { v = v[0]; if (v == null) return { found: false }; }
          if (!(tok in Object(v))) return { found: false };
        }
        v = v[tok];
      }
      return { found: true, value: v };
    }
    return { found: false };
  };
  const interpolateVars = (s) => {
    if (typeof s !== 'string') return s;
    return s.replace(/("?)\{\{\s*([\w.[\]-]+)\s*\}\}("?)/g, (_m, q1, key, q2) => {
      try {
        const hit = __lookupVar(key);
        // Unknown variable: leave it intact, quotes included, so the bad request is
        // visible in the network tab instead of silently sending an empty value.
        if (!hit.found) return _m;
        if (typeof hit.value === 'string') return q1 + hit.value + q2;
        // Non-strings (object / array / number / boolean / null) are emitted as
        // JSON. When the reference fills the whole quoted slot the quotes go with it,
        // so `{"tags": "{{ cart.tags }}"}` sends a real array and `"{{ cart.qty }}"`
        // a real number rather than JSON trapped inside a string.
        const json = JSON.stringify(hit.value);
        return q1 && q2 ? json : q1 + json + q2;
      } catch { return _m; }
    });
  };
  const walkArrayPath = (json, path) => {
    if (!path) {
      if (Array.isArray(json)) return json;
      if (json && Array.isArray(json.data)) return json.data;
      // Walk one level deep to find the first array (legacy behavior).
      if (json && typeof json === 'object') {
        for (const k of Object.keys(json)) {
          if (Array.isArray(json[k])) return json[k];
        }
      }
      return [];
    }
    const parts = String(path).split('.').filter(Boolean);
    let cur = json;
    for (const p of parts) { if (cur == null) return []; cur = cur[p]; }
    return Array.isArray(cur) ? cur : [];
  };
  // ── Field Transform Pipeline (Phase 1) — keep in sync with src/lib/transforms/applyTransforms.ts ──
  const __toNumber = (v) => {
    if (typeof v === 'number' && isFinite(v)) return v;
    if (typeof v === 'string' && v.trim() !== '') {
      const cleaned = v.replace(/[^0-9.eE+\-]/g, '');
      const n = Number(cleaned);
      return isFinite(n) ? n : null;
    }
    return null;
  };
  const __toDate = (v) => {
    if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
    if (typeof v === 'number') { const d = new Date(v); return isNaN(d.getTime()) ? null : d; }
    if (typeof v === 'string' && v.trim() !== '') { const d = new Date(v); return isNaN(d.getTime()) ? null : d; }
    return null;
  };
  const __dateOpts = (f) => f === 'short' ? { dateStyle: 'short' } : f === 'medium' ? { dateStyle: 'medium' } : f === 'long' ? { dateStyle: 'long' } : null;
  const __formatRelative = (d, locale) => {
    const diff = d.getTime() - Date.now();
    const RTF = Intl && Intl.RelativeTimeFormat;
    if (typeof RTF !== 'function') return new Intl.DateTimeFormat(locale, { dateStyle: 'short' }).format(d);
    const rtf = new RTF(locale, { numeric: 'auto' });
    const abs = Math.abs(diff);
    if (abs < 60000) return rtf.format(Math.round(diff / 1000), 'second');
    if (abs < 3600000) return rtf.format(Math.round(diff / 60000), 'minute');
    if (abs < 86400000) return rtf.format(Math.round(diff / 3600000), 'hour');
    return rtf.format(Math.round(diff / 86400000), 'day');
  };
  const __formatCustomDate = (d, fmt) => {
    const pad = (n) => String(n).padStart(2, '0');
    return String(fmt)
      .replace(/YYYY/g, String(d.getFullYear()))
      .replace(/MM/g, pad(d.getMonth() + 1))
      .replace(/DD/g, pad(d.getDate()))
      .replace(/HH/g, pad(d.getHours()))
      .replace(/mm/g, pad(d.getMinutes()))
      .replace(/ss/g, pad(d.getSeconds()));
  };
  const __readRowField = (row, path) => {
    if (!path) return undefined;
    let cur = row;
    for (const key of String(path).split('.')) {
      if (cur == null || typeof cur !== 'object') return undefined;
      cur = cur[key];
    }
    return cur;
  };
  const __rowNumber = (v) => {
    if (v === null || v === undefined || v === '') return null;
    const n = typeof v === 'number' ? v : Number(v);
    return isFinite(n) ? n : null;
  };
  const __rowDate = (v) => {
    if (typeof v === 'string') {
      const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v.trim());
      if (m) return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
    }
    return __toDate(v);
  };
  const __rowLabel = (raw, format, withYear, locale) => {
    if (raw === null || raw === undefined) return '';
    if (format === 'date') {
      const d = __rowDate(raw);
      if (d) {
        try {
          return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: withYear ? 'numeric' : undefined, timeZone: 'UTC' }).format(d);
        } catch (_e) {
          return d.toISOString().slice(0, 10);
        }
      }
    }
    return String(raw);
  };
  const __mapRows = (value, step) => {
    if (!Array.isArray(value)) return value;
    const numbers = value.map((row) => __rowNumber(__readRowField(row, step.valueField)));
    let base = null;
    if (step.valueMode === 'changeFromFirst') {
      for (const n of numbers) { if (n !== null && n !== 0) { base = n; break; } }
    }
    return value.map((row, i) => {
      let v = numbers[i];
      if (step.valueMode === 'changeFromFirst' && v !== null) v = base === null ? 0 : (v / base - 1) * 100;
      const raw = __readRowField(row, step.labelField);
      const label = __rowLabel(raw, step.labelFormat, false, step.locale);
      const tooltipLabel = __rowLabel(raw, step.labelFormat, true, step.locale);
      return tooltipLabel !== label ? { value: v, label: label, tooltipLabel: tooltipLabel } : { value: v, label: label };
    });
  };
  const __applyStep = (value, step, prev) => {
    switch (step.type) {
      case 'format-currency': {
        const num = __toNumber(value);
        if (num == null) return value == null ? '' : String(value);
        return new Intl.NumberFormat(step.locale || 'en-US', {
          style: 'currency',
          currency: step.currency || 'USD',
          signDisplay: step.signDisplay || 'auto',
          minimumFractionDigits: step.minimumFractionDigits,
          maximumFractionDigits: step.maximumFractionDigits,
        }).format(num);
      }
      case 'format-date': {
        const d = __toDate(value);
        if (!d) return value == null ? '' : String(value);
        const locale = step.locale || 'en-US';
        if (step.format === 'relative') return __formatRelative(d, locale);
        const opts = __dateOpts(step.format);
        if (opts) return new Intl.DateTimeFormat(locale, opts).format(d);
        return __formatCustomDate(d, step.format);
      }
      case 'to-number': {
        // Stricter than __toNumber (which strips chars for currency): only a
        // wholly-numeric string converts, everything else passes through.
        if (typeof value === 'number') return value;
        if (typeof value !== 'string') return value;
        const t = value.trim();
        if (t === '') return value;
        const n = Number(t);
        return isFinite(n) ? n : value;
      }
      case 'map-icon':
      case 'map-color': {
        const key = value == null ? '' : String(value);
        const cmp = step.matchMode === 'ci' ? key.toLowerCase() : key;
        for (const c of (step.cases || [])) {
          const w = step.matchMode === 'ci' ? String(c.when).toLowerCase() : String(c.when);
          if (w === cmp) return c.then;
        }
        return step.default != null ? step.default : value;
      }
      case 'expression': {
        const r = __evalExpr(step.expr || '', { value: value, prev: prev });
        return r.ok ? r.value : value;
      }
      case 'map-rows':
        return __mapRows(value, step);
      default:
        return value;
    }
  };
  // ── Safe expression evaluator (mirrors src/lib/transforms/safeExpression.ts) ──
  // This is a line-for-line transcription of the Studio's runtime evaluator so
  // expressions produce byte-identical output across Canvas, Sandpack Preview,
  // and the exported Expo app. Do NOT replace with new Function — that path
  // diverges from the AST-based parser used by canvas and would break parity.
  const __fmt = {
    currency: (n, code, locale) => {
      const num = typeof n === 'number' ? n : Number(String(n == null ? '' : n).replace(/[^0-9.eE+\-]/g, ''));
      if (!isFinite(num)) return n == null ? '' : String(n);
      try { return new Intl.NumberFormat(locale || 'en-US', { style: 'currency', currency: code || 'USD' }).format(num); }
      catch (_e) { return String(num); }
    },
    date: (v, style, locale) => {
      const d = v instanceof Date ? v : new Date(String(v == null ? '' : v));
      if (isNaN(d.getTime())) return v == null ? '' : String(v);
      try { return new Intl.DateTimeFormat(locale || 'en-US', { dateStyle: style || 'short' }).format(d); }
      catch (_e) { return d.toISOString().slice(0, 10); }
    },
    upper: (s) => s == null ? '' : String(s).toUpperCase(),
    lower: (s) => s == null ? '' : String(s).toLowerCase(),
    pad: (s, n, ch) => String(s == null ? '' : s).padStart(Math.max(0, n | 0), ch || '0'),
    round: (n, d) => { const x = Number(n); if (!isFinite(x)) return 0; const m = Math.pow(10, (d|0)); return Math.round(x * m) / m; },
  };
  const __EXPR_ROOTS = { value: true, prev: true, fmt: true };
  const __exprTokenize = (src) => {
    const out = []; let i = 0; const n = src.length;
    while (i < n) {
      const ch = src[i];
      if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') { i++; continue; }
      if (ch === "'" || ch === '"') {
        const q = ch; let s = ''; i++;
        while (i < n && src[i] !== q) {
          if (src[i] === '\\' && i + 1 < n) { const nx = src[++i]; s += nx === 'n' ? '\n' : nx === 't' ? '\t' : nx; i++; }
          else s += src[i++];
        }
        if (i >= n) throw new Error('Unterminated string');
        i++; out.push({ t: 'str', v: s }); continue;
      }
      if (ch === '`') {
        const parts = []; let buf = ''; i++;
        while (i < n && src[i] !== '`') {
          if (src[i] === '\\' && i + 1 < n) { const nx = src[++i]; buf += nx === 'n' ? '\n' : nx === 't' ? '\t' : nx; i++; continue; }
          if (src[i] === '$' && src[i + 1] === '{') {
            if (buf) { parts.push({ kind: 'str', v: buf }); buf = ''; }
            i += 2; let depth = 1; let inner = '';
            while (i < n && depth > 0) {
              if (src[i] === '{') depth++;
              else if (src[i] === '}') { depth--; if (depth === 0) break; }
              inner += src[i++];
            }
            if (depth !== 0) throw new Error('Unterminated template expression');
            i++; parts.push({ kind: 'expr', v: inner }); continue;
          }
          buf += src[i++];
        }
        if (i >= n) throw new Error('Unterminated template literal');
        i++; if (buf) parts.push({ kind: 'str', v: buf });
        out.push({ t: 'tmpl', parts }); continue;
      }
      if ((ch >= '0' && ch <= '9') || (ch === '.' && src[i + 1] >= '0' && src[i + 1] <= '9')) {
        let s = '';
        while (i < n && /[0-9.eE+\-]/.test(src[i])) {
          if ((src[i] === '+' || src[i] === '-') && !/[eE]/.test(src[i - 1])) break;
          s += src[i++];
        }
        const v = Number(s); if (!isFinite(v)) throw new Error('Invalid number');
        out.push({ t: 'num', v }); continue;
      }
      if (/[A-Za-z_$]/.test(ch)) {
        let s = '';
        while (i < n && /[A-Za-z0-9_$]/.test(src[i])) s += src[i++];
        out.push({ t: 'id', v: s }); continue;
      }
      const three = src.slice(i, i + 3);
      if (three === '===' || three === '!==') { out.push({ t: 'punc', v: three }); i += 3; continue; }
      const two = src.slice(i, i + 2);
      if (['==','!=','>=','<=','&&','||'].indexOf(two) >= 0) { out.push({ t: 'punc', v: two }); i += 2; continue; }
      if ('+-*/%(),.[]?:!<>'.indexOf(ch) >= 0) { out.push({ t: 'punc', v: ch }); i++; continue; }
      throw new Error('Unexpected character: ' + ch);
    }
    return out;
  };
  const __exprParse = (toks) => {
    let i = 0;
    const peek = (o) => toks[i + (o || 0)];
    const eat = () => toks[i++];
    const expect = (v) => { const t = eat(); if (!t || t.t !== 'punc' || t.v !== v) throw new Error("Expected '" + v + "'"); };
    const parseExpr = () => parseTernary();
    const parseTernary = () => {
      const test = parseOr();
      const t = peek();
      if (t && t.t === 'punc' && t.v === '?') { eat(); const c = parseTernary(); expect(':'); const a = parseTernary(); return { k:'cond', test, cons:c, alt:a }; }
      return test;
    };
    const parseOr = () => { let l = parseAnd(); while (peek() && peek().t==='punc' && peek().v==='||'){eat();l={k:'bin',op:'||',l,r:parseAnd()};} return l; };
    const parseAnd = () => { let l = parseEq(); while (peek() && peek().t==='punc' && peek().v==='&&'){eat();l={k:'bin',op:'&&',l,r:parseEq()};} return l; };
    const parseEq = () => { let l = parseCmp(); while (peek() && peek().t==='punc' && ['==','!=','===','!=='].indexOf(peek().v)>=0){const op=eat().v;l={k:'bin',op,l,r:parseCmp()};} return l; };
    const parseCmp = () => { let l = parseAdd(); while (peek() && peek().t==='punc' && ['<','>','<=','>='].indexOf(peek().v)>=0){const op=eat().v;l={k:'bin',op,l,r:parseAdd()};} return l; };
    const parseAdd = () => { let l = parseMul(); while (peek() && peek().t==='punc' && ['+','-'].indexOf(peek().v)>=0){const op=eat().v;l={k:'bin',op,l,r:parseMul()};} return l; };
    const parseMul = () => { let l = parseUnary(); while (peek() && peek().t==='punc' && ['*','/','%'].indexOf(peek().v)>=0){const op=eat().v;l={k:'bin',op,l,r:parseUnary()};} return l; };
    const parseUnary = () => { const t = peek(); if (t && t.t==='punc' && (t.v==='!'||t.v==='-'||t.v==='+')){eat(); return {k:'unary',op:t.v,arg:parseUnary()};} return parsePostfix(); };
    const parsePostfix = () => {
      let node = parsePrimary();
      for(;;){ const t = peek(); if (!t) break;
        if (t.t==='punc' && t.v==='.'){eat();const id=eat();if(!id||id.t!=='id')throw new Error('prop');node={k:'mem',obj:node,prop:id.v};}
        else if (t.t==='punc' && t.v==='['){eat();const idx=parseExpr();expect(']');node={k:'idx',obj:node,idx};}
        else if (t.t==='punc' && t.v==='('){eat();const args=[];if(!(peek()&&peek().t==='punc'&&peek().v===')')){args.push(parseExpr());while(peek()&&peek().t==='punc'&&peek().v===','){eat();args.push(parseExpr());}}expect(')');node={k:'call',callee:node,args};}
        else break;
      } return node;
    };
    const parsePrimary = () => {
      const t = eat(); if (!t) throw new Error('EOF');
      if (t.t==='num') return {k:'num',v:t.v};
      if (t.t==='str') return {k:'str',v:t.v};
      if (t.t==='tmpl') return {k:'tmpl',parts:t.parts.map((p)=>p.kind==='str'?{kind:'str',v:p.v}:{kind:'expr',v:__exprParse(__exprTokenize(p.v))})};
      if (t.t==='id'){if(t.v==='true')return{k:'bool',v:true};if(t.v==='false')return{k:'bool',v:false};if(t.v==='null')return{k:'null'};if(t.v==='undefined')return{k:'undef'};return{k:'id',v:t.v};}
      if (t.t==='punc' && t.v==='('){const n=parseExpr();expect(')');return n;}
      throw new Error('Unexpected token');
    };
    const ast = parseExpr();
    if (i !== toks.length) throw new Error('Trailing input');
    return ast;
  };
  const __exprEval = (node, ctx) => {
    switch (node.k) {
      case 'num': case 'str': case 'bool': return node.v;
      case 'null': return null;
      case 'undef': return undefined;
      case 'id': {
        if (!__EXPR_ROOTS[node.v]) throw new Error("Identifier '" + node.v + "' not allowed");
        if (node.v === 'value') return ctx.value;
        if (node.v === 'prev') return ctx.prev;
        if (node.v === 'fmt') return __fmt;
        return undefined;
      }
      case 'tmpl': { let o=''; for(const p of node.parts){ o += p.kind==='str'?p.v:(__exprEval(p.v,ctx)==null?'':String(__exprEval(p.v,ctx))); } return o; }
      case 'mem': { const obj=__exprEval(node.obj,ctx); return obj==null?undefined:obj[node.prop]; }
      case 'idx': { const obj=__exprEval(node.obj,ctx); const key=__exprEval(node.idx,ctx); return obj==null?undefined:obj[key]; }
      case 'call': {
        const callee = __exprEval(node.callee, ctx);
        if (typeof callee !== 'function') throw new Error('Not a function');
        let thisArg = undefined;
        if (node.callee.k === 'mem' || node.callee.k === 'idx') thisArg = __exprEval(node.callee.obj, ctx);
        return callee.apply(thisArg, node.args.map((a) => __exprEval(a, ctx)));
      }
      case 'unary': { const v=__exprEval(node.arg,ctx); return node.op==='!'?!v:node.op==='-'?-v:+v; }
      case 'bin': {
        const op=node.op;
        if (op==='&&') return __exprEval(node.l,ctx) && __exprEval(node.r,ctx);
        if (op==='||') return __exprEval(node.l,ctx) || __exprEval(node.r,ctx);
        const a=__exprEval(node.l,ctx), b=__exprEval(node.r,ctx);
        switch(op){case '+':return a+b;case '-':return a-b;case '*':return a*b;case '/':return a/b;case '%':return a%b;case '==':return a==b;case '!=':return a!=b;case '===':return a===b;case '!==':return a!==b;case '<':return a<b;case '>':return a>b;case '<=':return a<=b;case '>=':return a>=b;}
        throw new Error('op');
      }
      case 'cond': return __exprEval(node.test,ctx) ? __exprEval(node.cons,ctx) : __exprEval(node.alt,ctx);
    }
  };
  const __evalExpr = (src, ctx) => {
    try {
      const s = String(src || '');
      if (!s.trim()) return { ok: true, value: ctx.value };
      const ast = __exprParse(__exprTokenize(s));
      return { ok: true, value: __exprEval(ast, ctx) };
    } catch (e) {
      return { ok: false, error: (e && e.message) || 'Eval error' };
    }
  };
  const __applyTransforms = (value, steps) => {
    if (!steps || steps.length === 0) return value;
    let v = value;
    let prev = value;
    for (const step of steps) {
      try { v = __applyStep(v, step, prev); } catch (_e) {}
      prev = v;
    }
    return v;
  };

  const [apiDataData, setApiDataData] = useState(null);
  const [apiDataDataLoading, setApiDataDataLoading] = useState(false);
  const [apiDataDataError, setApiDataDataError] = useState(null);

  const fetchApiDataData = () => {
    setApiDataDataLoading(true);
    setApiDataDataError(null);
    fetch(interpolateVars('https://jsonplaceholder.typicode.com/photos'), { method: 'GET' })
      .then(res => { if (!res.ok) throw new Error('HTTP ' + res.status); return res.json(); })
      .then(json => { setApiDataData(json); setApiDataDataLoading(false); })
      .catch(err => {
        console.warn('[Preview] api fetch failed:', err && err.message ? err.message : err);
        setApiDataDataError(err && err.message ? err.message : String(err));
        setApiDataDataLoading(false);
      });
  };

  useEffect(() => { fetchApiDataData(); }, []);

  return (
    <View testID="383b3cb3-3827-4477-8095-47eb57f9a3bb" style={[styles.node_383b3cb3_3827_4477_8095_47eb57f9a3bb, { flexDirection: "row", alignItems: "stretch", minHeight: 50, backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.08)', paddingBottom: systemInsets.bottom, paddingLeft: systemInsets.left, paddingRight: systemInsets.right }]}>
          {systemNav.items.map((navItem) => (
          <TouchableOpacity testID="718220a6-95ec-4c24-b2be-82d54c6d2988" key={navItem.pageId} onPress={navItem.onPress} activeOpacity={0.7} accessibilityRole="tab" accessibilityState={{ selected: navItem.active }} style={[styles.node_718220a6_95ec_4c24_b2be_82d54c6d2988, { flex: 1, flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2 }]}>
                  <View testID="5ef336a3-9b0a-430d-8589-3a4ac5cae402" accessible={true} accessibilityRole="image" style={[{ width: 20, height: 20, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' }, { "color": (String(navItem.active) === String("true") ? "$Primary" : "rgba(0,0,0,0.4)") }]}><LucideDynamic name={navItem.icon} size={20} color={(((String(navItem.active) === String("true") ? "$Primary" : "rgba(0,0,0,0.4)")) || '#9CA3AF')} strokeWidth={2} /></View>
                  <Text testID="19d88bab-7e40-45ef-a3b6-67c3890762b2" style={[styles.node_19d88bab_7e40_45ef_a3b6_67c3890762b2, { "color": (String(navItem.active) === String("true") ? "$Primary" : "rgba(0,0,0,0.4)") }]} numberOfLines={1}>{(() => { const __v = (navItem.label); return (__v == null || typeof __v === 'object') ? '' : String(__v); })()}</Text>
          </TouchableOpacity>
          ))}
    </View>
  );
}

const styles = StyleSheet.create({
  node_718220a6_95ec_4c24_b2be_82d54c6d2988: {
    flexDirection: 'column',
    gap: 2,
  },
  node_19d88bab_7e40_45ef_a3b6_67c3890762b2: {
    fontSize: 10,
  },
});

