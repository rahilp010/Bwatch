import React, { createContext, useContext, useState, useEffect } from 'react';
import { getWatches, saveWatches } from '../utils/storage';

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

  useEffect(() => {
    const initWatches = async () => {
      setLoading(true);
      const stored = await getWatches();
      setWatches(stored);
      setLoading(false);
    };
    initWatches();
  }, []);

  const addWatch = async (newWatch) => {
    const watchWithId = {
      ...newWatch,
      id: Date.now().toString(),
      isFavorite: false,
    };
    const updated = [...watches, watchWithId];
    setWatches(updated);
    await saveWatches(updated);
  };

  const updateWatch = async (id, updatedFields) => {
    const updated = watches.map((w) => (w.id === id ? { ...w, ...updatedFields } : w));
    setWatches(updated);
    await saveWatches(updated);
  };

  const deleteWatch = async (id) => {
    const updated = watches.filter((w) => w.id !== id);
    setWatches(updated);
    await saveWatches(updated);
  };

  const toggleFavorite = async (id) => {
    const updated = watches.map((w) => (w.id === id ? { ...w, isFavorite: !w.isFavorite } : w));
    setWatches(updated);
    await saveWatches(updated);
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
