import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  Animated,
  SafeAreaView,
  StatusBar,
  Alert,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Toast from 'react-native-toast-message';
import { useApp } from '../context/AppContext';

const { width } = Dimensions.get('window');

// --- THEME CONSTANTS MATCHING DESIGN SYSTEM ---
const THEME = {
  background: '#E6E6E6',
  surface: '#FFFFFF',
  primary: '#1C1C1E',
  textDark: '#1C1C1E',
  textLight: '#FFFFFF',
  textMuted: '#8E8E93',
  accentColor: '#F0FE67',
  imageBg: '#FFFFFF',
};

const WatchDetailsScreen = () => {
  const { params, watches, deleteWatch, toggleFavorite, goBack, navigate } =
    useApp();

  const watchId = params?.watchId;
  const watch = watches.find(w => w.id === watchId);

  const fadeAnimImage = useRef(new Animated.Value(0)).current;
  const slideAnimImage = useRef(new Animated.Value(30)).current;

  const fadeAnimTitle = useRef(new Animated.Value(0)).current;
  const slideAnimTitle = useRef(new Animated.Value(30)).current;

  const fadeAnimSpecs = useRef(new Animated.Value(0)).current;
  const slideAnimSpecs = useRef(new Animated.Value(30)).current;

  const fadeAnimDesc = useRef(new Animated.Value(0)).current;
  const slideAnimDesc = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    if (!watch) return;

    const createAnimation = (fadeVal, slideVal) => {
      return Animated.parallel([
        Animated.timing(fadeVal, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideVal, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]);
    };

    Animated.stagger(120, [
      createAnimation(fadeAnimImage, slideAnimImage),
      createAnimation(fadeAnimTitle, slideAnimTitle),
      createAnimation(fadeAnimSpecs, slideAnimSpecs),
      createAnimation(fadeAnimDesc, slideAnimDesc),
    ]).start();
  }, [watchId]);

  if (!watch) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Icon name="alert-triangle" size={48} color={THEME.textMuted} />
        <Text style={styles.errorText}>Watch details could not be loaded.</Text>
        <TouchableOpacity style={styles.errorButton} onPress={() => goBack()}>
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const handleDelete = () => {
    Alert.alert(
      'Delete Timepiece',
      `Are you sure you want to remove the ${watch.brand} ${watch.name} from your collection?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteWatch(watch.id);
            Toast.show({
              type: 'success',
              text1: 'Deleted',
              text2: 'Timepiece removed from collection.',
            });
            navigate('Dashboard');
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.background} />

      {/* HEADER MATCHING DASHBOARD */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: THEME.surface }]}
          onPress={() => goBack()}
        >
          <Icon name="arrow-left" size={20} color={THEME.textDark} />
        </TouchableOpacity>

        <Text style={styles.logoText}>Details</Text>

        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: THEME.primary }]}
          onPress={() => toggleFavorite(watch.id)}
        >
          <Icon
            name="heart"
            size={20}
            color={watch.isFavorite ? THEME.accentColor : THEME.textLight}
            style={watch.isFavorite && { fill: THEME.accentColor }}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* HERO IMAGE SECTION */}
        <Animated.View
          style={[
            styles.imageContainer,
            {
              opacity: fadeAnimImage,
              transform: [{ translateY: slideAnimImage }],
            },
          ]}
        >
          <Image source={{ uri: watch.image }} style={styles.watchImage} />
        </Animated.View>

        {/* TITLE & PRICE SECTION */}
        <Animated.View
          style={[
            styles.titleSection,
            {
              opacity: fadeAnimTitle,
              transform: [{ translateY: slideAnimTitle }],
            },
          ]}
        >
          <Text style={styles.brandSubtitle}>{watch.brand}</Text>
          <View style={styles.titleRow}>
            <Text style={styles.mainTitle}>{watch.name}</Text>
            <Text style={styles.price}>
              {watch.price
                ? `₹${parseFloat(watch.price).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}`
                : 'N/A'}
            </Text>
          </View>
        </Animated.View>

        {/* SPECIFICATIONS GRID */}
        <Animated.View
          style={[
            styles.specsContainer,
            {
              opacity: fadeAnimSpecs,
              transform: [{ translateY: slideAnimSpecs }],
            },
          ]}
        >
          <View style={styles.specRow}>
            <View
              style={[
                styles.specItem,
                styles.specItemBorderRight,
                styles.specItemBorderBottom,
              ]}
            >
              <Text style={styles.specLabel}>GENDER</Text>
              <Text style={styles.specValue}>{watch.gender || 'Men'}</Text>
            </View>
            <View style={[styles.specItem, styles.specItemBorderBottom]}>
              <Text style={styles.specLabel}>STRAP</Text>
              <Text style={styles.specValue}>{watch.strap || 'Metal'}</Text>
            </View>
          </View>
          <View style={styles.specRow}>
            <View style={[styles.specItem, styles.specItemBorderRight]}>
              <Text style={styles.specLabel}>TYPE</Text>
              <Text style={styles.specValue}>{watch.type || 'Analogue'}</Text>
            </View>
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>COLOR</Text>
              <View style={styles.colorWrapper}>
                <View style={styles.colorDot} />
                <Text style={styles.specValue}>
                  {watch.color || 'Silver Dial'}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* DESCRIPTION & FEATURES */}
        <Animated.View
          style={[
            styles.descSection,
            {
              opacity: fadeAnimDesc,
              transform: [{ translateY: slideAnimDesc }],
            },
          ]}
        >
          <Text style={styles.sectionHeading}>Description</Text>
          <Text style={styles.descText}>{watch.description}</Text>

          {/* FEATURE BADGES */}
          <View style={styles.featuresRow}>
            <View style={styles.featureBox}>
              <Icon name="droplet" size={20} color={THEME.textDark} />
              <Text style={styles.featureText}>100m Water</Text>
            </View>
            <View style={styles.featureBox}>
              <Icon name="clock" size={20} color={THEME.textDark} />
              <Text style={styles.featureText}>48h Power</Text>
            </View>
            <View style={styles.featureBox}>
              <Icon name="settings" size={20} color={THEME.textDark} />
              <Text style={styles.featureText}>40mm Case</Text>
            </View>
          </View>
        </Animated.View>

        <View style={{ height: 180 }} />
      </ScrollView>

      {/* FLOATING BOTTOM ACTION BAR */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.secondaryIconButton}
          onPress={handleDelete}
        >
          <Icon name="trash-2" size={20} color="#E74C3C" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryIconButton}
          onPress={() => navigate('AddWatch', { watchId: watch.id })}
        >
          <Icon name="edit" size={20} color={THEME.textDark} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigate('CatalogueBuilder', { watchId: watch.id })}
        >
          <Icon
            name="book-open"
            size={18}
            color={THEME.textDark}
            style={styles.btnIcon}
          />
          <Text style={styles.primaryButtonText}>Catalogue</Text>
        </TouchableOpacity>
      </View>
      <Toast />
    </SafeAreaView>
  );
};

// --- STYLES ALIGNED WITH DESIGN SYSTEM ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '400',
    color: THEME.textDark,
    letterSpacing: -0.5,
  },
  iconButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 12,
  },
  imageContainer: {
    backgroundColor: THEME.imageBg,
    borderRadius: 32,
    height: 340,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  watchImage: {
    width: '100%',
    height: '100%',
  },
  titleSection: {
    marginTop: 24,
  },
  brandSubtitle: {
    fontSize: 14,
    color: THEME.textMuted,
    fontWeight: '500',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: '500',
    color: THEME.textDark,
    flex: 1,
    marginRight: 10,
    letterSpacing: -0.5,
  },
  price: {
    fontSize: 24,
    fontWeight: '700',
    color: THEME.textDark,
    marginTop: 4,
  },
  specsContainer: {
    marginTop: 24,
    borderRadius: 24,
    backgroundColor: THEME.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden',
  },
  specRow: {
    flexDirection: 'row',
  },
  specItem: {
    flex: 1,
    padding: 20,
  },
  specItemBorderRight: {
    borderRightWidth: 1,
    borderRightColor: THEME.background,
  },
  specItemBorderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: THEME.background,
  },
  specLabel: {
    fontSize: 12,
    color: THEME.textMuted,
    fontWeight: '500',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  specValue: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.textDark,
  },
  colorWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: THEME.textDark,
    marginRight: 8,
  },
  descSection: {
    marginTop: 32,
  },
  sectionHeading: {
    fontSize: 18,
    color: THEME.textDark,
    fontWeight: '500',
    marginBottom: 12,
  },
  descText: {
    fontSize: 15,
    color: THEME.textMuted,
    lineHeight: 24,
    fontWeight: '400',
  },
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  featureBox: {
    flex: 1,
    backgroundColor: THEME.surface,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  featureText: {
    fontSize: 12,
    fontWeight: '500',
    color: THEME.textDark,
    marginTop: 10,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 105,
    left: 20,
    right: 20,
    flexDirection: 'row',
    padding: 12,
    backgroundColor: THEME.surface,
    borderRadius: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
    zIndex: 10,
  },
  secondaryIconButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: THEME.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: THEME.accentColor,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 52,
    borderRadius: 26,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  btnIcon: {
    marginRight: 8,
  },
  primaryButtonText: {
    color: THEME.textDark,
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.background,
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: THEME.textMuted,
    fontWeight: '500',
    marginTop: 16,
    marginBottom: 24,
  },
  errorButton: {
    backgroundColor: THEME.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 26,
  },
  errorButtonText: {
    color: THEME.surface,
    fontSize: 15,
    fontWeight: '600',
  },
});

export default WatchDetailsScreen;
