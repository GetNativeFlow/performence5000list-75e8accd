import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, ActivityIndicator, StyleSheet, Platform } from 'react-native';

const DEFAULT_TYPE = 'CircularProgress';
const DEFAULT_COLOR = '#4B39EF';
const DEFAULT_SIZE = 50;

const isWeb = Platform.OS === 'web';

/* ===== CSS keyframes injected once on web ===== */
const KEYFRAMES_ID = '__studio_spinner_kf__';
function injectKeyframes() {
  if (!isWeb) return;
  if (typeof document === 'undefined') return;
  if (document.getElementById(KEYFRAMES_ID)) return;
  const style = document.createElement('style');
  style.id = KEYFRAMES_ID;
  style.textContent = `
    @keyframes ss-rotate { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    @keyframes ss-pulse { 0%,100% { transform: scale(0.6); opacity: 0.4; } 50% { transform: scale(1); opacity: 1; } }
    @keyframes ss-bounce { 0%,100% { transform: scale(0); } 50% { transform: scale(1); } }
    @keyframes ss-three-a { 0%,80%,100% { transform: scale(0.4); } 40% { transform: scale(1); } }
    @keyframes ss-wave { 0%,40%,100% { transform: scaleY(0.4); } 20% { transform: scaleY(1); } }
    @keyframes ss-fade { 0%,100% { opacity: 0.15; } 50% { opacity: 1; } }
    @keyframes ss-linear { 0% { left: -40%; } 100% { left: 100%; } }
    @keyframes ss-cube-grid { 0%,70%,100% { transform: scale3d(1,1,1); } 35% { transform: scale3d(0,0,1); } }
    @keyframes ss-fold { 0%,10% { transform: perspective(140px) rotateX(-180deg); opacity:0; } 25%,75% { transform: perspective(140px) rotateX(0deg); opacity:1; } 90%,100% { transform: perspective(140px) rotateY(180deg); opacity:0; } }
    @keyframes ss-wander { 0% { transform: translate(0,0) rotate(0deg); } 25% { transform: translate(100%,0) rotate(90deg) scale(0.6); } 50% { transform: translate(100%,100%) rotate(180deg); } 75% { transform: translate(0,100%) rotate(270deg) scale(0.6); } 100% { transform: translate(0,0) rotate(360deg); } }
  `;
  document.head.appendChild(style);
}

/* ===== Native Animated helpers ===== */
function useLoop(duration, easing) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (isWeb) return;
    anim.setValue(0);
    const loop = Animated.loop(
      Animated.timing(anim, { toValue: 1, duration, easing: easing || Easing.inOut(Easing.ease), useNativeDriver: true }),
      { resetBeforeIteration: true }
    );
    loop.start();
    return () => loop.stop();
  }, []);
  return anim;
}

function useStaggeredLoops(count, duration, staggerMs) {
  const anims = useRef(Array.from({ length: count }, () => new Animated.Value(0))).current;
  useEffect(() => {
    if (isWeb) return;
    const loops = anims.map((a, i) => {
      a.setValue(0);
      return { anim: a, delay: i * staggerMs };
    });
    loops.forEach(({ anim: a, delay }) => {
      setTimeout(() => {
        Animated.loop(
          Animated.timing(a, { toValue: 1, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          { resetBeforeIteration: true }
        ).start();
      }, delay);
    });
    return () => anims.forEach(a => a.stopAnimation());
  }, []);
  return anims;
}

/* ===== Web CSS animation style helper ===== */
function webAnim(name, duration, easing, delay) {
  return isWeb ? {
    animationName: name,
    animationDuration: (duration || 1000) + 'ms',
    animationTimingFunction: easing || 'ease-in-out',
    animationIterationCount: 'infinite',
    animationDelay: (delay || 0) + 'ms',
  } : {};
}

/* ===== Spinner Implementations ===== */

function CircularSpinner({ size: SPINNER_SIZE, color: SPINNER_COLOR }) {
  injectKeyframes();
  const bw = Math.max(2, SPINNER_SIZE / 16);
  const anim = useLoop(800, Easing.linear);
  const nativeStyle = !isWeb ? {
    transform: [{ rotate: anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }],
  } : {};
  return (
    <Animated.View style={[{
      width: SPINNER_SIZE, height: SPINNER_SIZE, borderRadius: SPINNER_SIZE / 2,
      borderWidth: bw, borderColor: 'transparent', borderTopColor: SPINNER_COLOR, borderRightColor: SPINNER_COLOR,
    }, nativeStyle, webAnim('ss-rotate', 800, 'linear')]} />
  );
}

function PulseSpinner({ size: SPINNER_SIZE, color: SPINNER_COLOR }) {
  injectKeyframes();
  const anim = useLoop(1000);
  const nativeStyle = !isWeb ? {
    transform: [{ scale: anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.6, 1, 0.6] }) }],
    opacity: anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.4, 1, 0.4] }),
  } : {};
  return (
    <Animated.View style={[{
      width: SPINNER_SIZE, height: SPINNER_SIZE, borderRadius: SPINNER_SIZE / 2, backgroundColor: SPINNER_COLOR,
    }, nativeStyle, webAnim('ss-pulse', 1000)]} />
  );
}

