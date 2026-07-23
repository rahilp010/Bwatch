/**
 * Responsive Design System
 * Handles responsive layouts for different screen sizes (phones, tablets)
 */

import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

// Device type detection
export const isTablet = () => {
  const isPad = Platform.OS === 'ios' && Platform.isPad;
  const isAndroidTablet = Platform.OS === 'android' && Math.min(width, height) >= 600;
  return isPad || isAndroidTablet;
};

export const isPhone = () => !isTablet();

// Breakpoints
export const BREAKPOINTS = {
  small: 375,   // Small phones
  medium: 414,  // Large phones
  large: 768,   // Tablets
  xlarge: 1024, // Large tablets
};

// Current device breakpoint
export const getCurrentBreakpoint = () => {
  if (width >= BREAKPOINTS.xlarge) return 'xlarge';
  if (width >= BREAKPOINTS.large) return 'large';
  if (width >= BREAKPOINTS.medium) return 'medium';
  return 'small';
};

// Responsive spacing
export const SPACING = {
  small: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
  },
  medium: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
  },
  large: {
    xs: 8,
    sm: 12,
    md: 20,
    lg: 24,
    xl: 32,
    xxl: 40,
  },
  xlarge: {
    xs: 8,
    sm: 16,
    md: 24,
    lg: 32,
    xl: 40,
    xxl: 48,
  },
};

// Get spacing based on current device
export const getSpacing = (size = 'md') => {
  const breakpoint = getCurrentBreakpoint();
  return SPACING[breakpoint][size] || SPACING.medium[size];
};

// Responsive grid columns
export const GRID = {
  small: { columns: 2, gap: 12 },
  medium: { columns: 2, gap: 16 },
  large: { columns: 3, gap: 20 },
  xlarge: { columns: 4, gap: 24 },
};

// Get grid config based on current device
export const getGridConfig = () => {
  const breakpoint = getCurrentBreakpoint();
  return GRID[breakpoint] || GRID.medium;
};

// Responsive font scale
export const FONT_SCALE = {
  small: 0.9,
  medium: 1.0,
  large: 1.1,
  xlarge: 1.2,
};

// Get font scale based on current device
export const getFontScale = () => {
  const breakpoint = getCurrentBreakpoint();
  return FONT_SCALE[breakpoint] || FONT_SCALE.medium;
};

// Responsive container padding
export const getContainerPadding = () => {
  if (isTablet()) {
    return 32;
  }
  return 16;
};

// Responsive card width calculation
export const getCardWidth = (columns = 2) => {
  const spacing = getSpacing('lg');
  const containerPadding = getContainerPadding() * 2;
  const totalSpacing = spacing * (columns - 1);
  const availableWidth = width - containerPadding - totalSpacing;
  return Math.floor(availableWidth / columns);
};

// Screen dimensions helpers
export const SCREEN = {
  width,
  height,
  isPortrait: height > width,
  isLandscape: width > height,
};

export default {
  isTablet,
  isPhone,
  getCurrentBreakpoint,
  getSpacing,
  getGridConfig,
  getFontScale,
  getContainerPadding,
  getCardWidth,
  SCREEN,
};
