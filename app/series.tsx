import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View, Text, Image, FlatList } from 'react-native';
import { SpatialNavigationRoot, SpatialNavigationFocusableView, DefaultFocus } from 'react-tv-space-navigation';
import { scaledPixels } from '@/hooks/useScale';
import { useCallback, useMemo } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { Movie, useContentData } from '@/utils/content-provider';
import LoadingIndicator from '@/components/LoadingIndicator';
import FocusablePressable from '@/components/FocusablePressable';

interface LocalParams extends Record<string, any> {
  seriesName: string;
}

export default function SeriesScreen() {
  const { seriesName } = useLocalSearchParams<LocalParams>();
  const styles = useSeriesStyles();
  const router = useRouter();
  const isFocused = useIsFocused();

  // Use content provider
  const { isLoading, error, getContentBySeries } = useContentData();

  // Get videos for this series
  const seriesVideos = useMemo(() => {
    if (!seriesName) return [];

    const allSeries = getContentBySeries();
    const thisSeries = allSeries.find((series) => series.name === seriesName);

    return thisSeries?.videos || [];
  }, [seriesName, getContentBySeries]);

  // Get featured image from the first video
  const featuredImage = useMemo(() => {
    return seriesVideos[0]?.thumbnail || '';
  }, [seriesVideos]);

  const renderVideoItem = useCallback(
    ({ item }: { item: Movie }) => (
      <SpatialNavigationFocusableView
        onSelect={() => {
          router.push({
            pathname: '/details',
            params: {
              id: item.id,
              title: item.title,
              description: item.shortDescription,
              headerImage: item.thumbnail,
              movie: item.content.videos[0].url,
            },
          });
        }}
      >
        {({ isFocused }) => (
          <View style={[styles.videoCard, isFocused && styles.videoCardFocused]}>
            <Image source={{ uri: item.thumbnail }} style={styles.videoThumbnail} />
            <View style={styles.videoInfo}>
              <Text style={styles.videoTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.videoDescription} numberOfLines={2}>
                {item.shortDescription}
              </Text>
            </View>
          </View>
        )}
      </SpatialNavigationFocusableView>
    ),
    [router],
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingIndicator />
      </View>
    );
  }

  return (
    <SpatialNavigationRoot isActive={isFocused}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Image source={{ uri: featuredImage }} style={styles.headerImage} />
          <View style={styles.headerOverlay} />
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{seriesName}</Text>
            <Text style={styles.headerCount}>{seriesVideos.length} videos</Text>
          </View>
          <View style={styles.backButtonContainer}>
            <DefaultFocus>
              <FocusablePressable text="Back" onSelect={() => router.back()} style={styles.backButton} />
            </DefaultFocus>
          </View>
        </View>

        {/* Videos List */}
        <View style={styles.videosContainer}>
          <Text style={styles.sectionTitle}>All Videos</Text>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : seriesVideos.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No videos found in this series</Text>
            </View>
          ) : (
            <FlatList
              data={seriesVideos}
              renderItem={renderVideoItem}
              keyExtractor={(item) => item.id}
              numColumns={3}
              contentContainerStyle={styles.gridContainer}
            />
          )}
        </View>
      </View>
    </SpatialNavigationRoot>
  );
}

const useSeriesStyles = function () {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#000',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#000',
    },
    header: {
      width: '100%',
      height: scaledPixels(400),
      position: 'relative',
    },
    headerImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    headerOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    headerContent: {
      position: 'absolute',
      bottom: scaledPixels(50),
      left: scaledPixels(50),
      right: scaledPixels(50),
    },
    headerTitle: {
      fontSize: scaledPixels(48),
      fontWeight: 'bold',
      color: '#fff',
      marginBottom: scaledPixels(10),
    },
    headerCount: {
      fontSize: scaledPixels(24),
      color: '#ddd',
    },
    backButtonContainer: {
      position: 'absolute',
      top: scaledPixels(30),
      left: scaledPixels(30),
      zIndex: 10,
    },
    backButton: {
      paddingHorizontal: scaledPixels(20),
      paddingVertical: scaledPixels(10),
    },
    videosContainer: {
      flex: 1,
      padding: scaledPixels(50),
    },
    sectionTitle: {
      fontSize: scaledPixels(36),
      fontWeight: 'bold',
      color: '#fff',
      marginBottom: scaledPixels(30),
    },
    gridContainer: {
      paddingBottom: scaledPixels(40),
    },
    videoCard: {
      width: scaledPixels(350),
      height: scaledPixels(300),
      marginRight: scaledPixels(30),
      marginBottom: scaledPixels(30),
      borderRadius: scaledPixels(10),
      backgroundColor: '#111',
      overflow: 'hidden',
    },
    videoCardFocused: {
      borderColor: '#fff',
      borderWidth: scaledPixels(4),
      transform: [{ scale: 1.05 }],
    },
    videoThumbnail: {
      width: '100%',
      height: scaledPixels(200),
      resizeMode: 'cover',
    },
    videoInfo: {
      padding: scaledPixels(15),
    },
    videoTitle: {
      fontSize: scaledPixels(22),
      fontWeight: 'bold',
      color: '#fff',
      marginBottom: scaledPixels(5),
    },
    videoDescription: {
      fontSize: scaledPixels(16),
      color: '#aaa',
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
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyText: {
      fontSize: scaledPixels(20),
      color: '#aaa',
      textAlign: 'center',
    },
  });
};
