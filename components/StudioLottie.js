import React from 'react';
import { View, Text, Image, Pressable, AppState, Dimensions } from 'react-native';

let LottieView = null;
let lottieLoadError = null;
try {
  const mod = require('lottie-react-native');
  const candidate = mod && (mod.default || mod);
  // Never render an unvalidated module export as a component.
  if (typeof candidate === 'function' || (candidate && typeof candidate === 'object' && candidate.$$typeof)) {
    LottieView = candidate;
  } else {
    lottieLoadError = new Error('lottie-react-native did not export a component');
  }
} catch (e) {
  lottieLoadError = e;
}

function isPlayableSource(value) {
  if (typeof value !== 'string') return false;
  const s = value.trim();
  if (!s) return false;
  if (s.indexOf('data:') === 0) return true;
  if (!/^(https?:)?\/\//i.test(s)) return false;
  const path = s.split(/[?#]/)[0].toLowerCase();
  if (/\.(png|jpe?g|gif|webp|svg|mp4|webm|mov|mp3|pdf)$/.test(path)) return false;
  return true;
}

function isDotLottie(value) {
  return typeof value === 'string' && value.split(/[?#]/)[0].toLowerCase().indexOf('.lottie') > -1;
}

function Fallback({ style, fallbackImage, resizeMode, label }) {
  if (fallbackImage) {
    return (
      <Image
        source={{ uri: fallbackImage }}
        resizeMode={resizeMode === 'cover' ? 'cover' : 'contain'}
        style={style}
      />
    );
  }
  return (
    <View style={[{ backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' }, style]}>
      <Text style={{ color: '#64748B', fontSize: 12 }}>{label || 'Animation'}</Text>
    </View>
  );
}

/** Swaps to the fallback when the native player throws while mounting. */
class LottieBoundary extends React.Component {
  constructor(props) { super(props); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error) { if (this.props.onFailure) this.props.onFailure(error); }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

// JSON documents are fetched once and shared across every instance that uses
// the same URL, so a list of identical animations downloads a single time.
const jsonCache = {};

function useAnimationSource(source) {
  const [state, setState] = React.useState(function () {
    if (!isPlayableSource(source)) return { status: 'invalid', value: null };
    if (isDotLottie(source)) return { status: 'ready', value: { uri: source } };
    if (jsonCache[source]) return { status: 'ready', value: jsonCache[source] };
    return { status: 'loading', value: null };
  });

  React.useEffect(function () {
    let cancelled = false;
    if (!isPlayableSource(source)) { setState({ status: 'invalid', value: null }); return undefined; }
    // dotLottie archives are unzipped by the native player itself — hand it the
    // URI rather than trying to parse the binary in JS.
    if (isDotLottie(source)) { setState({ status: 'ready', value: { uri: source } }); return undefined; }
    if (jsonCache[source]) { setState({ status: 'ready', value: jsonCache[source] }); return undefined; }
    setState({ status: 'loading', value: null });
    fetch(source)
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (json) {
        // A Lottie document always carries layers; anything else is not one.
        if (!json || typeof json !== 'object' || !json.layers) throw new Error('Not a Lottie animation');
        jsonCache[source] = json;
        if (!cancelled) setState({ status: 'ready', value: json });
      })
      .catch(function (err) {
        if (!cancelled) setState({ status: 'error', value: null, error: err });
      });
    return function () { cancelled = true; };
  }, [source]);

  return state;
}

export default function StudioLottie(props) {
  const {
    source, fallbackImage, style, resizeMode, loop, autoplay, speed, direction,
    playOn, placeholderLabel, onLoad, onError, onPlay, onLoopComplete, onComplete, onPress,
  } = props;

  const animation = useAnimationSource(source);
  const [failed, setFailed] = React.useState(false);
  const [visible, setVisible] = React.useState(playOn !== 'visible');
  const [pressPlaying, setPressPlaying] = React.useState(false);
  const [appActive, setAppActive] = React.useState(true);
  const viewRef = React.useRef(null);
  const notifiedLoad = React.useRef(false);

  // Battery guard: never animate while the app is backgrounded.
  React.useEffect(function () {
    const sub = AppState.addEventListener('change', function (next) { setAppActive(next === 'active'); });
    return function () { try { sub && sub.remove && sub.remove(); } catch (e) {} };
  }, []);

  // Native viewport visibility for the scroll-into-view trigger. Measured on an
  // interval because RN has no IntersectionObserver.
  React.useEffect(function () {
    if (playOn !== 'visible') { setVisible(true); return undefined; }
    let alive = true;
    const measure = function () {
      const node = viewRef.current;
      if (!node || !node.measureInWindow) return;
      node.measureInWindow(function (x, y, width, height) {
        if (!alive) return;
        const screen = Dimensions.get('window');
        const onScreen = height > 0 && y < screen.height && y + height > 0 && width > 0 && x < screen.width && x + width > 0;
        setVisible(function (prev) { return prev === onScreen ? prev : onScreen; });
      });
    };
    measure();
    const id = setInterval(measure, 350);
    return function () { alive = false; clearInterval(id); };
  }, [playOn]);

  React.useEffect(function () {
    if (animation.status === 'ready' && !notifiedLoad.current) {
      notifiedLoad.current = true;
      if (onLoad) onLoad();
    }
    if (animation.status === 'error' && onError) onError(animation.error);
  }, [animation.status, onLoad, onError]);

  const ready = animation.status === 'ready' && !failed && !!LottieView;
  const shouldPlay =
    ready &&
    appActive &&
    (playOn === 'always'
      ? autoplay !== false
      : playOn === 'visible'
        ? visible
        : pressPlaying);

  // Declared before any early return so the hook order stays stable.
  React.useEffect(function () {
    if (shouldPlay && onPlay) onPlay();
  }, [shouldPlay]);

  const fallbackTree = (
    <Fallback
      style={style}
      fallbackImage={fallbackImage}
      resizeMode={resizeMode}
      label={animation.status === 'invalid' && source ? 'Invalid animation URL' : placeholderLabel}
    />
  );

  if (!ready) {
    const tile = fallbackTree;
    return onPress ? <Pressable onPress={onPress} style={style}>{tile}</Pressable> : tile;
  }

  const player = (
    <LottieView
      source={animation.value}
      autoPlay={shouldPlay}
      loop={loop !== false}
      speed={(speed || 1) * (direction === -1 ? -1 : 1)}
      resizeMode={resizeMode || 'contain'}
      style={{ width: '100%', height: '100%' }}
      onAnimationLoop={function () { if (onLoopComplete) onLoopComplete(); }}
      onAnimationFinish={function () {
        setPressPlaying(false);
        if (onComplete) onComplete();
      }}
      onAnimationFailure={function (err) { setFailed(true); if (onError) onError(err); }}
    />
  );


  const body = (
    <View ref={viewRef} style={style} collapsable={false}>
      <LottieBoundary fallback={fallbackTree} onFailure={function () { setFailed(true); }}>
        {player}
      </LottieBoundary>
    </View>
  );

  if (playOn === 'press' || onPress) {
    return (
      <Pressable
        onPress={function () {
          if (playOn === 'press') setPressPlaying(true);
          if (onPress) onPress();
        }}
      >
        {body}
      </Pressable>
    );
  }
  return body;
}
