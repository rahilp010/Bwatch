import React from 'react';
import { StatusBar, StyleSheet, View, TouchableOpacity, Keyboard } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, NavigationIndependentTree } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/Feather';
import Toast from 'react-native-toast-message';
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

function App(): React.JSX.Element {
  const navigationRef = React.useRef<any>(null);
  
  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef}>
        <AppProvider navigationRef={navigationRef}>
          <AppNavigator />
        </AppProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

function AppNavigator(): React.JSX.Element {
  const { currentScreen, resetTo } = useApp();
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
  } else if (currentScreen === 'CatalogueBuilder' || currentScreen === 'PDFPreview') {
    activeTab = 'catalogue';
  }

  // Floating dock navigation handler
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F8FA" />
      
      {/* Stack Navigator with custom bottom navigation */}
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
        <Stack.Screen name="CatalogueBuilder" component={CatalogueBuilderScreen} />
        <Stack.Screen name="PDFPreview" component={PDFPreviewScreen} />
      </Stack.Navigator>

      {/* GLOBAL FLOATING BOTTOM NAVIGATION DOCK (Hidden when keyboard is active) */}
      {!isKeyboardVisible && (
        <View style={styles.bottomNavContainer}>
          <View style={styles.bottomNav}>
            <TouchableOpacity
              style={[styles.navItem, activeTab === 'home' && styles.navItemActiveWrapper]}
              onPress={() => handleTabPress('home')}
              activeOpacity={0.8}
            >
              <Icon
                name="home"
                size={20}
                color={activeTab === 'home' ? '#000' : '#FFF'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navItem, activeTab === 'favorites' && styles.navItemActiveWrapper]}
              onPress={() => handleTabPress('favorites')}
              activeOpacity={0.8}
            >
              <Icon 
                name="heart" 
                size={20} 
                color={activeTab === 'favorites' ? '#000' : '#FFF'} 
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navItem, activeTab === 'add' && styles.navItemActiveWrapper]}
              onPress={() => handleTabPress('add')}
              activeOpacity={0.8}
            >
              <Icon 
                name="plus-circle" 
                size={20} 
                color={activeTab === 'add' ? '#000' : '#FFF'} 
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navItem, activeTab === 'catalogue' && styles.navItemActiveWrapper]}
              onPress={() => handleTabPress('catalogue')}
              activeOpacity={0.8}
            >
              <Icon 
                name="book-open" 
                size={20} 
                color={activeTab === 'catalogue' ? '#000' : '#FFF'} 
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
  screenContainer: {
    flex: 1,
  },
  bottomNavContainer: {
    position: 'absolute',
    bottom: 25,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999, // Ensure it floats above all screen content
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#1C1C1C', // Deep premium dark grey/black
    width: '80%',
    height: 65,
    borderRadius: 35,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  navItem: {
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navItemActiveWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    width: 45,
    height: 45,
  },
});

export default App;
