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

const PremiumWatchScreen = ({ navigation }) => {
  // Animation Values
  const fadeAnimTitle = useRef(new Animated.Value(0)).current;
  const slideAnimTitle = useRef(new Animated.Value(40)).current;

  const fadeAnimSubtitle = useRef(new Animated.Value(0)).current;
  const slideAnimSubtitle = useRef(new Animated.Value(40)).current;

  const fadeAnimButton = useRef(new Animated.Value(0)).current;
  const slideAnimButton = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    // Staggered animation for a premium mounting effect
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

      {/* Background Image Setup */}
      <View style={styles.imageContainer}>
        <Image
          // Replace with your exact local asset: require('./path/to/watch.png')
          source={hero}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
        {/* Gradient overlay to seamlessly blend the image into the black background */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)', '#000000']}
          style={styles.gradientOverlay}
        />
      </View>

      {/* Content Overlay */}
      <View style={styles.contentContainer}>
        <View style={styles.textSection}>
          <Animated.View
            style={{
              opacity: fadeAnimTitle,
              transform: [{ translateY: slideAnimTitle }],
            }}
          >
            <Text style={styles.titlePrimary}>Own a Piece</Text>
            <Text style={styles.titleSecondary}>of Time</Text>
          </Animated.View>

          <Animated.View
            style={{
              opacity: fadeAnimSubtitle,
              transform: [{ translateY: slideAnimSubtitle }],
            }}
          >
            <Text style={styles.subtitle}>
              Discover and collect extraordinary watches{'\n'}
              from the world's most prestigious brands.
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
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Dashboard')}
          >
            <Text style={styles.buttonText}>Explore Timepieces</Text>
            {/* Added subtle icon to fulfill the vector-icons requirement elegantly */}
            <Icon
              name="arrow-right"
              size={20}
              color="#000000"
              style={styles.buttonIcon}
            />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  imageContainer: {
    height: '70%',
    width: '100%',
    position: 'absolute',
    top: 0,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    opacity: 0.8, // Slightly dims the image to make text pop more
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: '40%', // Gradual fade across the bottom half of the image
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingBottom: 50,
  },
  textSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  titlePrimary: {
    fontSize: 36,
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  titleSecondary: {
    fontSize: 34,
    color: '#A0A0A0', // Slightly dimmer to recreate the effect in the design
    fontWeight: '300',
    textAlign: 'center',
    marginTop: -5,
  },
  subtitle: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 22,
    fontWeight: '400',
  },
  buttonWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    paddingVertical: 18,
    borderRadius: 30, // Fully rounded pill shape
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  buttonIcon: {
    marginLeft: 10,
    marginTop: 2,
  },
});

export default PremiumWatchScreen;
