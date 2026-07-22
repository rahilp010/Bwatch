import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Animated,
  StatusBar,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import hero from '../assets/hero.png';

const { width, height } = Dimensions.get('window');

// Keep background dark to fit splash/image aesthetic, but match button/font styling to the system
const PremiumWatchScreen = ({ navigation }) => {
  const fadeAnimTitle = useRef(new Animated.Value(0)).current;
  const slideAnimTitle = useRef(new Animated.Value(40)).current;

  const fadeAnimSubtitle = useRef(new Animated.Value(0)).current;
  const slideAnimSubtitle = useRef(new Animated.Value(40)).current;

  const fadeAnimButton = useRef(new Animated.Value(0)).current;
  const slideAnimButton = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.stagger(200, [
      Animated.parallel([
        Animated.timing(fadeAnimTitle, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnimTitle, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(fadeAnimSubtitle, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnimSubtitle, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(fadeAnimButton, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnimButton, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      <View style={styles.imageContainer}>
        <Image
          source={hero}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(28,28,30,0.8)', '#1C1C1E']}
          style={styles.gradientOverlay}
        />
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.textSection}>
          <Animated.View
            style={{
              opacity: fadeAnimTitle,
              transform: [{ translateY: slideAnimTitle }],
            }}
          >
            <Text style={styles.titlePrimary}>B-WATCH</Text>
            <Text style={styles.titleSecondary}>Timepieces</Text>
          </Animated.View>

          <Animated.View
            style={{
              opacity: fadeAnimSubtitle,
              transform: [{ translateY: slideAnimSubtitle }],
            }}
          >
            <Text style={styles.subtitle}>
              Discover and collect extraordinary watches{'\n'}from the world's
              most prestigious brands.
            </Text>
          </Animated.View>
        </View>

        <Animated.View
          style={[
            styles.buttonWrapper,
            {
              opacity: fadeAnimButton,
              transform: [{ translateY: slideAnimButton }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('Dashboard')}
          >
            <Text style={styles.buttonText}>Explore Timepieces</Text>
            <Icon
              name="arrow-right"
              size={20}
              color="#1C1C1E"
              style={styles.buttonIcon}
            />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1C1C1E' },
  imageContainer: {
    height: '70%',
    width: '100%',
    position: 'absolute',
    top: 0,
  },
  backgroundImage: { width: '100%', height: '100%', opacity: 0.8 },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: '50%',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingBottom: 50,
  },
  textSection: { alignItems: 'center', marginBottom: 40 },
  titlePrimary: {
    fontSize: 40,
    color: '#FFFFFF',
    fontWeight: '400',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  titleSecondary: {
    fontSize: 40,
    color: '#F0FE67',
    fontWeight: '400',
    textAlign: 'center',
    marginTop: -5,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 22,
    fontWeight: '400',
  },
  buttonWrapper: { width: '100%', alignItems: 'center' },
  button: {
    backgroundColor: '#F0FE67',
    width: '100%',
    paddingVertical: 18,
    borderRadius: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F0FE67',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  buttonText: {
    color: '#1C1C1E',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  buttonIcon: { marginLeft: 10, marginTop: 2 },
});

export default PremiumWatchScreen;
