import { Stack, useNavigation, useRouter } from 'expo-router';
import { StyleSheet, View, Text, Image } from 'react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { DefaultFocus, SpatialNavigationFocusableView, SpatialNavigationRoot } from 'react-tv-space-navigation';
import { scaledPixels } from '@/hooks/useScale';
import { useMenuContext } from '../../components/MenuContext';
import { DrawerActions, useIsFocused } from '@react-navigation/native';
import { Direction } from '@bam.tech/lrud';
import { LiveFeed, useContentData } from '@/utils/content-provider';
import LoadingIndicator from '@/components/LoadingIndicator';
import FocusablePressable from '@/components/FocusablePressable';

export default function TVScreen() {
  const styles = useTVStyles();
  const { isOpen: isMenuOpen, toggleMenu } = useMenuContext();
  const isFocused = useIsFocused();
  const isActive = isFocused && !isMenuOpen;
  const navigation = useNavigation();
  const router = useRouter();
  const [focusedIndex, setFocusedIndex] = useState(0);

  // Use content provider
  const { isLoading, error, getLiveStreams } = useContentData();

  // Get live streams
  const liveStreams = useMemo(() => getLiveStreams(), [getLiveStreams]);

  const onDirectionHandledWithoutMovement = useCallback(
    (movement: Direction) => {
      console.log('Direction ' + movement);
      if (movement === 'left' && focusedIndex === 0) {
        navigation.dispatch(DrawerActions.openDrawer());
        toggleMenu(true);
      }
    },
    [toggleMenu, focusedIndex, navigation],
  );

  const renderLiveStream = useCallback(
    (stream: LiveFeed) => {
      const validUntil = new Date(stream.validityPeriodEnd);
      const formattedEndTime = validUntil.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });

      return (
        <View style={styles.liveStreamContainer}>
          <Image source={{ uri: stream.thumbnail }} style={styles.liveImage} />

          <View style={styles.liveStreamInfo}>
            <View style={styles.liveIndicatorContainer}>
              <View style={styles.liveIndicator} />
              <Text style={styles.liveIndicatorText}>LIVE</Text>
            </View>

            <Text style={styles.liveTitle}>{stream.title}</Text>
            <Text style={styles.liveDescription}>{stream.shortDescription}</Text>
            <Text style={styles.liveEndTime}>Available until {formattedEndTime}</Text>

            <DefaultFocus>
              <FocusablePressable
                text="Watch Now"
                onSelect={() => {
                  router.push({
                    pathname: '/player',
                    params: {
                      id: stream.id,
                      title: stream.title,
                      description: stream.shortDescription,
                      headerImage: stream.thumbnail,
                      movie: stream.content.videos[0].url,
                    },
                  });
                }}
                style={styles.watchButton}
              />
            </DefaultFocus>
          </View>
        </View>
      );
    },
    [router],
  );

  const renderNoLiveStreams = useCallback(
    () => (
      <View style={styles.noStreamsContainer}>
        <Text style={styles.noStreamsTitle}>No Live Streams Available</Text>
        <Text style={styles.noStreamsMessage}>Check back later for our next live stream.</Text>
        <Text style={styles.noStreamsSchedule}>Sunday Worship: 10:00 AM EST</Text>
      </View>
    ),
    [],
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingIndicator />
      </View>
    );
  }

  return (
    <SpatialNavigationRoot isActive={isActive} onDirectionHandledWithoutMovement={onDirectionHandledWithoutMovement}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <Text style={styles.title}>Live Streams</Text>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : liveStreams.length > 0 ? (
          liveStreams.map((stream) => renderLiveStream(stream))
        ) : (
          renderNoLiveStreams()
        )}
      </View>
    </SpatialNavigationRoot>
  );
}

const useTVStyles = function () {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#000',
      padding: scaledPixels(50),
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#000',
    },
    title: {
      fontSize: scaledPixels(48),
      fontWeight: 'bold',
      color: '#fff',
      marginBottom: scaledPixels(40),
    },
    liveStreamContainer: {
      flexDirection: 'row',
      backgroundColor: '#111',
      borderRadius: scaledPixels(10),
      overflow: 'hidden',
      height: scaledPixels(380),
      marginBottom: scaledPixels(30),
    },
    liveImage: {
      width: '50%',
      height: '100%',
      resizeMode: 'cover',
    },
    liveStreamInfo: {
      flex: 1,
      padding: scaledPixels(30),
      justifyContent: 'center',
    },
    liveIndicatorContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: scaledPixels(20),
    },
    liveIndicator: {
      width: scaledPixels(12),
      height: scaledPixels(12),
      borderRadius: scaledPixels(6),
      backgroundColor: '#ff0000',
      marginRight: scaledPixels(8),
    },
    liveIndicatorText: {
      color: '#ff0000',
      fontSize: scaledPixels(20),
      fontWeight: 'bold',
    },
    liveTitle: {
      fontSize: scaledPixels(36),
      fontWeight: 'bold',
      color: '#fff',
      marginBottom: scaledPixels(15),
    },
    liveDescription: {
      fontSize: scaledPixels(20),
      color: '#ddd',
      marginBottom: scaledPixels(20),
      lineHeight: scaledPixels(28),
    },
    liveEndTime: {
      fontSize: scaledPixels(18),
      color: '#aaa',
      marginBottom: scaledPixels(30),
    },
    watchButton: {
      marginTop: scaledPixels(20),
      alignSelf: 'flex-start',
    },
    noStreamsContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: scaledPixels(40),
    },
    noStreamsTitle: {
      fontSize: scaledPixels(36),
      fontWeight: 'bold',
      color: '#fff',
      marginBottom: scaledPixels(20),
      textAlign: 'center',
    },
    noStreamsMessage: {
      fontSize: scaledPixels(24),
      color: '#ddd',
      marginBottom: scaledPixels(30),
      textAlign: 'center',
    },
    noStreamsSchedule: {
      fontSize: scaledPixels(20),
      color: '#3d85c6',
      fontWeight: 'bold',
      textAlign: 'center',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorText: {
      fontSize: scaledPixels(20),
      color: '#ff6b6b',
      textAlign: 'center',
    },
  });
};
