import React from 'react';
import { View, ScrollView, Text, Platform, TouchableOpacity, Dimensions } from 'react-native';

// A truthy module export is NOT automatically a renderable component. Metro /
// Snack interop can hand back a namespace object, which React rejects with
// "Element type is invalid ... but got: object" and takes the whole screen
// down. Validate the candidate before we ever put it in JSX.
function isRenderableComponent(c) {
  if (!c) return false;
  if (typeof c === 'function') return true;
  if (typeof c === 'object' && c.$$typeof) {
    const tag = String(c.$$typeof);
    return tag.indexOf('memo') !== -1 || tag.indexOf('forward_ref') !== -1 || tag.indexOf('forwardRef') !== -1;
  }
  return false;
}

function resolveNativeCarousel() {
  if (Platform.OS === 'web') return null;
  try {
    // eslint-disable-next-line global-require
    const mod = require('react-native-reanimated-carousel');
    if (!mod) return null;
    const candidates = [
      mod.default && mod.default.default,
      mod.default,
      mod.Carousel,
      mod,
    ];
    for (let i = 0; i < candidates.length; i += 1) {
      if (isRenderableComponent(candidates[i])) return candidates[i];
    }
    return null;
  } catch (e) {
    return null;
  }
}

const ReanimatedCarousel = resolveNativeCarousel();

// Last line of defence: if the native engine throws while mounting, swap to
// the in-house ScrollView engine instead of red-screening the page.
class CarouselEngineBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error) {
    if (typeof console !== 'undefined' && console.warn) {
      console.warn('[StudioCarousel] native engine failed, using fallback:', error && error.message);
    }
  }
  render() {
    if (this.state.failed) return this.props.fallback;
    return this.props.children;
  }
}

const NATIVE_MODES = { parallax: 'parallax', stack: 'horizontal-stack', tinder: 'vertical-stack' };

function Pagination(props) {
  const { count, index, kind, dotColor, activeDotColor, dotSize, dotSpacing, onDotPress } = props;
  if (kind === 'none' || count < 1) return null;
  if (kind === 'numbers') {
    return (
      <View style={{ flexDirection: 'row', justifyContent: 'center', paddingVertical: 6 }}>
        <Text style={{ fontSize: 12, color: activeDotColor }}>{(index + 1) + ' / ' + count}</Text>
      </View>
    );
  }
  const items = [];
  for (let i = 0; i < count; i += 1) {
    const active = i === index;
    const w = kind === 'bars' ? dotSize * (active ? 3 : 2) : dotSize;
    items.push(
      <TouchableOpacity
        key={'dot-' + i}
        activeOpacity={0.7}
        onPress={() => onDotPress && onDotPress(i)}
        style={{
          width: w,
          height: dotSize,
          borderRadius: kind === 'bars' ? dotSize / 2 : dotSize,
          marginHorizontal: dotSpacing / 2,
          backgroundColor: active ? activeDotColor : dotColor,
        }}
      />
    );
  }
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 6 }}>
      {items}
    </View>
  );
}

