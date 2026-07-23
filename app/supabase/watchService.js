import { supabase, TABLES, isConfigured } from './client';
import RNFS from 'react-native-fs';

/**
 * Watch Service - Handles all Supabase operations for watches
 */

// Helper function to check if Supabase is available
const checkSupabaseAvailable = () => {
  if (!isConfigured || !supabase) {
    throw new Error('Supabase is not configured or client is null');
  }
};

// Get all watches
export const getWatchesFromSupabase = async () => {
  try {
    checkSupabaseAvailable();
    const { data, error } = await supabase
      .from(TABLES.WATCHES)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching watches:', error);
    throw error;
  }
};

// Get a single watch by ID
export const getWatchById = async (id) => {
  try {
    const { data, error } = await supabase
      .from(TABLES.WATCHES)
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching watch:', error);
    throw error;
  }
};

// Get favorite watches
export const getFavoriteWatches = async () => {
  try {
    checkSupabaseAvailable();
    const { data, error } = await supabase
      .from(TABLES.WATCHES)
      .select('*')
      .eq('is_favorite', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching favorite watches:', error);
    throw error;
  }
};

// Add a new watch
export const addWatchToSupabase = async (watchData) => {
  try {
    checkSupabaseAvailable();
    const { data, error } = await supabase
      .from(TABLES.WATCHES)
      .insert([{
        brand: watchData.brand,
        name: watchData.name,
        price: watchData.price ? parseFloat(watchData.price) : null,
        description: watchData.description,
        gender: watchData.gender || 'Men',
        strap: watchData.strap || 'Metal',
        type: watchData.type || 'Analogue',
        color: watchData.color || 'Silver',
        image: watchData.image,
        is_favorite: watchData.isFavorite || false,
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding watch:', error);
    throw error;
  }
};

// Update a watch
export const updateWatchInSupabase = async (id, updatedFields) => {
  try {
    checkSupabaseAvailable();
    const updateData = {};
    
    if (updatedFields.brand !== undefined) updateData.brand = updatedFields.brand;
    if (updatedFields.name !== undefined) updateData.name = updatedFields.name;
    if (updatedFields.price !== undefined) updateData.price = updatedFields.price ? parseFloat(updatedFields.price) : null;
    if (updatedFields.description !== undefined) updateData.description = updatedFields.description;
    if (updatedFields.gender !== undefined) updateData.gender = updatedFields.gender;
    if (updatedFields.strap !== undefined) updateData.strap = updatedFields.strap;
    if (updatedFields.type !== undefined) updateData.type = updatedFields.type;
    if (updatedFields.color !== undefined) updateData.color = updatedFields.color;
    if (updatedFields.image !== undefined) updateData.image = updatedFields.image;
    if (updatedFields.isFavorite !== undefined) updateData.is_favorite = updatedFields.isFavorite;

    const { data, error } = await supabase
      .from(TABLES.WATCHES)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating watch:', error);
    throw error;
  }
};

// Delete a watch
export const deleteWatchFromSupabase = async (id) => {
  try {
    const { error } = await supabase
      .from(TABLES.WATCHES)
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting watch:', error);
    throw error;
  }
};

// Toggle favorite status
export const toggleWatchFavorite = async (id, currentStatus) => {
  try {
    const { data, error } = await supabase
      .from(TABLES.WATCHES)
      .update({ is_favorite: !currentStatus })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error toggling favorite:', error);
    throw error;
  }
};

// Get optimized image URL for display (smaller size, faster loading)
export const getOptimizedImageUrl = (imageUrl, width = 400, quality = 80) => {
  if (!imageUrl || !imageUrl.includes('supabase.co')) {
    return imageUrl;
  }
  
  try {
    const url = new URL(imageUrl);
    // Add Supabase image transformation parameters
    url.searchParams.set('width', width.toString());
    url.searchParams.set('quality', quality.toString());
    url.searchParams.set('resize', 'contain');
    return url.toString();
  } catch (error) {
    console.error('Error optimizing image URL:', error);
    return imageUrl;
  }
};

// Get high quality image URL for PDF generation
export const getHighQualityImageUrl = (imageUrl) => {
  if (!imageUrl || !imageUrl.includes('supabase.co')) {
    return imageUrl;
  }
  
  try {
    const url = new URL(imageUrl);
    // Remove any existing transformations
    url.search = '';
    // Add high quality parameters
    url.searchParams.set('width', '1200');
    url.searchParams.set('quality', '95');
    url.searchParams.set('resize', 'contain');
    return url.toString();
  } catch (error) {
    console.error('Error getting high quality image URL:', error);
    return imageUrl;
  }
};

// Helper to decode base64 to Uint8Array for React Native binary upload support
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const lookup = new Uint8Array(256);
for (let i = 0; i < chars.length; i++) {
  lookup[chars.charCodeAt(i)] = i;
}

const decodeBase64 = (base64) => {
  let bufferLength = base64.length * 0.75;
  let len = base64.length;
  let p = 0;
  
  if (base64[base64.length - 1] === '=') {
    bufferLength--;
    if (base64[base64.length - 2] === '=') {
      bufferLength--;
    }
  }
  
  const arrayBuffer = new ArrayBuffer(bufferLength);
  const bytes = new Uint8Array(arrayBuffer);
  
  for (let i = 0; i < len; i += 4) {
    const encoded1 = lookup[base64.charCodeAt(i)];
    const encoded2 = lookup[base64.charCodeAt(i + 1)];
    const encoded3 = lookup[base64.charCodeAt(i + 2)];
    const encoded4 = lookup[base64.charCodeAt(i + 3)];
    
    bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
    if (p < bufferLength) bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
    if (p < bufferLength) bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
  }
  
  return bytes;
};

// Upload image to Supabase Storage
export const uploadWatchImage = async (uri, fileName) => {
  try {
    checkSupabaseAvailable();

    // Read the file from the local uri as base64
    const path = uri.startsWith('file://') ? uri.replace('file://', '') : uri;
    const base64Data = await RNFS.readFile(path, 'base64');
    const binaryData = decodeBase64(base64Data);

    const { data, error } = await supabase.storage
      .from('watch-images')
      .upload(fileName, binaryData, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) throw error;
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('watch-images')
      .getPublicUrl(fileName);
    
    return publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};
