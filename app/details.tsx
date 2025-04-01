import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View, Image, Text } from 'react-native';
import { SpatialNavigationRoot } from 'react-tv-space-navigation';
import { scaledPixels } from '@/hooks/useScale';
import { useCallback, useMemo } from 'react';
import { useIsFocused } from '@react-navigation/native';
import FocusablePressable from '@/components/FocusablePressable';
import { formatDuration, useContentData } from '../utils/content-provider';

interface LocalParams extends Record<string, any> {
  id: string;
  title: string;
  description: string;
  movie: string;
  headerImage: string;
}

export default function DetailsScreen() {
  const { id, title, description, movie, headerImage } = useLocalSearchParams<LocalParams>();
  const styles = useDetailsStyles();
  const router = useRouter();
  const isFocused = useIsFocused();

  const { contentData } = useContentData();

  // Find the full movie object from the content data
  const movieDetails = useMemo(() => {
    if (!contentData || !id) return null;

    // Check in regular movies
    const foundMovie = contentData.movies.find((m) => m.id === id);
    if (foundMovie) return foundMovie;

    // Check in live feeds
    const foundLive = contentData.liveFeeds.find((l) => l.id === id);
    return foundLive;
  }, [contentData, id]);

  // Format the release date to be more readable
  const formattedReleaseDate = useMemo(() => {
    if (!movieDetails?.releaseDate) return '';

    const date = new Date(movieDetails.releaseDate);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  }, [movieDetails]);

  // Format the duration
  const duration = useMemo(() => {
    if (!movieDetails?.content?.duration) return '';
    return formatDuration(movieDetails.content.duration);
  }, [movieDetails]);

  const navigate = useCallback(() => {
    router.push({
      pathname: '/player',
      params: {
        id,
        movie,
        headerImage,
        title,
      },
    });
  }, [router, id, movie, headerImage, title]);

  return (
    <SpatialNavigationRoot isActive={isFocused}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <Image source={{ uri: headerImage }} style={styles.backgroundImage} />
        <View style={styles.contentContainer}>
          <View style={styles.topContent}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>

            {(duration || formattedReleaseDate) && (
              <View style={styles.metadataContainer}>
                {duration && (
                  <View style={styles.metadataItem}>
                    <Text style={styles.metadataLabel}>Duration</Text>
                    <Text style={styles.metadataValue}>{duration}</Text>
                  </View>
                )}

                {formattedReleaseDate && (
                  <View style={styles.metadataItem}>
                    <Text style={styles.metadataLabel}>Released</Text>
                    <Text style={styles.metadataValue}>{formattedReleaseDate}</Text>
                  </View>
                )}
              </View>
            )}
          </View>
          <View style={styles.bottomContent}>
            <View style={styles.tagsContainer}>
              {movieDetails?.genres?.map((genre, index) => (
                <View key={`genre-${index}`} style={styles.tag}>
                  <Text style={styles.tagText}>{genre}</Text>
                </View>
              ))}

              {movieDetails?.tags?.map((tag, index) => (
                <View key={`tag-${index}`} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>

            <FocusablePressable
              text={'Watch now'}
              onSelect={navigate}
              style={{ paddingHorizontal: scaledPixels(30) }}
            />
          </View>
        </View>
      </View>
    </SpatialNavigationRoot>
  );
}

const useDetailsStyles = function () {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#000',
    },
    backgroundImage: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      opacity: 0.3,
    },
    contentContainer: {
      flex: 1,
      padding: scaledPixels(40),
      justifyContent: 'space-between',
    },
    topContent: {
      marginTop: scaledPixels(100),
    },
    bottomContent: {
      marginBottom: scaledPixels(40),
    },
    title: {
      fontSize: scaledPixels(48),
      fontWeight: 'bold',
      color: '#fff',
      marginBottom: scaledPixels(20),
      textShadowColor: 'rgba(0, 0, 0, 0.75)',
      textShadowOffset: { width: -1, height: 1 },
      textShadowRadius: 10,
    },
    description: {
      fontSize: scaledPixels(24),
      color: '#fff',
      marginBottom: scaledPixels(20),
      width: '60%',
      lineHeight: scaledPixels(32),
    },
    metadataContainer: {
      flexDirection: 'row',
      marginTop: scaledPixels(20),
      marginBottom: scaledPixels(30),
    },
    metadataItem: {
      marginRight: scaledPixels(40),
    },
    metadataLabel: {
      fontSize: scaledPixels(16),
      color: '#aaa',
      fontWeight: '600',
    },
    metadataValue: {
      fontSize: scaledPixels(24),
      color: '#fff',
      fontWeight: 'bold',
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: scaledPixels(30),
    },
    tag: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      paddingVertical: scaledPixels(8),
      paddingHorizontal: scaledPixels(16),
      borderRadius: scaledPixels(20),
      marginRight: scaledPixels(10),
      marginBottom: scaledPixels(10),
    },
    tagText: {
      color: '#fff',
      fontSize: scaledPixels(16),
      fontWeight: '600',
    },
  });
};
