import { Stack, useNavigation, useRouter } from 'expo-router';
import { StyleSheet, View, Text, Image, FlatList } from 'react-native';
import React, { useCallback, useMemo, useState, useRef } from 'react';
import { DefaultFocus, SpatialNavigationFocusableView, SpatialNavigationRoot } from 'react-tv-space-navigation';
import { scaledPixels } from '@/hooks/useScale';
import { useMenuContext } from '../../components/MenuContext';
import { DrawerActions, useIsFocused } from '@react-navigation/native';
import { Direction } from '@bam.tech/lrud';
import { Movie, useContentData } from '@/utils/content-provider';
import LoadingIndicator from '@/components/LoadingIndicator';

// Interface for a series group
interface SeriesGroup {
  name: string;
  videos: Movie[];
  thumbnailImage: string;
}

export default function ExploreScreen() {
  const styles = useExploreStyles();
  const { isOpen: isMenuOpen, toggleMenu } = useMenuContext();
  const isFocused = useIsFocused();
  const isActive = isFocused && !isMenuOpen;
  const navigation = useNavigation();
  const router = useRouter();
  const [focusedIndex, setFocusedIndex] = useState(0);

  // Use content provider
  const { isLoading, error, getContentBySeries } = useContentData();

  // Group content by series
  const seriesGroups = useMemo(() => {
    const groups = getContentBySeries();

    // Convert to expected format and sort by name
    return groups
      .map((group) => ({
        name: group.name,
        videos: group.videos,
        // Use the first video's thumbnail as the series thumbnail
        thumbnailImage: group.videos[0]?.thumbnail || '',
      }))
      .filter((group) => group.videos.length > 0) // Only include non-empty groups
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [getContentBySeries]);

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

  const renderSeriesItem = useCallback(
    ({ item, index }: { item: SeriesGroup; index: number }) => (
      <SpatialNavigationFocusableView
        onFocus={() => setFocusedIndex(index)}
        onSelect={() => {
          // Navigate to a series detail page
          router.push({
            pathname: '/series',
            params: { seriesName: item.name },
          });
        }}
      >
        {({ isFocused }) => (
          <View style={[styles.seriesCard, isFocused && styles.seriesCardFocused]}>
            <Image source={{ uri: item.thumbnailImage }} style={styles.seriesImage} />
            <View style={styles.seriesInfo}>
              <Text style={styles.seriesTitle}>{item.name}</Text>
              <Text style={styles.seriesCount}>{item.videos.length} videos</Text>
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
    <SpatialNavigationRoot isActive={isActive} onDirectionHandledWithoutMovement={onDirectionHandledWithoutMovement}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <Text style={styles.pageTitle}>Series</Text>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : seriesGroups.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No series found</Text>
          </View>
        ) : (
          <DefaultFocus>
            <FlatList
              data={seriesGroups}
              renderItem={renderSeriesItem}
              keyExtractor={(item) => item.name}
              numColumns={3}
              contentContainerStyle={styles.gridContainer}
            />
          </DefaultFocus>
        )}
      </View>
    </SpatialNavigationRoot>
  );
}

const useExploreStyles = function () {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#000',
      padding: scaledPixels(40),
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#000',
    },
    pageTitle: {
      fontSize: scaledPixels(48),
      fontWeight: 'bold',
      color: '#fff',
      marginBottom: scaledPixels(40),
    },
    gridContainer: {
      paddingBottom: scaledPixels(40),
    },
    seriesCard: {
      width: scaledPixels(350),
      height: scaledPixels(300),
      marginRight: scaledPixels(30),
      marginBottom: scaledPixels(30),
      borderRadius: scaledPixels(10),
      backgroundColor: '#111',
      overflow: 'hidden',
      elevation: 5,
    },
    seriesCardFocused: {
      borderColor: '#fff',
      borderWidth: scaledPixels(4),
      transform: [{ scale: 1.05 }],
    },
    seriesImage: {
      width: '100%',
      height: scaledPixels(200),
      resizeMode: 'cover',
    },
    seriesInfo: {
      padding: scaledPixels(15),
    },
    seriesTitle: {
      fontSize: scaledPixels(22),
      fontWeight: 'bold',
      color: '#fff',
      marginBottom: scaledPixels(5),
    },
    seriesCount: {
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
