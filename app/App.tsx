import React from 'react';
import {
  StatusBar,
  StyleSheet,
  View,
  TouchableOpacity,
  Keyboard,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/Feather';
import Toast from 'react-native-toast-message';
import { enableScreens } from 'react-native-screens';

// @ts-ignore
import { AppProvider, useApp } from './context/AppContext';
// Import Screens
// @ts-ignore
import PremiumWatchScreen from './screens/PremiumWatchScreen';
// @ts-ignore
import Dashboard from './screens/Dashboard';
// @ts-ignore
import AddWatchScreen from './screens/AddWatchScreen';
// @ts-ignore
import WatchDetailsScreen from './screens/WatchDetailsScreen';
// @ts-ignore
import CatalogueBuilderScreen from './screens/CatalogueBuilderScreen';
// @ts-ignore
import PDFPreviewScreen from './screens/PDFPreviewScreen';

const Stack = createStackNavigator();

enableScreens();

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <AppNavigator />
      </AppProvider>
    </SafeAreaProvider>
  );
}

function AppNavigator(): React.JSX.Element {
  const { currentScreen, resetTo, setCurrentScreen, navigationRef } = useApp();
  const [isKeyboardVisible, setKeyboardVisible] = React.useState(false);

  React.useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setKeyboardVisible(true),
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setKeyboardVisible(false),
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Determine active tab for bottom floating dock
  let activeTab = 'home';
  if (currentScreen === 'Dashboard') {
    activeTab = 'home';
  } else if (currentScreen === 'Favorites') {
    activeTab = 'favorites';
  } else if (currentScreen === 'AddWatch') {
    activeTab = 'add';
  } else if (
    currentScreen === 'CatalogueBuilder' ||
    currentScreen === 'PDFPreview'
  ) {
    activeTab = 'catalogue';
  }

  const handleTabPress = (tabName: string) => {
    if (tabName === 'home') {
      resetTo('Dashboard');
    } else if (tabName === 'favorites') {
      resetTo('Favorites');
    } else if (tabName === 'add') {
      resetTo('AddWatch');
    } else if (tabName === 'catalogue') {
      resetTo('CatalogueBuilder');
    }
  };

  console.log('currentScreen =>', currentScreen);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F8FA" />

      {/* Navigation container moved here for context access */}
      <NavigationContainer
        ref={navigationRef}
        onStateChange={() => {
          const currentRouteName =
            navigationRef.current?.getCurrentRoute()?.name;
          if (currentRouteName) {
            setCurrentScreen(currentRouteName);
          }
        }}
      >
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: 'transparent' },
          }}
          initialRouteName="PremiumWatch"
        >
          <Stack.Screen name="PremiumWatch" component={PremiumWatchScreen} />
          <Stack.Screen name="Dashboard" component={Dashboard} />
          <Stack.Screen name="Favorites" component={Dashboard} />
          <Stack.Screen name="AddWatch" component={AddWatchScreen} />
          <Stack.Screen name="WatchDetails" component={WatchDetailsScreen} />
          <Stack.Screen
            name="CatalogueBuilder"
            component={CatalogueBuilderScreen}
          />
          <Stack.Screen name="PDFPreview" component={PDFPreviewScreen} />
        </Stack.Navigator>
      </NavigationContainer>

      {/* GLOBAL FLOATING BOTTOM NAVIGATION DOCK */}
      {!isKeyboardVisible && currentScreen !== 'PremiumWatch' && (
        <View style={styles.bottomNavContainer}>
          <View style={styles.bottomNav}>
            {/* Tab 1: Home */}
            <TouchableOpacity
              style={[
                styles.navItem,
                activeTab === 'home'
                  ? styles.navItemActive
                  : styles.navItemInactive,
              ]}
              onPress={() => handleTabPress('home')}
              activeOpacity={0.8}
            >
              <Icon
                name="home"
                size={22}
                color={activeTab === 'home' ? '#121212' : '#80848F'}
              />
            </TouchableOpacity>

            {/* Tab 2: Favorites */}
            <TouchableOpacity
              style={[
                styles.navItem,
                activeTab === 'favorites'
                  ? styles.navItemActive
                  : styles.navItemInactive,
              ]}
              onPress={() => handleTabPress('favorites')}
              activeOpacity={0.8}
            >
              <Icon
                name="heart"
                size={22}
                color={activeTab === 'favorites' ? '#121212' : '#80848F'}
              />
            </TouchableOpacity>

            {/* Tab 3: Add Watch */}
            <TouchableOpacity
              style={[
                styles.navItem,
                activeTab === 'add'
                  ? styles.navItemActive
                  : styles.navItemInactive,
              ]}
              onPress={() => handleTabPress('add')}
              activeOpacity={0.8}
            >
              <Icon
                name="plus"
                size={22}
                color={activeTab === 'add' ? '#121212' : '#80848F'}
              />
            </TouchableOpacity>

            {/* Tab 4: Catalogue Builder */}
            <TouchableOpacity
              style={[
                styles.navItem,
                activeTab === 'catalogue'
                  ? styles.navItemActive
                  : styles.navItemInactive,
              ]}
              onPress={() => handleTabPress('catalogue')}
              activeOpacity={0.8}
            >
              <Icon
                name="book-open"
                size={22}
                color={activeTab === 'catalogue' ? '#121212' : '#80848F'}
              />
            </TouchableOpacity>
          </View>
        </View>
      )}
      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8FA',
  },
  bottomNavContainer: {
    position: 'absolute',
    bottom: 30, // slightly higher off the bottom edge
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#121214', // Deep, dark almost-black outer pill
    borderRadius: 100, // Fully rounded pill shape
    padding: 6, // Padding to create the outer edge around inner circles
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
  },
  navItem: {
    width: 58, // Fixed square dimension turned into circle
    height: 58,
    borderRadius: 29, // Half of width/height for perfect circle
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 3, // Very tight spacing between icons
  },
  navItemInactive: {
    backgroundColor: '#212226', // Dark grey circular background for unselected
  },
  navItemActive: {
    backgroundColor: '#FFFFFF', // Stark white background for selected
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
});

export default App;