export default function StudioCarousel(props) {
  const {
    direction = 'horizontal',
    mode = 'default',
    loop = false,
    autoPlay = false,
    autoPlayInterval = 3000,
    snapEnabled = true,
    gesturesEnabled = true,
    defaultIndex = 0,
    itemWidthPct = 100,
    slideGap = 0,
    slideHeight = 200,
    slideStyle,
    containerWidth,
    pagination = 'dots',
    paginationPosition = 'inside',
    dotColor = 'rgba(0,0,0,0.25)',
    activeDotColor = '#0077E6',
    dotSize = 8,
    dotSpacing = 6,
    showArrows = false,
    arrowColor = '#FFFFFF',
    arrowSize = 20,
    inactiveScale = 1,
    inactiveOpacity = 1,
    style,
    onSlideChange,
    onSlideTap,
    onSnapEnd,
    onScrollStart,
    onScrollEnd,
    onAutoplayStart,
    onAutoplayStop,
    onLoop,
    selectedIndices = [],
    selectedBg,
    children,
  } = props;

  const slides = React.Children.toArray(children).filter(Boolean);
  const count = slides.length;
  const vertical = direction === 'vertical';
  const [index, setIndex] = React.useState(Math.min(Math.max(defaultIndex, 0), Math.max(count - 1, 0)));
  const [measured, setMeasured] = React.useState(containerWidth || Dimensions.get('window').width);
  const scrollRef = React.useRef(null);
  const indexRef = React.useRef(index);
  const timerRef = React.useRef(null);

  const track = vertical ? slideHeight : Math.max(1, Math.round((measured * itemWidthPct) / 100));
  const interval = track + slideGap;

  const emitChange = React.useCallback((next) => {
    if (next === indexRef.current) return;
    if (loop && count > 1 && ((indexRef.current === count - 1 && next === 0) || (indexRef.current === 0 && next === count - 1))) {
      onLoop && onLoop(next);
    }
    indexRef.current = next;
    setIndex(next);
    onSlideChange && onSlideChange(next);
  }, [count, loop, onLoop, onSlideChange]);

  const scrollTo = React.useCallback((next) => {
    const target = Math.max(0, Math.min(next, count - 1));
    if (scrollRef.current && scrollRef.current.scrollTo) {
      scrollRef.current.scrollTo(vertical ? { y: target * interval, animated: true } : { x: target * interval, animated: true });
    }
    emitChange(target);
  }, [count, emitChange, interval, vertical]);

  // Autoplay — shared by both engines.
  React.useEffect(() => {
    if (!autoPlay || count < 2) return undefined;
    onAutoplayStart && onAutoplayStart();
    timerRef.current = setInterval(() => {
      const next = indexRef.current + 1;
      if (next >= count) {
        if (!loop) { clearInterval(timerRef.current); onAutoplayStop && onAutoplayStop(); return; }
        scrollTo(0);
      } else {
        scrollTo(next);
      }
    }, Math.max(500, autoPlayInterval));
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      onAutoplayStop && onAutoplayStop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay, autoPlayInterval, count, loop, interval, measured]);

  const renderSlide = (child, i) => {
    const active = i === index;
    const dims = vertical ? { height: track, width: '100%' } : { width: track, height: slideHeight };
    return (
      <TouchableOpacity
        key={'slide-' + i}
        activeOpacity={onSlideTap ? 0.85 : 1}
        onPress={() => onSlideTap && onSlideTap(i)}
        style={[
          dims,
          {
            marginRight: !vertical && i < count - 1 ? slideGap : 0,
            marginBottom: vertical && i < count - 1 ? slideGap : 0,
            transform: [{ scale: active ? 1 : inactiveScale }],
            opacity: active ? 1 : inactiveOpacity,
            overflow: 'hidden',
          },
          slideStyle,
          (selectedIndices.includes(i) && selectedBg) ? { backgroundColor: selectedBg } : null,
        ]}
      >
        {child}
      </TouchableOpacity>
    );
  };

  const paginationNode = (
    <Pagination
      count={count}
      index={index}
      kind={pagination}
      dotColor={dotColor}
      activeDotColor={activeDotColor}
      dotSize={dotSize}
      dotSpacing={dotSpacing}
      onDotPress={scrollTo}
    />
  );

  const arrows = showArrows && count > 1 ? (
    <React.Fragment>
      <TouchableOpacity
        onPress={() => scrollTo(index - 1 < 0 ? (loop ? count - 1 : 0) : index - 1)}
        style={{ position: 'absolute', left: 8, top: '50%', marginTop: -arrowSize, width: arrowSize * 2, height: arrowSize * 2, borderRadius: arrowSize, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' }}
      >
        <Text style={{ color: arrowColor, fontSize: arrowSize }}>{'\u2039'}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => scrollTo(index + 1 >= count ? (loop ? 0 : count - 1) : index + 1)}
        style={{ position: 'absolute', right: 8, top: '50%', marginTop: -arrowSize, width: arrowSize * 2, height: arrowSize * 2, borderRadius: arrowSize, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' }}
      >
        <Text style={{ color: arrowColor, fontSize: arrowSize }}>{'\u203a'}</Text>
      </TouchableOpacity>
    </React.Fragment>
  ) : null;

  const onLayout = (e) => {
    const w = e.nativeEvent.layout.width;
    if (w && Math.abs(w - measured) > 1) setMeasured(w);
  };

  // ── Native engine (real library) ──────────────────────────────────
  // ── Fallback engine (web preview / no Reanimated) ─────────────────
  const onMomentumEnd = (e) => {
    const offset = vertical ? e.nativeEvent.contentOffset.y : e.nativeEvent.contentOffset.x;
    const next = Math.max(0, Math.min(Math.round(offset / Math.max(1, interval)), count - 1));
    emitChange(next);
    onSnapEnd && onSnapEnd(next);
    onScrollEnd && onScrollEnd(next);
  };

  const fallbackTree = (
    <View style={[{ width: '100%' }, style]} onLayout={onLayout}>
      <ScrollView
        ref={scrollRef}
        horizontal={!vertical}
        scrollEnabled={gesturesEnabled}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        pagingEnabled={snapEnabled && itemWidthPct >= 100 && slideGap === 0}
        snapToInterval={snapEnabled ? interval : undefined}
        decelerationRate="fast"
        onScrollBeginDrag={() => onScrollStart && onScrollStart(indexRef.current)}
        onMomentumScrollEnd={onMomentumEnd}
        onScrollEndDrag={onMomentumEnd}
        style={vertical ? { height: slideHeight } : undefined}
        contentContainerStyle={vertical ? undefined : { flexDirection: 'row' }}
      >
        {slides.map(renderSlide)}
      </ScrollView>
      {paginationPosition === 'inside' ? (
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>{paginationNode}</View>
      ) : paginationNode}
      {arrows}
    </View>
  );

  if (isRenderableComponent(ReanimatedCarousel) && count > 0) {
    const nativeMode = NATIVE_MODES[mode];
    return (
      <CarouselEngineBoundary fallback={fallbackTree}>
      <View style={[{ width: '100%' }, style]} onLayout={onLayout}>
        <ReanimatedCarousel
          vertical={vertical}
          width={vertical ? measured : track}
          height={slideHeight}
          style={{ width: '100%' }}
          data={slides.map((_, i) => i)}
          loop={loop}
          autoPlay={autoPlay}
          autoPlayInterval={Math.max(500, autoPlayInterval)}
          snapEnabled={snapEnabled}
          enabled={gesturesEnabled}
          defaultIndex={Math.min(Math.max(defaultIndex, 0), Math.max(count - 1, 0))}
          mode={nativeMode}
          onSnapToItem={(i) => { emitChange(i); onSnapEnd && onSnapEnd(i); }}
          onScrollStart={() => onScrollStart && onScrollStart(indexRef.current)}
          onScrollEnd={() => onScrollEnd && onScrollEnd(indexRef.current)}
          renderItem={({ index: i }) => (
            <TouchableOpacity
              activeOpacity={onSlideTap ? 0.85 : 1}
              onPress={() => onSlideTap && onSlideTap(i)}
              style={[{ flex: 1, overflow: 'hidden' }, slideStyle, (selectedIndices.includes(i) && selectedBg) ? { backgroundColor: selectedBg } : null]}
            >
              {slides[i]}
            </TouchableOpacity>
          )}
        />
        {paginationPosition === 'inside' ? (
          <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>{paginationNode}</View>
        ) : paginationNode}
        {arrows}
      </View>
      </CarouselEngineBoundary>
    );
  }

  return fallbackTree;
}
