import React, { useRef, useState, useEffect, useMemo } from 'react';
import { View, Platform, StyleSheet, Animated, Text } from 'react-native';
import { SpatialNavigationRoot } from 'react-tv-space-navigation';
import { useIsFocused } from '@react-navigation/native';
import { useLocalSearchParams } from 'expo-router';
import { router, Stack } from 'expo-router';
import RemoteControlManager from '@/app/remote-control/RemoteControlManager';
import { SupportedKeys } from '@/app/remote-control/SupportedKeys';
import Controls from '@/components/player/Controls';
import ExitButton from '@/components/player/ExitButton';
import LoadingIndicator from '@/components/LoadingIndicator';
import { VideoRef } from 'react-native-video';
import VideoPlayer from '@/components/player/VideoPlayer';
import { useContentData } from '@/utils/content-provider';
import FocusablePressable from '@/components/FocusablePressable';
import { scaledPixels } from '@/utils/scaling';

const SHOW_NATIVE_CONTROLS = Platform.OS === 'ios';

interface PlayerParams extends Record<string, any> {
  id: string;
  movie: string;
  headerImage: string;
  title: string;
}

export default function PlayerScreen() {
  const { id, movie, headerImage, title } = useLocalSearchParams<PlayerParams>();
  const isFocused = useIsFocused();
  const [paused, setPaused] = useState<boolean>(false);
  const [controlsVisible, setControlsVisible] = useState<boolean>(false);
  const [isVideoBuffering, setIsVideoBuffering] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [videoError, setVideoError] = useState<string | null>(null);
  const videoRef = useRef<VideoRef>(null);
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentTimeRef = useRef<number>(0);
  const durationRef = useRef<number>(0);
  const controlsOpacity = useRef(new Animated.Value(0)).current;

  // Get content data to display live status if needed
  const { contentData } = useContentData();

  // Determine video type and URL
  const { videoUrl, videoType, isLiveStream } = useMemo(() => {
    // Check if it's a Cloudflare Stream URL
    const isCloudflareStream = movie.includes('cloudflarestream.com');

    // Cloudflare Stream specific handling
    if (isCloudflareStream) {
      // Explicitly convert DASH/manifest URLs to direct video URL
      const directUrl = movie
        .replace('/manifest/video.mpd', '/direct')
        .replace('/manifest/video.m3u8', '/direct');

      return {
        videoUrl: directUrl,
        videoType: 'mp4',
        isLiveStream: false
      };
    }

    // Determine video type based on URL
    const type = movie.includes('.mpd') ? 'mpd' :
      movie.includes('.m3u8') ? 'hls' :
        'mp4';

    // Default content data live stream check
    const streamLive = contentData?.liveFeeds.some((feed) => feed.id === id) || false;

    return {
      videoUrl: movie,
      videoType: type,
      isLiveStream: streamLive
    };
  }, [movie, id, contentData]);

  useEffect(() => {
    if (SHOW_NATIVE_CONTROLS) return;

    const handleKeyDown = (key: SupportedKeys) => {
      switch (key) {
        case SupportedKeys.Right:
        case SupportedKeys.FastForward:
          if (!isLiveStream) {
            seek(currentTimeRef.current + 10);
          }
          break;
        case SupportedKeys.Left:
        case SupportedKeys.Rewind:
          if (!isLiveStream) {
            seek(currentTimeRef.current - 10);
          }
          break;
        case SupportedKeys.Back:
          router.back();
          break;
        case SupportedKeys.PlayPause:
          togglePausePlay();
          break;
        case SupportedKeys.Enter:
          showControls();
          break;
        default:
          showControls();
          break;
      }
    };

    const listener = RemoteControlManager.addKeydownListener(handleKeyDown);

    // Show controls initially
    showControls();

    return () => {
      RemoteControlManager.removeKeydownListener(listener);
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
    };
  }, [isLiveStream]);

  const seek = (time: number) => {
    if (isLiveStream) return; // Don't seek on live streams

    if (time < 0) {
      time = 0;
    } else if (time > durationRef.current) {
      time = durationRef.current;
    }

    videoRef.current?.seek(time);
    currentTimeRef.current = time;
    setCurrentTime(time);
    showControls();
  };

  const showControls = () => {
    setControlsVisible(true);
    Animated.timing(controlsOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
    }

    hideControlsTimeoutRef.current = setTimeout(() => {
      Animated.timing(controlsOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setControlsVisible(false);
      });
    }, 3000);
  };

  const togglePausePlay = () => {
    if (isLiveStream) return; // Don't pause/play live streams

    setPaused((prev) => !prev);
    showControls();
  };

  const handleVideoError = (error: any) => {
    console.error('Video playback error:', error);
    setVideoError(
      error.error?.errorString ||
      (typeof error === 'string' ? error : 'An error occurred during playback')
    );
    setIsVideoBuffering(false);
  };

  const styles = usePlayerStyles();

  // Display error message if video fails to load
  if (videoError) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Playback Error</Text>
          <Text style={styles.errorMessage}>{videoError}</Text>
          <Text style={styles.errorMessage}>URL: {videoUrl}</Text>
          <Text style={styles.errorMessage}>Type: {videoType}</Text>
          <FocusablePressable
            text="Go Back"
            onSelect={() => router.back()}
            style={{ marginTop: scaledPixels(20) }}
          />
        </View>
      </View>
    );
  }

  return (
    <SpatialNavigationRoot isActive={isFocused && Platform.OS === 'android'}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <VideoPlayer
          ref={videoRef}
          movie={videoUrl}
          headerImage={headerImage}
          paused={paused}
          controls={SHOW_NATIVE_CONTROLS}
          onBuffer={setIsVideoBuffering}
          onProgress={(progress) => {
            setCurrentTime(progress.currentTime);
            currentTimeRef.current = progress.currentTime;
          }}
          onLoad={(data) => {
            durationRef.current = data.duration;
            setIsVideoBuffering(false);
          }}
          onEnd={() => setPaused(true)}
          onError={handleVideoError}
          type={videoType}
          isLiveStream={isLiveStream}
        />

        {isVideoBuffering && (
          <View style={styles.bufferingContainer}>
            <LoadingIndicator />
            <Text style={styles.bufferingText}>
              {isLiveStream ? 'Connecting to live stream...' : 'Buffering...'}
            </Text>
          </View>
        )}

        {!SHOW_NATIVE_CONTROLS && controlsVisible && !isLiveStream && !!durationRef.current && (
          <Animated.View style={[styles.controlsContainer, { opacity: controlsOpacity }]}>
            <ExitButton onSelect={() => router.back()} />
            <Controls
              paused={paused}
              onPlayPause={togglePausePlay}
              currentTime={currentTime}
              duration={durationRef.current}
            />
          </Animated.View>
        )}

        {/* Simplified controls for live stream */}
        {!SHOW_NATIVE_CONTROLS && controlsVisible && isLiveStream && (
          <Animated.View style={[styles.controlsContainer, { opacity: controlsOpacity }]}>
            <ExitButton onSelect={() => router.back()} />
            <View style={styles.liveIndicatorContainer}>
              <View style={styles.liveIndicator} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </Animated.View>
        )}
      </View>
    </SpatialNavigationRoot>
  );
}

const usePlayerStyles = () => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#000',
    },
    controlsContainer: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'space-between',
      zIndex: 1,
    },
    bufferingContainer: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2,
    },
    bufferingText: {
      color: '#fff',
      fontSize: scaledPixels(24),
      marginTop: scaledPixels(20),
    },
    liveIndicatorContainer: {
      position: 'absolute',
      right: scaledPixels(40),
      top: scaledPixels(40),
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      paddingVertical: scaledPixels(10),
      paddingHorizontal: scaledPixels(15),
      borderRadius: scaledPixels(5),
    },
    liveIndicator: {
      width: scaledPixels(12),
      height: scaledPixels(12),
      borderRadius: scaledPixels(6),
      backgroundColor: '#ff0000',
      marginRight: scaledPixels(8),
    },
    liveText: {
      color: '#fff',
      fontSize: scaledPixels(20),
      fontWeight: 'bold',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: scaledPixels(40),
    },
    errorTitle: {
      color: '#fff',
      fontSize: scaledPixels(36),
      fontWeight: 'bold',
      marginBottom: scaledPixels(20),
    },
    errorMessage: {
      color: '#fff',
      fontSize: scaledPixels(24),
      textAlign: 'center',
      marginBottom: scaledPixels(30),
    },
  });
};