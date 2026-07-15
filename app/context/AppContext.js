import React, { createContext, useContext, useState, useEffect } from 'react';
import { getWatches, saveWatches } from '../utils/storage';
import {
  getWatchesFromSupabase,
  addWatchToSupabase,
  updateWatchInSupabase,
  deleteWatchFromSupabase,
  toggleWatchFavorite,
} from '../supabase/watchService';
import { isConfigured } from '../supabase/client';

const AppContext = createContext();

export const AppProvider = ({ children, navigationRef }) => {
  // --- Navigation State (Custom navigation for Stack Navigator control) ---
  const [currentScreen, setCurrentScreen] = useState('Dashboard');
  const [params, setParams] = useState(null);

  // Initialize navigation ref from prop
  React.useEffect(() => {
    if (navigationRef && navigationRef.current) {
      setNavigationRef(navigationRef.current);
    }
  }, [navigationRef]);

  const setNavigationRef = (ref) => {
    navigationRef.current = ref;
  };

  const navigate = (screen, screenParams = null) => {
    setParams(screenParams);
    setCurrentScreen(screen);
    if (navigationRef.current) {
      navigationRef.current.navigate(screen, screenParams);
    }
  };

  const goBack = () => {
    if (navigationRef.current) {
      navigationRef.current.goBack();
    }
  };

  const resetTo = (screen, screenParams = null) => {
    setParams(screenParams);
    setCurrentScreen(screen);
    if (navigationRef.current) {
      navigationRef.current.reset({
        index: 0,
        routes: [{ name: screen, params: screenParams }],
      });
    }
  };

  // --- Watches Data State ---
  const [watches, setWatches] = useState([]);
  const [loading, setLoading] = useState(true);
  // Automatically use Supabase if configured, otherwise use local storage
  const [useSupabase, setUseSupabase] = useState(isConfigured);

  useEffect(() => {
    const initWatches = async () => {
      setLoading(true);
      try {
        if (useSupabase && isConfigured) {
          console.log('Fetching watches from Supabase...');
          // Try to fetch from Supabase
          const supabaseWatches = await getWatchesFromSupabase();
          // Convert Supabase format to app format
          const formattedWatches = supabaseWatches.map(w => ({
            id: w.id,
            brand: w.brand,
            name: w.name,
            price: w.price ? w.price.toString() : '',
            description: w.description,
            gender: w.gender,
            strap: w.strap,
            type: w.type,
            color: w.color,
            image: w.image,
            isFavorite: w.is_favorite,
          }));
          setWatches(formattedWatches);
          console.log('Successfully loaded watches from Supabase:', formattedWatches.length);
        } else {
          console.log('Using local storage for watches...');
          // Use local storage
          const stored = await getWatches();
          setWatches(stored);
        }
      } catch (error) {
        console.error('Error initializing watches:', error);
        // Fallback to local storage on error
        const stored = await getWatches();
        setWatches(stored);
      }
      setLoading(false);
    };
    initWatches();
  }, [useSupabase, isConfigured]);

  const addWatch = async (newWatch) => {
    if (useSupabase && isConfigured) {
      try {
        console.log('Adding watch to Supabase...');
        const addedWatch = await addWatchToSupabase(newWatch);
        const formattedWatch = {
          id: addedWatch.id,
          brand: addedWatch.brand,
          name: addedWatch.name,
          price: addedWatch.price ? addedWatch.price.toString() : '',
          description: addedWatch.description,
          gender: addedWatch.gender,
          strap: addedWatch.strap,
          type: addedWatch.type,
          color: addedWatch.color,
          image: addedWatch.image,
          isFavorite: addedWatch.is_favorite,
        };
        setWatches([formattedWatch, ...watches]);
        console.log('Successfully added watch to Supabase:', formattedWatch.id);
      } catch (error) {
        console.error('Error adding watch to Supabase:', error);
        // Fallback to local storage
        console.log('Falling back to local storage...');
        const watchWithId = {
          ...newWatch,
          id: Date.now().toString(),
          isFavorite: false,
        };
        const updated = [...watches, watchWithId];
        setWatches(updated);
        await saveWatches(updated);
      }
    } else {
      console.log('Adding watch to local storage...');
      const watchWithId = {
        ...newWatch,
        id: Date.now().toString(),
        isFavorite: false,
      };
      const updated = [...watches, watchWithId];
      setWatches(updated);
      await saveWatches(updated);
    }
  };

  const updateWatch = async (id, updatedFields) => {
    if (useSupabase && isConfigured) {
      try {
        console.log('Updating watch in Supabase:', id);
        await updateWatchInSupabase(id, updatedFields);
        const updated = watches.map((w) => (w.id === id ? { ...w, ...updatedFields } : w));
        setWatches(updated);
        console.log('Successfully updated watch in Supabase');
      } catch (error) {
        console.error('Error updating watch in Supabase:', error);
        // Fallback to local storage
        console.log('Falling back to local storage...');
        const updated = watches.map((w) => (w.id === id ? { ...w, ...updatedFields } : w));
        setWatches(updated);
        await saveWatches(updated);
      }
    } else {
      console.log('Updating watch in local storage...');
      const updated = watches.map((w) => (w.id === id ? { ...w, ...updatedFields } : w));
      setWatches(updated);
      await saveWatches(updated);
    }
  };

  const deleteWatch = async (id) => {
    if (useSupabase && isConfigured) {
      try {
        console.log('Deleting watch from Supabase:', id);
        await deleteWatchFromSupabase(id);
        const updated = watches.filter((w) => w.id !== id);
        setWatches(updated);
        console.log('Successfully deleted watch from Supabase');
      } catch (error) {
        console.error('Error deleting watch from Supabase:', error);
        // Fallback to local storage
        console.log('Falling back to local storage...');
        const updated = watches.filter((w) => w.id !== id);
        setWatches(updated);
        await saveWatches(updated);
      }
    } else {
      console.log('Deleting watch from local storage...');
      const updated = watches.filter((w) => w.id !== id);
      setWatches(updated);
      await saveWatches(updated);
    }
  };

  const toggleFavorite = async (id) => {
    const watch = watches.find((w) => w.id === id);
    if (!watch) return;

    if (useSupabase) {
      try {
        await toggleWatchFavorite(id, watch.isFavorite);
        const updated = watches.map((w) => (w.id === id ? { ...w, isFavorite: !w.isFavorite } : w));
        setWatches(updated);
      } catch (error) {
        console.error('Error toggling favorite in Supabase:', error);
        // Fallback to local storage
        const updated = watches.map((w) => (w.id === id ? { ...w, isFavorite: !w.isFavorite } : w));
        setWatches(updated);
        await saveWatches(updated);
      }
    } else {
      const updated = watches.map((w) => (w.id === id ? { ...w, isFavorite: !w.isFavorite } : w));
      setWatches(updated);
      await saveWatches(updated);
    }
  };

  return (
    <AppContext.Provider
      value={{
        // Navigation
        currentScreen,
        params,
        navigate,
        goBack,
        resetTo,
        setNavigationRef,
        // Watches
        watches,
        loading,
        addWatch,
        updateWatch,
        deleteWatch,
        toggleFavorite,
        // Supabase
        useSupabase,
        setUseSupabase,
        isConfigured,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
