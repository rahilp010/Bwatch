/**
 * Haptic Feedback Utilities
 * Provides standardized haptic feedback throughout the app
 */

import { Platform } from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

const options = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

// Check if haptics are available
export const isHapticsAvailable = () => {
  return Platform.OS === 'ios' || Platform.OS === 'android';
};

// Haptic feedback types
export const HAPTIC_TYPES = {
  LIGHT: 'light',
  MEDIUM: 'medium',
  HEAVY: 'heavy',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
  SELECTION: 'selection',
  IMPACT: 'impact',
};

// Trigger haptic feedback
export const triggerHaptic = (type = HAPTIC_TYPES.LIGHT) => {
  if (!isHapticsAvailable()) return;

  try {
    switch (type) {
      case HAPTIC_TYPES.LIGHT:
        ReactNativeHapticFeedback.trigger('impactLight', options);
        break;
      case HAPTIC_TYPES.MEDIUM:
        ReactNativeHapticFeedback.trigger('impactMedium', options);
        break;
      case HAPTIC_TYPES.HEAVY:
        ReactNativeHapticFeedback.trigger('impactHeavy', options);
        break;
      case HAPTIC_TYPES.SUCCESS:
        ReactNativeHapticFeedback.trigger('notificationSuccess', options);
        break;
      case HAPTIC_TYPES.WARNING:
        ReactNativeHapticFeedback.trigger('notificationWarning', options);
        break;
      case HAPTIC_TYPES.ERROR:
        ReactNativeHapticFeedback.trigger('notificationError', options);
        break;
      case HAPTIC_TYPES.SELECTION:
        ReactNativeHapticFeedback.trigger('selection', options);
        break;
      case HAPTIC_TYPES.IMPACT:
        ReactNativeHapticFeedback.trigger('impactMedium', options);
        break;
      default:
        ReactNativeHapticFeedback.trigger('impactLight', options);
    }
  } catch (error) {
    console.log('Haptic feedback error:', error);
  }
};

// Common haptic feedback scenarios
export const haptics = {
  // Button press
  buttonPress: () => triggerHaptic(HAPTIC_TYPES.LIGHT),
  
  // Card selection
  cardSelect: () => triggerHaptic(HAPTIC_TYPES.SELECTION),
  
  // Success action
  success: () => triggerHaptic(HAPTIC_TYPES.SUCCESS),
  
  // Warning action
  warning: () => triggerHaptic(HAPTIC_TYPES.WARNING),
  
  // Error action
  error: () => triggerHaptic(HAPTIC_TYPES.ERROR),
  
  // Tab switch
  tabSwitch: () => triggerHaptic(HAPTIC_TYPES.LIGHT),
  
  // Modal open
  modalOpen: () => triggerHaptic(HAPTIC_TYPES.MEDIUM),
  
  // Modal close
  modalClose: () => triggerHaptic(HAPTIC_TYPES.LIGHT),
  
  // Delete action
  delete: () => triggerHaptic(HAPTIC_TYPES.HEAVY),
  
  // Save action
  save: () => triggerHaptic(HAPTIC_TYPES.SUCCESS),
  
  // Refresh
  refresh: () => triggerHaptic(HAPTIC_TYPES.LIGHT),
};

export default haptics;