function ThreeBounceSpinner({ size: SPINNER_SIZE, color: SPINNER_COLOR }) {
  injectKeyframes();
  const dot = SPINNER_SIZE / 3;
  const anims = useStaggeredLoops(3, 1400, 160);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      {[0, 1, 2].map((i) => {
        const nativeStyle = !isWeb ? {
          transform: [{ scale: anims[i].interpolate({ inputRange: [0, 0.4, 0.8, 1], outputRange: [0.4, 1, 0.4, 0.4] }) }],
        } : {};
        return (
          <Animated.View key={i} style={[{
            width: dot, height: dot, borderRadius: dot / 2, backgroundColor: SPINNER_COLOR,
          }, nativeStyle, webAnim('ss-three-a', 1400, 'ease-in-out', i * 160)]} />
        );
      })}
    </View>
  );
}

function DoubleBounceSpinner({ size: SPINNER_SIZE, color: SPINNER_COLOR }) {
  injectKeyframes();
  const anim1 = useLoop(2000);
  const anim2 = useLoop(2000);
  const base = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: SPINNER_SIZE / 2, backgroundColor: SPINNER_COLOR, opacity: 0.6 };
  return (
    <View style={{ width: SPINNER_SIZE, height: SPINNER_SIZE }}>
      <Animated.View style={[base, !isWeb ? { transform: [{ scale: anim1.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 1, 0] }) }] } : {}, webAnim('ss-bounce', 2000)]} />
      <Animated.View style={[base, !isWeb ? { transform: [{ scale: anim2.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0, 1] }) }] } : {}, webAnim('ss-bounce', 2000, 'ease-in-out', -1000)]} />
    </View>
  );
}

function RotatingSpinner({ size: SPINNER_SIZE, color: SPINNER_COLOR }) {
  injectKeyframes();
  const anim = useLoop(800, Easing.linear);
  const nativeStyle = !isWeb ? {
    transform: [{ rotate: anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }],
  } : {};
  return (
    <Animated.View style={[{
      width: SPINNER_SIZE, height: SPINNER_SIZE, borderRadius: SPINNER_SIZE / 2,
      borderWidth: 2, borderColor: 'transparent', borderTopColor: SPINNER_COLOR, borderRightColor: SPINNER_COLOR,
    }, nativeStyle, webAnim('ss-rotate', 800, 'linear')]} />
  );
}

function WaveSpinner({ size: SPINNER_SIZE, color: SPINNER_COLOR }) {
  injectKeyframes();
  const barW = Math.max(3, SPINNER_SIZE / 8);
  const anims = useStaggeredLoops(5, 1200, 100);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: SPINNER_SIZE }}>
      {[0, 1, 2, 3, 4].map((i) => {
        const nativeStyle = !isWeb ? {
          transform: [{ scaleY: anims[i].interpolate({ inputRange: [0, 0.2, 0.4, 1], outputRange: [0.4, 1, 0.4, 0.4] }) }],
        } : {};
        return (
          <Animated.View key={i} style={[{
            width: barW, height: SPINNER_SIZE * 0.8, backgroundColor: SPINNER_COLOR, borderRadius: 2,
          }, nativeStyle, webAnim('ss-wave', 1200, 'ease-in-out', -1200 + i * 100)]} />
        );
      })}
    </View>
  );
}

