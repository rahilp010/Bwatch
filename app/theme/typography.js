/**
 * Centralized Typography System
 * Standardizes font sizes and weights across the entire application
 */

import { getFontScale } from './responsive';

const scale = getFontScale();

export const TYPOGRAPHY = {
  // Font Families
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },

  // Font Weights
  fontWeight: {
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },

  // Font Sizes
  fontSize: {
    // Display sizes
    displayLarge: Math.round(32 * scale),
    displayMedium: Math.round(28 * scale),
    displaySmall: Math.round(24 * scale),

    // Heading sizes
    headingLarge: Math.round(20 * scale),
    headingMedium: Math.round(18 * scale),
    headingSmall: Math.round(16 * scale),

    // Body sizes
    bodyLarge: Math.round(16 * scale),
    bodyMedium: Math.round(14 * scale),
    bodySmall: Math.round(12 * scale),

    // Caption sizes
    captionLarge: Math.round(11 * scale),
    captionMedium: Math.round(10 * scale),
    captionSmall: Math.round(9 * scale),
  },

  // Letter Spacing
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
    widest: 1.5,
  },

  // Line Heights
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
};

// Pre-defined text styles for common use cases
export const TEXT_STYLES = {
  // Display Text
  displayLarge: {
    fontSize: TYPOGRAPHY.fontSize.displayLarge,
    fontWeight: TYPOGRAPHY.fontWeight.extrabold,
    letterSpacing: TYPOGRAPHY.letterSpacing.tight,
    lineHeight: Math.round(TYPOGRAPHY.fontSize.displayLarge * TYPOGRAPHY.lineHeight.tight),
  },
  displayMedium: {
    fontSize: TYPOGRAPHY.fontSize.displayMedium,
    fontWeight: TYPOGRAPHY.fontWeight.extrabold,
    letterSpacing: TYPOGRAPHY.letterSpacing.tight,
    lineHeight: Math.round(TYPOGRAPHY.fontSize.displayMedium * TYPOGRAPHY.lineHeight.tight),
  },
  displaySmall: {
    fontSize: TYPOGRAPHY.fontSize.displaySmall,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    letterSpacing: TYPOGRAPHY.letterSpacing.tight,
    lineHeight: Math.round(TYPOGRAPHY.fontSize.displaySmall * TYPOGRAPHY.lineHeight.tight),
  },

  // Headings
  headingLarge: {
    fontSize: TYPOGRAPHY.fontSize.headingLarge,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    letterSpacing: TYPOGRAPHY.letterSpacing.tight,
    lineHeight: Math.round(TYPOGRAPHY.fontSize.headingLarge * TYPOGRAPHY.lineHeight.normal),
  },
  headingMedium: {
    fontSize: TYPOGRAPHY.fontSize.headingMedium,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    letterSpacing: TYPOGRAPHY.letterSpacing.tight,
    lineHeight: Math.round(TYPOGRAPHY.fontSize.headingMedium * TYPOGRAPHY.lineHeight.normal),
  },
  headingSmall: {
    fontSize: TYPOGRAPHY.fontSize.headingSmall,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    letterSpacing: TYPOGRAPHY.letterSpacing.normal,
    lineHeight: Math.round(TYPOGRAPHY.fontSize.headingSmall * TYPOGRAPHY.lineHeight.normal),
  },

  // Body Text
  bodyLarge: {
    fontSize: TYPOGRAPHY.fontSize.bodyLarge,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
    letterSpacing: TYPOGRAPHY.letterSpacing.normal,
    lineHeight: Math.round(TYPOGRAPHY.fontSize.bodyLarge * TYPOGRAPHY.lineHeight.relaxed),
  },
  bodyMedium: {
    fontSize: TYPOGRAPHY.fontSize.bodyMedium,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
    letterSpacing: TYPOGRAPHY.letterSpacing.normal,
    lineHeight: Math.round(TYPOGRAPHY.fontSize.bodyMedium * TYPOGRAPHY.lineHeight.relaxed),
  },
  bodySmall: {
    fontSize: TYPOGRAPHY.fontSize.bodySmall,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
    letterSpacing: TYPOGRAPHY.letterSpacing.normal,
    lineHeight: Math.round(TYPOGRAPHY.fontSize.bodySmall * TYPOGRAPHY.lineHeight.relaxed),
  },

  // Caption Text
  captionLarge: {
    fontSize: TYPOGRAPHY.fontSize.captionLarge,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    letterSpacing: TYPOGRAPHY.letterSpacing.wide,
    lineHeight: Math.round(TYPOGRAPHY.fontSize.captionLarge * TYPOGRAPHY.lineHeight.normal),
  },
  captionMedium: {
    fontSize: TYPOGRAPHY.fontSize.captionMedium,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    letterSpacing: TYPOGRAPHY.letterSpacing.wider,
    lineHeight: Math.round(TYPOGRAPHY.fontSize.captionMedium * TYPOGRAPHY.lineHeight.normal),
  },
  captionSmall: {
    fontSize: TYPOGRAPHY.fontSize.captionSmall,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    letterSpacing: TYPOGRAPHY.letterSpacing.widest,
    lineHeight: Math.round(TYPOGRAPHY.fontSize.captionSmall * TYPOGRAPHY.lineHeight.normal),
  },
};

export default TYPOGRAPHY;
