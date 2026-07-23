/**
 * App Constants
 * Contains version information and other app-wide constants
 */

export const APP_CONFIG = {
  name: 'BWatch',
  version: '1.0.4',
  buildNumber: '104',
  displayName: 'BWatch',
  bundleId: 'com.bwatch',
  
  // API and service URLs
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  
  // Feature flags
  features: {
    supabaseEnabled: true,
    hapticsEnabled: true,
    analyticsEnabled: false,
  },
  
  // Storage keys
  storageKeys: {
    watches: '@bwatch_watches',
    settings: '@bwatch_settings',
    onboarding: '@bwatch_onboarding_complete',
  },
};

export const getVersionString = () => {
  return `${APP_CONFIG.version} (${APP_CONFIG.buildNumber})`;
};

export const getAppName = () => {
  return APP_CONFIG.displayName;
};

export default APP_CONFIG;
