import { supabase, TABLES, isConfigured } from './client';

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

// Upload image to Supabase Storage
export const uploadWatchImage = async (file, fileName) => {
  try {
    checkSupabaseAvailable();
    const { data, error } = await supabase.storage
      .from('watch-images')
      .upload(fileName, file);

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
