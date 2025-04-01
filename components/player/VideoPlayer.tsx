import React from 'react';
import Video, { VideoRef, OnLoadData, OnProgressData } from 'react-native-video';
import { StyleSheet, Dimensions, Platform, TouchableWithoutFeedback } from 'react-native';
import { scaledPixels } from '@/hooks/useScale';

const { width } = Dimensions.get('window');

// Define a more flexible type for video sources
type VideoType = 'mp4' | 'mpd' | 'hls' | string;

// Define the props for our VideoPlayer component
type VideoPlayerProps = {
  movie: string;
  headerImage: string;
  paused: boolean;
  controls: boolean;
  onBuffer: (isBuffering: boolean) => void;
  onProgress: (data: OnProgressData) => void;
  onLoad: (data: OnLoadData) => void;
  onEnd: () => void;
  onError: (error: any) => void;
  type?: VideoType;
  isLiveStream?: boolean;
};

const VideoPlayer = React.forwardRef<VideoRef, VideoPlayerProps>(
  (
    {
      movie,
      headerImage,
      paused,
      controls,
      onBuffer,
      onProgress,
      onLoad,
      onEnd,
      onError,
      type = 'mp4',
      isLiveStream = false,
    },
    ref,
  ) => {
    const styles = useVideoPlayerStyles();

    // Dynamic media type mapping
    const sourceConfig = React.useMemo(() => {
      // Normalize type for known formats
      const normalizedType: VideoType =
        type === 'mpd' ? 'mpd' :
          type === 'hls' ? 'hls' :
            'mp4';

      // Special handling for Cloudflare Stream URLs
      if (movie.includes('cloudflarestream.com')) {
        // Attempt to convert manifest URLs to direct video URL
        const directUrl = movie
          .replace('/manifest/video.mpd', '/direct_mp4')
          .replace('/manifest/video.m3u8', '/direct_mp4');

        return {
          uri: directUrl,
          type: 'mp4',
          headers: Platform.OS === 'web' ? {
            'Origin': '*',
            'Access-Control-Allow-Origin': '*',
          } : undefined
        };
      }

      return {
        uri: movie,
        type: normalizedType,
        headers: Platform.OS === 'web' ? {
          'Origin': '*',
          'Access-Control-Allow-Origin': '*',
        } : undefined
      };
    }, [movie, type]);

    return (
      <TouchableWithoutFeedback>
        <Video
          ref={ref}
          source={{
            uri: sourceConfig.uri,
            type: sourceConfig.type === 'mpd' ? 'mp4' : sourceConfig.type,
            headers: sourceConfig.headers
          }}
          style={styles.video}
          controls={controls}
          paused={paused}
          onBuffer={({ isBuffering }) => onBuffer(isBuffering)}
          onProgress={onProgress}
          onLoad={onLoad}
          onEnd={onEnd}
          onError={(error) => {
            console.error('Video Player Error:', error);
            // Additional logging for web platform
            if (Platform.OS === 'web') {
              console.error('Source Details:', {
                uri: sourceConfig.uri,
                type: sourceConfig.type,
                headers: sourceConfig.headers
              });
            }
            onError(error);
          }}
          poster={headerImage}
          posterResizeMode="cover"
          resizeMode="contain"
          repeat={false}
          rate={1.0}
          ignoreSilentSwitch="ignore"
          playInBackground={false}
          playWhenInactive={false}
          progressUpdateInterval={500}
          bufferConfig={{
            minBufferMs: 15000,
            maxBufferMs: 50000,
            bufferForPlaybackMs: 2500,
            bufferForPlaybackAfterRebufferMs: 5000,
          }}
          // Live stream specific settings
          muted={isLiveStream ? false : undefined}
          preferredForwardBufferDuration={60}
        />
      </TouchableWithoutFeedback>
    );
  },
);

const useVideoPlayerStyles = () => {
  return StyleSheet.create({
    video: {
      width: '100%',
      height: Platform.OS === 'web' ? '100%' : width * (9 / 16),
    },
  });
};

export default VideoPlayer;