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
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
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
import { haptics } from './utils/haptics';
import Template from './screens/Template';

const Stack = createStackNavigator();

enableScreens();

// --- THEME MATCHING DASHBOARD ---
const THEME = {
  background: '#E6E6E6',
  surface: '#FFFFFF',
  primary: '#1C1C1E',
  accent: '#F0FE67',
  textMuted: '#8E8E93',
};

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
  } else if (currentScreen === 'Template') {
    activeTab = 'template';
  } else if (currentScreen === 'AddWatch') {
    activeTab = 'add';
  } else if (
    currentScreen === 'CatalogueBuilder' ||
    currentScreen === 'PDFPreview'
  ) {
    activeTab = 'catalogue';
  }
  const handleTabPress = (tabName: string) => {
    haptics.tabSwitch();
    if (tabName === 'home') {
      resetTo('Dashboard');
    } else if (tabName === 'template') {
      resetTo('Template');
    } else if (tabName === 'add') {
      resetTo('AddWatch');
    } else if (tabName === 'catalogue') {
      resetTo('CatalogueBuilder');
    }
  };  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.background} />

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
          <Stack.Screen name="Template" component={Template} />
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
                activeTab === 'home' && styles.navItemActive,
              ]}
              onPress={() => handleTabPress('home')}
              activeOpacity={0.8}
            >
              <MaterialIcons
                name="dashboard"
                size={26}
                color={activeTab === 'home' ? THEME.primary : THEME.textMuted}
              />
            </TouchableOpacity>

            {/* Tab 2: Template */}
            {/* <TouchableOpacity
              style={[
                styles.navItem,
                activeTab === 'template' && styles.navItemActive,
              ]}
              onPress={() => handleTabPress('template')}
              activeOpacity={0.8}
            >
              <Icon
                name="heart"
                size={22}
                color={
                  activeTab === 'template' ? THEME.primary : THEME.textMuted
                }
              />
            </TouchableOpacity> */}

            {/* Tab 3: Add Watch */}
            <TouchableOpacity
              style={[
                styles.navItem,
                activeTab === 'add' && styles.navItemActive,
              ]}
              onPress={() => handleTabPress('add')}
              activeOpacity={0.8}
            >
              <Icon
                name="plus"
                size={28}
                color={activeTab === 'add' ? THEME.primary : THEME.textMuted}
              />
            </TouchableOpacity>

            {/* Tab 4: Catalogue Builder */}
            <TouchableOpacity
              style={[
                styles.navItem,
                activeTab === 'catalogue' && styles.navItemActive,
              ]}
              onPress={() => handleTabPress('catalogue')}
              activeOpacity={0.8}
            >
              <Icon
                name="book-open"
                size={24}
                color={
                  activeTab === 'catalogue' ? THEME.primary : THEME.textMuted
                }
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
    backgroundColor: THEME.background,
  },
  bottomNavContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: THEME.surface,
    borderRadius: 100,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  navItem: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 3,
    backgroundColor: 'transparent',
  },
  navItemActive: {
    backgroundColor: THEME.accent,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
});

export default App;