function LinearSpinner({ size: SPINNER_SIZE, color: SPINNER_COLOR }) {
  injectKeyframes();
  const anim = useLoop(1500);
  const trackW = SPINNER_SIZE * 2;
  const barW = trackW * 0.4;
  const nativeStyle = !isWeb ? {
    transform: [{ translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [-barW, trackW] }) }],
  } : {};
  return (
    <View style={{ width: trackW, height: 4, borderRadius: 2, backgroundColor: SPINNER_COLOR + '33', overflow: 'hidden', position: 'relative' }}>
      <Animated.View style={[{
        position: 'absolute', width: '40%', height: 4, borderRadius: 2, backgroundColor: SPINNER_COLOR, left: 0,
      }, nativeStyle, webAnim('ss-linear', 1500)]} />
    </View>
  );
}

function WanderingCubesSpinner({ size: SPINNER_SIZE, color: SPINNER_COLOR }) {
  injectKeyframes();
  const cubeSize = SPINNER_SIZE * 0.35;
  const travel = SPINNER_SIZE - cubeSize;
  const anim1 = useLoop(1800);
  const anim2 = useLoop(1800);
  function cubeNative(a, offset) {
    if (isWeb) return {};
    const p = offset ? a.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.5] }) : a;
    return {
      transform: [
        { translateX: p.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [0, travel, travel, 0, 0] }) },
        { translateY: p.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [0, 0, travel, travel, 0] }) },
        { rotate: p.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: ['0deg', '90deg', '180deg', '270deg', '360deg'] }) },
        { scale: p.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [1, 0.6, 1, 0.6, 1] }) },
      ],
    };
  }
  return (
    <View style={{ width: SPINNER_SIZE, height: SPINNER_SIZE, position: 'relative' }}>
      <Animated.View style={[{ position: 'absolute', width: cubeSize, height: cubeSize, backgroundColor: SPINNER_COLOR, borderRadius: 2 }, cubeNative(anim1, false), webAnim('ss-wander', 1800)]} />
      <Animated.View style={[{ position: 'absolute', width: cubeSize, height: cubeSize, backgroundColor: SPINNER_COLOR, borderRadius: 2 }, cubeNative(anim2, true), webAnim('ss-wander', 1800, 'ease-in-out', -900)]} />
    </View>
  );
}

function FadingGridSpinner({ count, size: SPINNER_SIZE, color: SPINNER_COLOR }) {
  injectKeyframes();
  const cols = count === 4 ? 2 : 3;
  const dur = count === 4 ? 1200 : 1300;
  const anims = useStaggeredLoops(count, dur, dur / count);
  const cellSize = (SPINNER_SIZE - (cols - 1) * 2) / cols;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', width: SPINNER_SIZE, gap: 2 }}>
      {Array.from({ length: count }).map((_, i) => {
        const nativeStyle = !isWeb ? {
          opacity: anims[i].interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.15, 1, 0.15] }),
        } : {};
        return (
          <Animated.View key={i} style={[{
            width: cellSize, height: cellSize, backgroundColor: SPINNER_COLOR, borderRadius: 2,
          }, nativeStyle, webAnim('ss-fade', dur, 'ease-in-out', i * (dur / count))]} />
        );
      })}
    </View>
  );
}

