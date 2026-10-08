import React from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';

function isPlayableSource(value) {
  return typeof value === 'string' && /^(https?:\/\/|data:video\/)/i.test(value.trim());
}

function Placeholder({ style, label }) {
  return (
    <View style={[{ backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' }, style]}>
      <Text style={{ color: '#64748B', fontSize: 12 }}>{label || 'Video'}</Text>
    </View>
  );
}


function NativeVideo(props) {
  const { source, poster, contentFit, controls, autoplay, loop, muted, style, onLoad, onError, onEnd } = props;
  // The authored poster is a Studio property on every surface; expo-video has
  // no poster prop, so the thumbnail is an overlay that clears on first play.
  const [started, setStarted] = React.useState(!!autoplay);
  const player = useVideoPlayer(source, (p) => {
    p.loop = !!loop;
    p.muted = !!muted;
    if (autoplay) p.play();
  });
  React.useEffect(() => {
    if (!player || typeof player.addListener !== 'function') return undefined;
    const subs = [];
    try {
      subs.push(player.addListener('statusChange', (payload) => {
        const status = payload && payload.status ? payload.status : payload;
        if (status === 'readyToPlay' && onLoad) onLoad();
        if (status === 'error' && onError) onError(payload && payload.error);
      }));
      subs.push(player.addListener('playingChange', (payload) => {
        const isPlaying = payload && typeof payload === 'object' ? payload.isPlaying : payload;
        if (isPlaying) setStarted(true);
      }));
      subs.push(player.addListener('playToEnd', () => { if (onEnd) onEnd(); }));
    } catch (e) {
      // Older player builds expose a subset of events; skip the missing ones.
    }
    return () => subs.forEach((s) => { try { s && s.remove && s.remove(); } catch (e) {} });
  }, [player, onLoad, onError, onEnd]);
  // expo-video accepts contain | cover | fill only; 'stretch' is not a value.
  const fit = contentFit === 'stretch' ? 'fill' : (contentFit || 'contain');
  const showOverlay = controls !== false && !started;
  return (
    <View style={style}>
      <VideoView
        style={{ width: '100%', height: '100%' }}
        player={player}
        contentFit={fit}
        nativeControls={controls !== false}
        allowsFullscreen
        allowsPictureInPicture
      />
      {poster && !started ? (
        <Image
          source={{ uri: poster }}
          resizeMode={fit === 'fill' ? 'stretch' : fit}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          pointerEvents="none"
        />
      ) : null}
      {showOverlay ? (
        // Native controls auto-hide on a paused player, so the first paint would
        // otherwise be a bare black box. A Studio-owned play affordance keeps
        // Expo Go and the exported app consistent with Canvas and Preview.
        <Pressable
          onPress={() => { setStarted(true); try { player && player.play(); } catch (e) {} }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}
        >
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: 0, height: 0, marginLeft: 4, borderTopWidth: 11, borderBottomWidth: 11, borderLeftWidth: 18, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: '#FFFFFF' }} />
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}


export default function StudioVideo(props) {
  const source = props.source;
  if (!isPlayableSource(source)) {
    return <Placeholder style={props.style} label={source ? 'Invalid video URL' : props.placeholderLabel} />;
  }
  return <NativeVideo {...props} />;
}

