import { Dimensions, Platform, PixelRatio } from 'react-native';

// Get window dimensions
const { width: WINDOW_WIDTH } = Dimensions.get('window');

// Base dimensions
const baseWidth = 1920; // Standard TV resolution width
const baseFontSize = 16;

/**
 * Scales a pixel value based on the device's screen width
 * relative to a standard TV resolution width (1920px).
 * For TV apps, scaling is more aggressive.
 *
 * @param size - Size in pixels to be scaled
 * @returns - Scaled size in pixels
 */
export const scaledPixels = (size: number): number => {
  // Different scaling for different platforms
  if (Platform.OS === 'web' && Platform.isTV) {
    // TV web scaling - calculate based on viewport width
    const scale = WINDOW_WIDTH / baseWidth;
    return Math.round(size * scale);
  } else if (Platform.OS === 'android' && Platform.isTV) {
    // Android TV scaling
    const scale = WINDOW_WIDTH / baseWidth;
    return Math.round(size * scale);
  } else if (Platform.OS === 'ios' && Platform.isTV) {
    // tvOS scaling
    const scale = WINDOW_WIDTH / baseWidth;
    return Math.round(size * scale);
  } else {
    // Mobile/Desktop scaling - less aggressive
    const scale = Math.min(WINDOW_WIDTH / 375, 2); // Cap at 2x for mobile
    return Math.round(PixelRatio.roundToNearestPixel(size * scale));
  }
};

/**
 * Scales font sizes based on platform
 *
 * @param size - Font size to be scaled
 * @returns - Scaled font size
 */
export const scaledFontSize = (size: number): number => {
  return scaledPixels(size);
};

/**
 * Returns whether the current device is a TV
 *
 * @returns boolean - true if device is a TV
 */
export const isTV = (): boolean => {
  return Platform.isTV === true;
};

/**
 * Returns whether the current device has a large screen
 * Useful for responsive UI decisions
 *
 * @returns boolean - true if device has a large screen
 */
export const isLargeScreen = (): boolean => {
  return WINDOW_WIDTH >= 768;
};

/**
 * Listen for dimension changes
 * @param callback Function to call when dimensions change
 * @returns Subscription to be used with .remove()
 */
export const addDimensionListener = (callback: () => void) => {
  return Dimensions.addEventListener('change', callback);
};