function ChasingDotsSpinner({ size: SPINNER_SIZE, color: SPINNER_COLOR }) {
  injectKeyframes();
  const dotS = SPINNER_SIZE * 0.4;
  const rotAnim = useLoop(2000, Easing.linear);
  const bounce1 = useLoop(2000);
  const bounce2 = useLoop(2000);
  const rotNative = !isWeb ? {
    transform: [{ rotate: rotAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }],
  } : {};
  return (
    <Animated.View style={[{ width: SPINNER_SIZE, height: SPINNER_SIZE, position: 'relative' }, rotNative, webAnim('ss-rotate', 2000, 'linear')]}>
      <Animated.View style={[{
        position: 'absolute', top: 0, left: 0, width: dotS, height: dotS, borderRadius: dotS / 2, backgroundColor: SPINNER_COLOR,
      }, !isWeb ? { transform: [{ scale: bounce1.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 1, 0] }) }] } : {}, webAnim('ss-bounce', 2000)]} />
      <Animated.View style={[{
        position: 'absolute', bottom: 0, right: 0, width: dotS, height: dotS, borderRadius: dotS / 2, backgroundColor: SPINNER_COLOR,
      }, !isWeb ? { transform: [{ scale: bounce2.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0, 1] }) }] } : {}, webAnim('ss-bounce', 2000, 'ease-in-out', -1000)]} />
    </Animated.View>
  );
}

function CircleFadeSpinner({ useRadialDots, size: SPINNER_SIZE, color: SPINNER_COLOR }) {
  injectKeyframes();
  const count = 12;
  const dur = 1200;
  const anims = useStaggeredLoops(count, dur, dur / count);
  if (useRadialDots) {
    const dotS = Math.max(3, SPINNER_SIZE / 8);
    const r = SPINNER_SIZE / 2 - dotS / 2;
    return (
      <View style={{ width: SPINNER_SIZE, height: SPINNER_SIZE, position: 'relative' }}>
        {Array.from({ length: count }).map((_, i) => {
          const angle = (i * 30 * Math.PI) / 180;
          const nativeStyle = !isWeb ? {
            opacity: anims[i].interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.15, 1, 0.15] }),
          } : {};
          return (
            <Animated.View key={i} style={[{
              position: 'absolute', width: dotS, height: dotS, borderRadius: dotS / 2, backgroundColor: SPINNER_COLOR,
              left: SPINNER_SIZE / 2 + r * Math.sin(angle) - dotS / 2,
              top: SPINNER_SIZE / 2 - r * Math.cos(angle) - dotS / 2,
            }, nativeStyle, webAnim('ss-fade', dur, 'linear', -dur + i * (dur / count))]} />
          );
        })}
      </View>
    );
  }
  // bars variant (Circle type)
  return (
    <View style={{ width: SPINNER_SIZE, height: SPINNER_SIZE, position: 'relative' }}>
      {Array.from({ length: count }).map((_, i) => {
        const nativeStyle = !isWeb ? {
          opacity: anims[i].interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.15, 1, 0.15] }),
        } : {};
        return (
          <Animated.View key={i} style={[{
            position: 'absolute', width: 3, height: SPINNER_SIZE * 0.25, backgroundColor: SPINNER_COLOR, borderRadius: 2,
            left: '50%', top: 0, transformOrigin: '50% ' + (SPINNER_SIZE / 2) + 'px',
            transform: [{ rotate: (i * 30) + 'deg' }, { translateX: -1.5 }],
          }, nativeStyle, webAnim('ss-fade', dur, 'linear', -dur + i * (dur / count))]} />
        );
      })}
    </View>
  );
}

