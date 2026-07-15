import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

// Replace these with your Supabase project URL and anon key
// You can set these in your .env file or hardcode them here for testing
const supabaseUrl = process.env.SUPABASE_URL || 'https://skayjgasnovhpauwmnrz.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrYXlqZ2Fzbm92aHBhdXdtbnJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MzkxMzAsImV4cCI6MjA5MzMxNTEzMH0.5_dIomVqlCDlb2bJkzX_kylWnpGhoOvhgXR-gTuaJ5E';

console.log("supabaseUrl: ", supabaseUrl);
console.log("supabaseAnonKey: ", supabaseAnonKey);

// Check if Supabase is properly configured
const isSupabaseConfigured = supabaseUrl && supabaseUrl !== 'YOUR_SUPABASE_URL' && 
                              supabaseAnonKey && supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY';

let supabaseClient = null;
try {
  if (isSupabaseConfigured) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    console.log('Supabase client initialized successfully');
  } else {
    console.log('Supabase is not configured - using local storage');
  }
} catch (error) {
  console.error('Error initializing Supabase client:', error);
  console.log('Falling back to local storage');
}

export const supabase = supabaseClient;
export const isConfigured = isSupabaseConfigured;

// Database table names
export const TABLES = {
  WATCHES: 'watches',
  WATCH_IMAGES: 'watch_images',
};
