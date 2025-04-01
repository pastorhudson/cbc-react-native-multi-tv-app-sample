import { useEffect, useState } from 'react';

// Define the types based on the provided JSON structure
export interface Video {
  quality: string;
  url: string;
  videoType: string;
}

export interface ContentItem {
  dateAdded: string;
  duration: number;
  language: string;
  videos: Video[];
}

// Modify the LiveFeed interface to make content compatible with ContentItem
export interface LiveFeed {
  id: string;
  title: string;
  shortDescription: string;
  thumbnail: string;
  genres: string[];
  tags: string[];
  releaseDate: string;
  content: {
    dateAdded: string;
    duration: number;
    language?: string; // Make language optional to match both types
    videos: Video[];
  };
  validityPeriodStart: string;
  validityPeriodEnd: string;
}

export interface Movie {
  id: string;
  title: string;
  shortDescription: string;
  thumbnail: string;
  genres: string[];
  tags: string[];
  releaseDate: string;
  content: ContentItem;
}

export interface FeedData {
  language: string;
  lastUpdated: string;
  liveFeeds: LiveFeed[];
  movies: Movie[];
  providerName: string;
}

// Function to format duration from seconds to minutes and seconds
export const formatDuration = (durationInSeconds: number): string => {
  const minutes = Math.floor(durationInSeconds / 60);
  const seconds = durationInSeconds % 60;
  return `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
};

// Hook to fetch and provide content data
export const useContentData = () => {
  const [contentData, setContentData] = useState<FeedData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('https://roku.cbcfamily.church/reactfeed');
        if (!response.ok) {
          throw new Error('Failed to fetch content');
        }
        const data = await response.json();
        setContentData(data);
      } catch (err) {
        console.error('Error fetching content:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, []);

  // Group content by series (based on titles that contain similar patterns)
  const getContentBySeries = () => {
    if (!contentData?.movies) return [];

    const seriesMap = new Map<string, Movie[]>();

    contentData.movies.forEach(movie => {
      // Extract series name from titles like "Series Name - Episode Info"
      const titleParts = movie.title.split(' - ');
      if (titleParts.length > 1) {
        const seriesName = titleParts[0];

        if (!seriesMap.has(seriesName)) {
          seriesMap.set(seriesName, []);
        }

        seriesMap.get(seriesName)?.push(movie);
      } else {
        // For standalone videos
        if (!seriesMap.has('Other')) {
          seriesMap.set('Other', []);
        }
        seriesMap.get('Other')?.push(movie);
      }
    });

    // Convert map to array of {name, videos} objects
    return Array.from(seriesMap.entries()).map(([name, videos]) => ({
      name,
      videos: videos.sort((a, b) =>
        new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
      )
    }));
  };

  // Get most recent videos (limited to a specific count)
  const getRecentVideos = (count = 10) => {
    if (!contentData?.movies) return [];

    return [...contentData.movies]
      .sort((a, b) =>
        new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
      )
      .slice(0, count);
  };

  // Get live streams that are currently active
  const getLiveStreams = () => {
    if (!contentData?.liveFeeds) return [];

    const now = new Date().getTime();

    return contentData.liveFeeds.filter(feed => {
      const startTime = new Date(feed.validityPeriodStart).getTime();
      const endTime = new Date(feed.validityPeriodEnd).getTime();
      return now >= startTime && now <= endTime;
    });
  };

  return {
    contentData,
    isLoading,
    error,
    getContentBySeries,
    getRecentVideos,
    getLiveStreams
  };
};