function CubeGridSpinner({ size: SPINNER_SIZE, color: SPINNER_COLOR }) {
  injectKeyframes();
  const delays = [0.2, 0.3, 0.4, 0.1, 0.2, 0.3, 0, 0.1, 0.2];
  const dur = 1300;
  const anims = useStaggeredLoops(9, dur, 0);
  const cellSize = (SPINNER_SIZE - 4) / 3;
  // Start each with its own delay via the stagger approach — we re-trigger manually
  const animRefs = useRef([]);
  useEffect(() => {
    if (isWeb) return;
    anims.forEach((a, i) => {
      a.stopAnimation();
      setTimeout(() => {
        Animated.loop(
          Animated.timing(a, { toValue: 1, duration: dur, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          { resetBeforeIteration: true }
        ).start();
      }, delays[i] * 1000);
    });
  }, []);
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', width: SPINNER_SIZE, gap: 2 }}>
      {Array.from({ length: 9 }).map((_, i) => {
        const nativeStyle = !isWeb ? {
          transform: [{ scale: anims[i].interpolate({ inputRange: [0, 0.35, 0.7, 1], outputRange: [1, 0, 1, 1] }) }],
        } : {};
        return (
          <Animated.View key={i} style={[{
            width: cellSize, height: cellSize, backgroundColor: SPINNER_COLOR, borderRadius: 2,
          }, nativeStyle, webAnim('ss-cube-grid', 1300, 'ease-in-out', delays[i] * 1000)]} />
        );
      })}
    </View>
  );
}

function FoldingCubeSpinner({ size: SPINNER_SIZE, color: SPINNER_COLOR }) {
  injectKeyframes();
  const halfSize = SPINNER_SIZE / 2;
  const rotAnim = useLoop(2400, Easing.linear);
  const foldAnims = useStaggeredLoops(4, 2400, 300);
  const rotNative = !isWeb ? {
    transform: [{ rotate: rotAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }],
  } : {};
  const positions = [
    { left: 0, top: 0 },
    { left: halfSize, top: 0 },
    { left: 0, top: halfSize },
    { left: halfSize, top: halfSize },
  ];
  return (
    <Animated.View style={[{ width: SPINNER_SIZE, height: SPINNER_SIZE, position: 'relative' }, rotNative, webAnim('ss-rotate', 2400, 'linear')]}>
      {positions.map((pos, i) => {
        const nativeStyle = !isWeb ? {
          opacity: foldAnims[i].interpolate({ inputRange: [0, 0.1, 0.25, 0.75, 0.9, 1], outputRange: [0, 0, 1, 1, 0, 0] }),
        } : {};
        return (
          <Animated.View key={i} style={[{
            position: 'absolute', width: halfSize, height: halfSize, backgroundColor: SPINNER_COLOR, opacity: 0.8,
            ...pos,
          }, nativeStyle, webAnim('ss-fold', 2400, 'linear', i * 300)]} />
        );
      })}
    </Animated.View>
  );
}

function RotatingPlainSpinner({ size: SPINNER_SIZE, color: SPINNER_COLOR }) {
  injectKeyframes();
  const anim = useLoop(1200);
  const nativeStyle = !isWeb ? {
    transform: [{ rotate: anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }],
  } : {};
  return (
    <Animated.View style={[{
      width: SPINNER_SIZE, height: SPINNER_SIZE, backgroundColor: SPINNER_COLOR, borderRadius: 2,
    }, nativeStyle, webAnim('ss-rotate', 1200)]} />
  );
}

export default function StudioSpinner({ size = DEFAULT_SIZE, color = DEFAULT_COLOR }) {
  const own = {
    size: Number(size) > 0 ? Number(size) : DEFAULT_SIZE,
    color: color || DEFAULT_COLOR,
  };

  switch (DEFAULT_TYPE) {
    case 'CircularProgress': return <CircularSpinner {...own} />;
    case 'Pulse': return <PulseSpinner {...own} />;
    case 'ThreeBounce': return <ThreeBounceSpinner {...own} />;
    case 'DoubleBounce': return <DoubleBounceSpinner {...own} />;
    case 'RotatingCircle': return <RotatingSpinner {...own} />;
    case 'RotatingPlain': return <RotatingPlainSpinner {...own} />;
    case 'Wave': return <WaveSpinner {...own} />;
    case 'Linear': return <LinearSpinner {...own} />;
    case 'WanderingCubes': return <WanderingCubesSpinner {...own} />;
    case 'FadingFour': return <FadingGridSpinner count={4} {...own} />;
    case 'FadingCube': return <FadingGridSpinner count={9} {...own} />;
    case 'ChasingDots': return <ChasingDotsSpinner {...own} />;
    case 'Circle': return <CircleFadeSpinner useRadialDots={false} {...own} />;
    case 'CubeGrid': return <CubeGridSpinner {...own} />;
    case 'FadingCircle': return <CircleFadeSpinner useRadialDots={true} {...own} />;
    case 'FoldingCube': return <FoldingCubeSpinner {...own} />;
    default: return <CircularSpinner {...own} />;
  }
}
