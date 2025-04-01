import { StyleSheet, View, Image, Text } from 'react-native';
import { useNavigation, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState, useRef } from 'react';
import { DrawerActions, useIsFocused } from '@react-navigation/native';
import { useMenuContext } from '../../components/MenuContext';
import {
  SpatialNavigationFocusableView,
  SpatialNavigationRoot,
  SpatialNavigationScrollView,
  SpatialNavigationNode,
  SpatialNavigationVirtualizedList,
  SpatialNavigationVirtualizedListRef,
  DefaultFocus,
} from 'react-tv-space-navigation';
import { Direction } from '@bam.tech/lrud';
import { scaledPixels } from '@/hooks/useScale';
import { LinearGradient } from 'expo-linear-gradient';
import { Movie, LiveFeed, useContentData } from '../../utils/content-provider';
import LoadingIndicator from '../../components/LoadingIndicator';

// Create a union type for content items that can be displayed in rows
type ContentItem = Movie | LiveFeed;

export default function IndexScreen() {
  const styles = useGridStyles();
  const router = useRouter();
  const navigation = useNavigation();
  const { isOpen: isMenuOpen, toggleMenu } = useMenuContext();
  const trendingRef = useRef<SpatialNavigationVirtualizedListRef>(null);
  const sermonsRef = useRef<SpatialNavigationVirtualizedListRef>(null);
  const specialsRef = useRef<SpatialNavigationVirtualizedListRef>(null);

  const [focusedIndex, setFocusedIndex] = useState(0);
  const isFocused = useIsFocused();
  const isActive = isFocused && !isMenuOpen;

  // Use the content provider hook to get the data
  const { isLoading, error, getRecentVideos, getLiveStreams, getContentBySeries } = useContentData();

  // Get the content groups
  const recentVideos = useMemo(() => getRecentVideos(10), [getRecentVideos]);
  const liveStreams = useMemo(() => getLiveStreams(), [getLiveStreams]);
  const contentSeries = useMemo(() => getContentBySeries(), [getContentBySeries]);

  // Find the featured content
  const focusedItem = useMemo(
    () => (recentVideos && recentVideos.length > 0 ? recentVideos[focusedIndex] : null),
    [recentVideos, focusedIndex],
  );

  const renderHeader = useCallback(() => {
    if (isLoading) {
      return <LoadingIndicator />;
    }

    if (error || !focusedItem) {
      return (
        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Calvary Baptist Church</Text>
            <Text style={styles.headerDescription}>{error || 'No content available. Please try again later.'}</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.header}>
        <Image
          style={styles.headerImage}
          source={{
            uri: focusedItem.thumbnail,
          }}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.9)', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.3)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientLeft}
        />
        <LinearGradient
          colors={['rgb(0,0,0)', 'rgba(0,0,0, 0.3)', 'transparent']}
          locations={[0, 0.4, 1]}
          start={{ x: 0, y: 1 }}
          end={{ x: 0, y: 0 }}
          style={styles.gradientBottom}
        />
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>{focusedItem.title}</Text>
          <Text style={styles.headerDescription}>{focusedItem.shortDescription}</Text>
        </View>
      </View>
    );
  }, [isLoading, error, focusedItem, styles.header, styles.gradientLeft, styles.gradientBottom]);

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

  const renderItem = useCallback(
    ({ item }: { item: ContentItem; index: number }) => (
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
        onFocus={() => {
          // Only update focused index for recent videos to maintain header consistency
          if (recentVideos.includes(item as Movie)) {
            setFocusedIndex(recentVideos.indexOf(item as Movie));
          }
        }}
      >
        {({ isFocused }) => (
          <View style={[styles.highlightThumbnail, isFocused && styles.highlightThumbnailFocused]}>
            <Image source={{ uri: item.thumbnail }} style={styles.headerImage} />
            <View style={styles.thumbnailTextContainer}>
              <Text style={styles.thumbnailText}>{item.title}</Text>
            </View>
          </View>
        )}
      </SpatialNavigationFocusableView>
    ),
    [router, styles, recentVideos],
  );

  const renderScrollableRow = useCallback(
    (title: string, data: ContentItem[]) => {
      if (!data || data.length === 0) return null;

      return (
        <View style={styles.highlightsContainer}>
          <Text style={styles.highlightsTitle}>{title}</Text>
          <SpatialNavigationNode>
            <DefaultFocus>
              <SpatialNavigationVirtualizedList
                data={data}
                orientation="horizontal"
                renderItem={renderItem}
                itemSize={scaledPixels(425)}
                numberOfRenderedItems={6}
                numberOfItemsVisibleOnScreen={4}
                onEndReachedThresholdItemsNumber={3}
              />
            </DefaultFocus>
          </SpatialNavigationNode>
        </View>
      );
    },
    [styles, renderItem],
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
      <View style={styles.container}>
        {renderHeader()}
        <SpatialNavigationScrollView offsetFromStart={scaledPixels(60)} style={styles.scrollContent}>
          {liveStreams.length > 0 && renderScrollableRow('Live Now', liveStreams as ContentItem[])}
          {renderScrollableRow('Recent Videos', recentVideos as ContentItem[])}

          {contentSeries.map((series, index) =>
            series.videos.length > 0 ? (
              <React.Fragment key={`series-${series.name}-${index}`}>
                {renderScrollableRow(series.name, series.videos as ContentItem[])}
              </React.Fragment>
            ) : null
          )}
        </SpatialNavigationScrollView>
      </View>
    </SpatialNavigationRoot>
  );
}

