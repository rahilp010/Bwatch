import React, { useEffect, useRef, useState } from 'react';
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
  Dimensions,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useApp } from '../context/AppContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width / 2 - 24; // 2 columns with padding

const Dashboard = () => {
  const { watches, loading, toggleFavorite, navigate, currentScreen } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  // Filter watches based on active tab ('Favorites' screen vs 'Dashboard' screen) and search query/category
  const isFavoritesScreen = currentScreen === 'Favorites';
  
  const filteredWatches = watches.filter((watch) => {
    const matchesTab = isFavoritesScreen ? watch.isFavorite : true;
    const matchesSearch =
      watch.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      watch.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' ||
      (selectedCategory === 'Men' && watch.gender === 'Men') ||
      (selectedCategory === 'Women' && watch.gender === 'Women') ||
      (selectedCategory === 'Unisex' && watch.gender === 'Unisex');
    
    return matchesTab && matchesSearch && matchesCategory;
  });

  // Staggered Animation Array
  const animatedValues = useRef([]);

  useEffect(() => {
    // Re-create animations list when list changes
    animatedValues.current = filteredWatches.map(() => new Animated.Value(0));

    const animations = animatedValues.current.map((anim) => {
      return Animated.timing(anim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      });
    });

    Animated.stagger(80, animations).start();
  }, [filteredWatches.length, currentScreen]);

  // Extract unique categories/genders
  const categories = ['All', 'Men', 'Women', 'Unisex'];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F8FA" />

      {/* HEADER */}
      <View style={styles.header}>
        {showSearch ? (
          <View style={styles.searchBarContainer}>
            <Icon name="search" size={16} color="#666" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search brand or model..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            <TouchableOpacity onPress={() => { setShowSearch(false); setSearchQuery(''); }}>
              <Icon name="x" size={18} color="#000" />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.logoText}>B-WATCH</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => setShowSearch(true)}>
                <Icon name="search" size={18} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.settingsButton, showCategoryDropdown && styles.settingsButtonActive]}
                onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
              >
                <Icon name="sliders" size={18} color={showCategoryDropdown ? '#FFF' : '#000'} />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* CATEGORY SELECTOR DROPDOWN */}
      {showCategoryDropdown && (
        <View style={styles.dropdownCard}>
          <Text style={styles.dropdownTitle}>Filter by Gender</Text>
          <View style={styles.categoryRow}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryBadge,
                  selectedCategory === cat && styles.categoryBadgeActive,
                ]}
                onPress={() => {
                  setSelectedCategory(cat);
                  setShowCategoryDropdown(false);
                }}
              >
                <Text
                  style={[
                    styles.categoryBadgeText,
                    selectedCategory === cat && styles.categoryBadgeTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* TITLE SECTION */}
      <View style={styles.titleSection}>
        <Text style={styles.mainTitle}>
          {isFavoritesScreen ? 'Favorites' : 'Collection'}
        </Text>
        {selectedCategory !== 'All' && (
          <View style={styles.activeFilterBadge}>
            <Text style={styles.activeFilterText}>{selectedCategory}</Text>
            <TouchableOpacity onPress={() => setSelectedCategory('All')}>
              <Icon name="x" size={10} color="#666" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* LOADING INDICATOR */}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      ) : filteredWatches.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="slash" size={48} color="#CCC" />
          <Text style={styles.emptyText}>
            {isFavoritesScreen
              ? 'No favorite watches yet.'
              : searchQuery !== ''
              ? 'No watches match your search.'
              : 'Your collection is empty.'}
          </Text>
          {!isFavoritesScreen && searchQuery === '' && (
            <TouchableOpacity
              style={styles.emptyAddBtn}
              onPress={() => navigate('AddWatch')}
            >
              <Text style={styles.emptyAddBtnText}>Add a Timepiece</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        /* WATCH GRID */
        <ScrollView
          contentContainerStyle={styles.gridContainer}
          showsVerticalScrollIndicator={false}
        >
          {filteredWatches.map((item, index) => {
            const anim = animatedValues.current[index] || new Animated.Value(1);
            const translateY = anim.interpolate({
              inputRange: [0, 1],
              outputRange: [30, 0],
            });

            return (
              <Animated.View
                key={item.id}
                style={[
                  styles.cardContainer,
                  {
                    opacity: anim,
                    transform: [{ translateY }],
                  },
                ]}
              >
                {/* Favorite Icon */}
                <TouchableOpacity
                  style={styles.favoriteIcon}
                  onPress={() => toggleFavorite(item.id)}
                  activeOpacity={0.7}
                >
                  <FontAwesome
                    name={item.isFavorite ? 'heart' : 'heart-o'}
                    size={16}
                    color={item.isFavorite ? '#E53935' : '#666'}
                  />
                </TouchableOpacity>

                {/* Watch Image */}
                <TouchableOpacity
                  style={styles.imageWrapper}
                  onPress={() => navigate('WatchDetails', { watchId: item.id })}
                  activeOpacity={0.9}
                >
                  <Image
                    source={{ uri: item.image }}
                    style={styles.watchImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>

                {/* Watch Details */}
                <TouchableOpacity
                  style={styles.cardInfo}
                  onPress={() => navigate('WatchDetails', { watchId: item.id })}
                  activeOpacity={0.9}
                >
                  <Text style={styles.brandText} numberOfLines={1}>{item.brand}</Text>
                  <Text style={styles.nameText} numberOfLines={2}>{item.name}</Text>

                  <View style={styles.footerRow}>
                    <Text style={styles.priceText}>
                      {item.price ? `$${parseFloat(item.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : 'N/A'}
                    </Text>
                    <TouchableOpacity
                      onPress={() => navigate('CatalogueBuilder', { watchId: item.id })}
                    >
                      <Text style={styles.buyNowText}>Build</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
          {/* Padding for bottom nav */}
          <View style={{ height: 120 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

// --- STYLES ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8FA', // Soft off-white premium background
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    height: 50,
    marginBottom: 10,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    padding: 8,
    marginRight: 8,
  },
  logoText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    letterSpacing: 1.5,
  },
  settingsButton: {
    padding: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FFF',
  },
  settingsButtonActive: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#000',
    paddingVertical: 0,
  },
  dropdownCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  dropdownTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#666',
    letterSpacing: 0.5,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F2',
  },
  categoryBadgeActive: {
    backgroundColor: '#000',
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  categoryBadgeTextActive: {
    color: '#FFF',
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
    letterSpacing: -0.5,
  },
  activeFilterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAEAEA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeFilterText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#555',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  cardContainer: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  favoriteIcon: {
    alignSelf: 'flex-end',
    padding: 4,
    zIndex: 10,
  },
  imageWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
    marginVertical: 10,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F0F0F2',
  },
  watchImage: {
    width: '100%',
    height: '100%',
  },
  cardInfo: {
    marginTop: 5,
  },
  brandText: {
    fontSize: 10,
    color: '#888',
    marginBottom: 2,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  nameText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    lineHeight: 18,
    height: 36, // Fits 2 lines
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  priceText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
  },
  buyNowText: {
    fontSize: 12,
    color: '#000',
    fontWeight: '700',
    borderWidth: 1,
    borderColor: '#000',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: 50,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  emptyAddBtn: {
    backgroundColor: '#000',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyAddBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default Dashboard;
