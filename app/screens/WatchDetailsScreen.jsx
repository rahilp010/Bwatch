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
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Toast from 'react-native-toast-message';
import { useApp } from '../context/AppContext';

const WatchDetailsScreen = () => {
  const { params, watches, deleteWatch, toggleFavorite, goBack, navigate } = useApp();
  
  // Find current watch from global state
  const watchId = params?.watchId;
  const watch = watches.find(w => w.id === watchId);

  // Setup Animated Values for staggered entrance
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

    // Premium staggered animation sequence
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
        <Icon name="alert-triangle" size={48} color="#FF9800" />
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
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9F9FB" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIcon} onPress={() => goBack()}>
          <Icon name="arrow-left" size={22} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>B-WATCH</Text>
        <TouchableOpacity style={styles.headerIcon} onPress={() => toggleFavorite(watch.id)}>
          <Icon 
            name={watch.isFavorite ? 'heart' : 'heart'} 
            size={22} 
            color={watch.isFavorite ? '#E53935' : '#000'} 
            style={watch.isFavorite && { fill: '#E53935' }}
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
          <View style={styles.stockBadge}>
            <Text style={styles.stockText}>IN STOCK</Text>
          </View>
          <Image
            source={{ uri: watch.image }}
            style={styles.watchImage}
            resizeMode="contain"
          />
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
              {watch.price ? `$${parseFloat(watch.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : 'N/A'}
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
                <Text style={styles.specValue}>{watch.color || 'Silver Dial'}</Text>
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
          <Text style={styles.sectionHeading}>PROFESSIONAL DESCRIPTION</Text>
          <Text style={styles.descText}>
            {watch.description}
          </Text>

          {/* FEATURE BADGES */}
          <View style={styles.featuresRow}>
            <View style={styles.featureBox}>
              <Icon name="droplet" size={20} color="#000" />
              <Text style={styles.featureText}>100m Water</Text>
            </View>
            <View style={styles.featureBox}>
              <Icon name="clock" size={20} color="#000" />
              <Text style={styles.featureText}>48h Power</Text>
            </View>
            <View style={styles.featureBox}>
              <Icon name="settings" size={20} color="#000" />
              <Text style={styles.featureText}>40mm Case</Text>
            </View>
          </View>
        </Animated.View>

        {/* Space for absolute bottom actions and global bottom dock */}
        <View style={{ height: 160 }} />
      </ScrollView>

      {/* BOTTOM ACTION BAR */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.iconButton} onPress={handleDelete}>
          <Icon name="trash-2" size={20} color="#E53935" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={() => navigate('CatalogueBuilder', { watchId: watch.id })}
        >
          <Icon
            name="edit"
            size={18}
            color="#FFF"
            style={styles.btnIcon}
          />
          <Text style={styles.primaryButtonText}>Catalogue Builder</Text>
        </TouchableOpacity>
      </View>
      <Toast />
    </SafeAreaView>
  );
};

// --- STYLES ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9FB', // Clean off-white background
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    letterSpacing: 1.5,
  },
  headerIcon: {
    padding: 6,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  imageContainer: {
    backgroundColor: '#F0F0F2', // Soft grey for the product stage
    borderRadius: 16,
    height: 260,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  stockBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    zIndex: 10,
  },
  stockText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#333',
    letterSpacing: 0.5,
  },
  watchImage: {
    width: '90%',
    height: '80%',
  },
  titleSection: {
    marginTop: 25,
  },
  brandSubtitle: {
    fontSize: 12,
    color: '#888',
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    flex: 1,
    marginRight: 10,
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  specsContainer: {
    marginTop: 25,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  specRow: {
    flexDirection: 'row',
  },
  specItem: {
    flex: 1,
    padding: 16,
  },
  specItemBorderRight: {
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
  },
  specItemBorderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  specLabel: {
    fontSize: 10,
    color: '#888',
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  specValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  colorWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#000', // Dot representation
    marginRight: 6,
  },
  descSection: {
    marginTop: 30,
  },
  sectionHeading: {
    fontSize: 11,
    color: '#888',
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 12,
  },
  descText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
    fontWeight: '400',
  },
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 25,
  },
  featureBox: {
    flex: 1,
    backgroundColor: '#EAEAEF',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  featureText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#000',
    marginTop: 8,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 95, // Positioned right above the global floating bottom nav
    left: 20,
    right: 20,
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 10,
  },
  iconButton: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 14,
    marginRight: 12,
    backgroundColor: '#FFF',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#000',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  btnIcon: {
    marginRight: 8,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9F9FB',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#555',
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 20,
  },
  errorButton: {
    backgroundColor: '#000',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default WatchDetailsScreen;