const useGridStyles = function () {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'black',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'black',
    },
    scrollContent: {
      flex: 1,
      marginBottom: scaledPixels(48),
    },
    highlightsTitle: {
      color: '#fff',
      fontSize: scaledPixels(34),
      fontWeight: 'bold',
      marginBottom: scaledPixels(10),
      marginTop: scaledPixels(15),
      textShadowColor: 'rgba(0, 0, 0, 0.75)',
      textShadowOffset: { width: -1, height: 1 },
      textShadowRadius: 10,
    },
    headerTitle: {
      color: '#fff',
      fontSize: scaledPixels(48),
      fontWeight: 'bold',
      textShadowColor: 'rgba(0, 0, 0, 0.75)',
      textShadowOffset: { width: -1, height: 1 },
      textShadowRadius: 10,
    },
    headerDescription: {
      color: '#fff',
      fontSize: scaledPixels(24),
      fontWeight: '500',
      paddingTop: scaledPixels(16),
      textShadowColor: 'rgba(0, 0, 0, 0.75)',
      textShadowOffset: { width: -1, height: 1 },
      textShadowRadius: 10,
    },
    thumbnailTextContainer: {
      position: 'absolute',
      bottom: scaledPixels(10),
      left: scaledPixels(10),
      right: scaledPixels(10),
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      padding: scaledPixels(5),
      borderRadius: scaledPixels(3),
    },
    thumbnailText: {
      color: '#fff',
      fontSize: scaledPixels(18),
      fontWeight: 'bold',
      textAlign: 'center',
    },
    highlightThumbnail: {
      width: scaledPixels(400),
      height: scaledPixels(240),
      marginRight: scaledPixels(10),
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: scaledPixels(5),
    },
    highlightThumbnailFocused: {
      borderColor: '#fff',
      borderWidth: scaledPixels(4),
    },
    highlightsContainer: {
      padding: scaledPixels(10),
      height: scaledPixels(360),
    },
    thumbnailPlaceholder: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      width: '100%',
      height: '100%',
      borderRadius: scaledPixels(5),
    },
    header: {
      width: '100%',
      height: scaledPixels(700),
      position: 'relative',
    },
    headerImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    gradientLeft: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      height: '100%',
    },
    gradientBottom: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: '15%',
    },
    headerTextContainer: {
      position: 'absolute',
      left: scaledPixels(40),
      top: 0,
      bottom: 0,
      justifyContent: 'center',
      width: '50%',
    },
    highlightsList: {
      paddingLeft: scaledPixels(20),
    },
    cardImage: {
      width: '100%',
      height: '70%',
      borderTopLeftRadius: scaledPixels(10),
      borderTopRightRadius: scaledPixels(10),
    },
  });
};
