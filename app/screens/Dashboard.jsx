import React, { useEffect, useRef, useState, useMemo } from 'react';
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
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useApp } from '../context/AppContext';
import { getOptimizedImageUrl } from '../supabase/watchService';
import TYPOGRAPHY, { TEXT_STYLES } from '../theme/typography';
import { isTablet, getGridConfig, getSpacing, getCardWidth } from '../theme/responsive';
import { haptics } from '../utils/haptics';
import { getVersionString } from '../constants/app';
import Skeleton from '../components/Skeleton';

const { width } = Dimensions.get('window');

// --- THEME CONSTANTS ---
const THEME = {
  background: '#E6E6E6', // Soft light gray matching the image background
  surface: '#FFFFFF',
  primary: '#1C1C1E', // Very dark gray/black for buttons
  inactivePill: '#D4D4D4', // Darker gray for inactive filter pills
  textDark: '#1C1C1E',
  textLight: '#FFFFFF',
  textMuted: '#8E8E93',
  accentColor: '#F0FE67', // Bright yellow for card button
  notification: '#F0FE67', // Yellow for the notification dot
};

const CATEGORIES = ['All', 'Men', 'Women', 'Unisex'];

const SkeletonCard = () => {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.8,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulseAnim]);

  return (
    <Animated.View style={[styles.cardContainer, { opacity: pulseAnim }]}>
      <View style={styles.skeletonCardImageWrapper} />
    </Animated.View>
  );
};

const Dashboard = () => {
  const { watches, loading, refreshWatches, navigate } = useApp();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedWatches, setSelectedWatches] = useState([]);
  const [sortBy, setSortBy] = useState('none');
  const [showPdfModeModal, setShowPdfModeModal] = useState(false);
  const [imageLoading, setImageLoading] = useState({});

  const animatedValues = useRef([]);
  const slideAnim = useRef(new Animated.Value(width)).current;
  const modalAnim = useRef(new Animated.Value(0)).current;



  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshWatches();
    setRefreshing(false);
  };

  const filteredWatches = useMemo(() => {
    let result = (watches || []).filter(watch => {
      let categoryMatch = true;
      if (selectedCategory !== 'All') {
        categoryMatch = watch.gender === selectedCategory;
      }

      let searchMatch = true;
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        searchMatch =
          (watch.name && watch.name.toLowerCase().includes(query)) ||
          (watch.brand && watch.brand.toLowerCase().includes(query));
      }

      return categoryMatch && searchMatch;
    });

    if (sortBy === 'price_asc') {
      result = [...result].sort(
        (a, b) => parseFloat(a.price || 0) - parseFloat(b.price || 0),
      );
    } else if (sortBy === 'price_desc') {
      result = [...result].sort(
        (a, b) => parseFloat(b.price || 0) - parseFloat(a.price || 0),
      );
    } else if (sortBy === 'brand_asc') {
      result = [...result].sort((a, b) =>
        (a.brand || '').localeCompare(b.brand || ''),
      );
    }

    return result;
  }, [watches, selectedCategory, sortBy, searchQuery]);

  useEffect(() => {
    animatedValues.current = filteredWatches.map(() => new Animated.Value(0));

    const animations = animatedValues.current.map(anim => {
      return Animated.timing(anim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      });
    });

    Animated.stagger(80, animations).start();
  }, [filteredWatches, selectedCategory, searchQuery]);

  const toggleFilter = open => {
    setIsFilterOpen(open);
    haptics.modalOpen();
    Animated.timing(slideAnim, {
      toValue: open ? 0 : width,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedWatches([]);
    haptics.buttonPress();
  };

  const toggleWatchSelection = watchId => {
    haptics.cardSelect();
    setSelectedWatches(prev => {
      if (prev.includes(watchId)) {
        return prev.filter(id => id !== watchId);
      } else {
        return [...prev, watchId];
      }
    });
  };

  const handleGenerateCatalog = () => {
    if (selectedWatches.length === 0) return;
    if (selectedWatches.length === 1) {
      navigate('CatalogueBuilder', {
        selectedWatchIds: selectedWatches,
        pdfMode: 'single',
      });
      setIsSelectionMode(false);
      setSelectedWatches([]);
      return;
    }
    setShowPdfModeModal(true);
  };

  const handlePdfModeSelect = mode => {
    setShowPdfModeModal(false);
    navigate('CatalogueBuilder', {
      selectedWatchIds: selectedWatches,
      pdfMode: mode,
    });
    setIsSelectionMode(false);
    setSelectedWatches([]);
  };

  useEffect(() => {
    if (showPdfModeModal) {
      modalAnim.setValue(0);
      Animated.spring(modalAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }
  }, [showPdfModeModal]);

  const renderCard = (item, index) => {
    const anim = animatedValues.current[index] || new Animated.Value(1);
    const isSelected = selectedWatches.includes(item.id);

    const translateY = anim.interpolate({
      inputRange: [0, 1],
      outputRange: [30, 0],
    });

    return (
      <Animated.View
        key={item.id}
        style={[
          styles.cardContainer,
          { opacity: anim, transform: [{ translateY }] },
        ]}
      >
        <TouchableOpacity
          style={styles.cardTouchable}
          activeOpacity={0.9}
          onPress={() => {
            if (isSelectionMode) toggleWatchSelection(item.id);
            else {
              haptics.buttonPress();
              navigate('WatchDetails', { watchId: item.id });
            }
          }}
          onLongPress={() => {
            if (!isSelectionMode) {
              haptics.cardSelect();
              setIsSelectionMode(true);
              setSelectedWatches([item.id]);
            }
          }}
          delayLongPress={300}
        >
          <View
            style={[
              styles.cardBackground,
              isSelectionMode && isSelected && styles.cardBackgroundSelected,
            ]}
          >
            <Image
              source={{ uri: getOptimizedImageUrl(item.image, 400, 80) }}
              style={styles.cardImage}
              resizeMode="cover"
              onLoadStart={() => setImageLoading(prev => ({ ...prev, [item.id]: true }))}
              onLoadEnd={() => setImageLoading(prev => ({ ...prev, [item.id]: false }))}
            />
            {imageLoading[item.id] !== false && (
              <Skeleton
                width="100%"
                height="100%"
                style={StyleSheet.absoluteFillObject}
              />
            )}
            <View style={styles.imageOverlay} />
            <View style={styles.cardTopSection}>
              {isSelectionMode ? (
                <View
                  style={[
                    styles.selectionCheck,
                    isSelected && styles.selectionCheckActive,
                  ]}
                >
                  {isSelected && (
                    <Icon name="check" size={16} color={THEME.surface} />
                  )}
                </View>
              ) : (
                <View />
              )}

              <View style={styles.pricePill}>
                <Icon
                  name="tag"
                  size={12}
                  color={THEME.textDark}
                  style={styles.priceIcon}
                />
                <Text style={styles.priceText}>
                  ₹{item.price ? parseFloat(item.price).toFixed(2) : '0.00'}
                </Text>
              </View>
            </View>

            <View style={styles.cardBottomSection}>
              <View style={styles.cardTextContent}>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {item.name ? item.name : 'Product Name'}
                </Text>
                <Text style={styles.cardBrand} numberOfLines={1}>
                  {item.brand ? item.brand : 'Brand'}
                </Text>
              </View>

              <View style={styles.actionButton}>
                <Icon name="arrow-up-right" size={24} color={THEME.textDark} />
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.background} />

      <View style={styles.headerSection}>
        <View style={styles.headerTopRow}>
          {isSelectionMode ? (
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={[
                  styles.headerIconButton,
                  { backgroundColor: THEME.surface },
                ]}
                onPress={toggleSelectionMode}
              >
                <Icon name="x" size={22} color={THEME.textDark} />
              </TouchableOpacity>
              {selectedWatches.length > 0 && (
                <TouchableOpacity
                  style={[
                    styles.headerIconButton,
                    { backgroundColor: THEME.primary },
                  ]}
                  onPress={handleGenerateCatalog}
                >
                  <Icon name="file-text" size={20} color={THEME.textLight} />
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <>
              {/* White Grid Button (Left) */}
              {/* <TouchableOpacity
                style={[
                  styles.headerIconButton,
                  { backgroundColor: THEME.surface },
                ]}
              >
                <Icon name="grid" size={20} color={THEME.textDark} />
              </TouchableOpacity> */}

              {/* Dark Bell Button with Notification Dot (Right) */}
              {/* <TouchableOpacity
                style={[
                  styles.headerIconButton,
                  { backgroundColor: THEME.primary },
                ]}
                onPress={() =>
                  toggleSelectionMode()
                }
              >
                <Icon name="bell" size={20} color={THEME.textLight} />
                <View style={styles.notificationDot} />
              </TouchableOpacity> */}
            </>
          )}
        </View>

        {/* Soft, cleaner typography matching image */}
        <Text style={styles.mainHeaderText}>Watches</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[THEME.primary]}
            tintColor={THEME.primary}
          />
        }
      >
        <View style={styles.brandsSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {CATEGORIES.map(cat => {
              const isActive = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryPill,
                    isActive
                      ? styles.categoryPillActive
                      : styles.categoryPillInactive,
                  ]}
                  onPress={() => setSelectedCategory(cat)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.categoryPillText,
                      isActive && styles.categoryPillTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <Icon
              name="search"
              size={20}
              color={THEME.textMuted}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search watches..."
              placeholderTextColor={THEME.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => toggleFilter(true)}
          >
            <Icon name="sliders" size={20} color={THEME.textDark} />
          </TouchableOpacity>
        </View>

        <View style={styles.listSection}>
          {loading && !refreshing ? (
            <View style={styles.listContainer}>
              {Array.from({ length: 3 }).map((_, idx) => (
                <SkeletonCard key={idx} />
              ))}
            </View>
          ) : filteredWatches.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="watch" size={48} color={THEME.textMuted} />
              <Text style={styles.emptyText}>No watches found.</Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {filteredWatches.map((watch, index) => renderCard(watch, index))}
            </View>
          )}
        </View>

        <View style={styles.dashboardFooter}>
          <Text style={styles.dashboardVersionText}>BWatch v{getVersionString()}</Text>
        </View>
      </ScrollView>

      {isFilterOpen && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => toggleFilter(false)}
        />
      )}

      <Animated.View
        style={[styles.rightPanel, { transform: [{ translateX: slideAnim }] }]}
      >
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>Filters</Text>
          <TouchableOpacity
            onPress={() => toggleFilter(false)}
            style={styles.closeBtn}
          >
            <Icon name="x" size={24} color={THEME.textDark} />
          </TouchableOpacity>
        </View>

        <Text style={styles.filterSectionTitle}>SORT BY PRICE</Text>

        <TouchableOpacity
          style={[
            styles.filterOption,
            sortBy === 'price_asc' && styles.filterOptionActive,
          ]}
          onPress={() => {
            setSortBy(sortBy === 'price_asc' ? 'none' : 'price_asc');
            haptics.buttonPress();
            toggleFilter(false);
          }}
        >
          <Text
            style={[
              styles.filterOptionText,
              sortBy === 'price_asc' && styles.filterOptionTextActive,
            ]}
          >
            Price: Low to High
          </Text>
          {sortBy === 'price_asc' && (
            <Icon name="check" size={18} color={THEME.textLight} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterOption,
            sortBy === 'price_desc' && styles.filterOptionActive,
          ]}
          onPress={() => {
            setSortBy(sortBy === 'price_desc' ? 'none' : 'price_desc');
            haptics.buttonPress();
            toggleFilter(false);
          }}
        >
          <Text
            style={[
              styles.filterOptionText,
              sortBy === 'price_desc' && styles.filterOptionTextActive,
            ]}
          >
            Price: High to Low
          </Text>
          {sortBy === 'price_desc' && (
            <Icon name="check" size={18} color={THEME.textLight} />
          )}
        </TouchableOpacity>

        <Text style={[styles.filterSectionTitle, { marginTop: 24 }]}>
          SORT BY BRAND
        </Text>

        <TouchableOpacity
          style={[
            styles.filterOption,
            sortBy === 'brand_asc' && styles.filterOptionActive,
          ]}
          onPress={() => {
            setSortBy(sortBy === 'brand_asc' ? 'none' : 'brand_asc');
            haptics.buttonPress();
            toggleFilter(false);
          }}
        >
          <Text
            style={[
              styles.filterOptionText,
              sortBy === 'brand_asc' && styles.filterOptionTextActive,
            ]}
          >
            Brand Name (A-Z)
          </Text>
          {sortBy === 'brand_asc' && (
            <Icon name="check" size={18} color={THEME.textLight} />
          )}
        </TouchableOpacity>

        <View style={styles.panelFooter}>
          <Text style={styles.panelVersionText}>Version {getVersionString()}</Text>
        </View>
      </Animated.View>

      <Modal
        visible={showPdfModeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPdfModeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalContainer,
              {
                opacity: modalAnim,
                transform: [
                  {
                    scale: modalAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.9, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <View style={styles.modalIconContainer}>
                <Icon name="file-text" size={28} color={THEME.textLight} />
              </View>
              <Text style={styles.modalTitle}>PDF Export Mode</Text>
              <Text style={styles.modalSubtitle}>
                {selectedWatches.length} watches selected
              </Text>
            </View>

            <Text style={styles.modalDescription}>
              Choose how you want to generate the PDF catalogue:
            </Text>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => handlePdfModeSelect('single')}
              activeOpacity={0.8}
            >
              <View style={styles.modalOptionIconContainer}>
                <Icon name="file" size={24} color={THEME.primary} />
              </View>
              <View style={styles.modalOptionContent}>
                <Text style={styles.modalOptionTitle}>Same PDF</Text>
                <Text style={styles.modalOptionDesc}>
                  Combine all watches in one catalogue
                </Text>
              </View>
              <Icon name="chevron-right" size={20} color={THEME.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => handlePdfModeSelect('separate')}
              activeOpacity={0.8}
            >
              <View style={styles.modalOptionIconContainer}>
                <Icon name="copy" size={24} color={THEME.primary} />
              </View>
              <View style={styles.modalOptionContent}>
                <Text style={styles.modalOptionTitle}>Separate PDFs</Text>
                <Text style={styles.modalOptionDesc}>
                  Create individual PDF for each watch
                </Text>
              </View>
              <Icon name="chevron-right" size={20} color={THEME.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowPdfModeModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerIconButton: {
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
  notificationDot: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.notification,
    borderWidth: 1.5,
    borderColor: THEME.primary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
    justifyContent: 'space-between',
  },
  mainHeaderText: {
    ...TEXT_STYLES.displayLarge,
    color: THEME.textDark,
  },
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.surface,
    borderRadius: 30,
    paddingHorizontal: 20,
    height: 60,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    ...TEXT_STYLES.bodyLarge,
    color: THEME.textDark,
  },
  filterButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: THEME.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandsSection: {
    marginBottom: 24,
  },
  categoryScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryPill: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
  },
  categoryPillActive: {
    backgroundColor: THEME.surface,
  },
  categoryPillInactive: {
    backgroundColor: THEME.inactivePill,
  },
  categoryPillText: {
    ...TEXT_STYLES.bodyMedium,
    color: THEME.textDark,
  },
  categoryPillTextActive: {
    ...TEXT_STYLES.bodyMedium,
    color: THEME.textDark,
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 120,
  },
  listSection: {
    paddingHorizontal: 20,
  },
  listContainer: {
    flexDirection: isTablet() ? 'row' : 'column',
    flexWrap: isTablet() ? 'wrap' : 'nowrap',
    gap: isTablet() ? getSpacing('lg') : 24,
  },
  cardContainer: {
    width: isTablet() ? getCardWidth(getGridConfig().columns) : '100%',
  },
  cardTouchable: {
    width: '100%',
  },
  cardBackground: {
    width: '100%',
    aspectRatio: 0.9,
    backgroundColor: THEME.primary,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'transparent',
    position: 'relative',
  },
  cardBackgroundSelected: {
    borderColor: THEME.textMuted,
  },
  cardImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    resizeMode: 'cover',
    zIndex: 1,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '27%',
    backgroundColor: 'rgba(0,0,0,0.15)',
    zIndex: 2,
  },
  cardTopSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    zIndex: 3,
  },
  pricePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.surface,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  priceIcon: {
    marginRight: 6,
  },
  priceText: {
    color: THEME.textDark,
    ...TEXT_STYLES.bodyLarge,
    fontWeight: '700',
  },
  selectionCheck: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionCheckActive: {
    backgroundColor: THEME.primary,
    borderWidth: 1,
    borderColor: THEME.surface,
  },
  cardBottomSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 3,
  },
  cardTextContent: {
    flex: 1,
    marginRight: 16,
    justifyContent: 'center',
  },
  cardTitle: {
    color: THEME.textLight,
    ...TEXT_STYLES.headingLarge,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  cardBrand: {
    color: THEME.textLight,
    ...TEXT_STYLES.bodyMedium,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
    opacity: 0.9,
    marginTop: 4,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  actionButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: THEME.accentColor,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  skeletonCardImageWrapper: {
    width: '100%',
    aspectRatio: 0.9,
    backgroundColor: '#D3D3D3',
    borderRadius: 32,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    marginTop: 16,
    color: THEME.textMuted,
    ...TEXT_STYLES.bodyLarge,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 99,
  },
  rightPanel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: width * 0.75,
    backgroundColor: THEME.surface,
    zIndex: 100,
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  panelTitle: {
    ...TEXT_STYLES.displaySmall,
    color: THEME.textDark,
  },
  closeBtn: {
    padding: 8,
    marginRight: -8,
  },
  filterSectionTitle: {
    ...TEXT_STYLES.captionLarge,
    color: THEME.textMuted,
    marginBottom: 16,
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: THEME.background,
    marginBottom: 12,
  },
  filterOptionActive: {
    backgroundColor: THEME.primary,
  },
  filterOptionText: {
    ...TEXT_STYLES.bodyLarge,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: THEME.textDark,
  },
  filterOptionTextActive: {
    color: THEME.textLight,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContainer: {
    backgroundColor: THEME.surface,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 380,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: THEME.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    ...TEXT_STYLES.headingLarge,
    fontWeight: TYPOGRAPHY.fontWeight.extrabold,
    color: THEME.textDark,
    marginBottom: 4,
  },
  modalSubtitle: {
    ...TEXT_STYLES.bodyMedium,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: THEME.textMuted,
  },
  modalDescription: {
    ...TEXT_STYLES.bodyMedium,
    color: THEME.textMuted,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  modalOptionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: THEME.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  modalOptionContent: {
    flex: 1,
  },
  modalOptionTitle: {
    ...TEXT_STYLES.bodyLarge,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: THEME.textDark,
    marginBottom: 2,
  },
  modalOptionDesc: {
    ...TEXT_STYLES.bodySmall,
    color: THEME.textMuted,
  },
  modalCancelButton: {
    marginTop: 8,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
  },
  modalCancelText: {
    ...TEXT_STYLES.bodyLarge,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: THEME.textMuted,
  },
  dashboardFooter: {
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashboardVersionText: {
    ...TEXT_STYLES.bodySmall,
    color: THEME.textMuted,
    opacity: 0.6,
  },
  panelFooter: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panelVersionText: {
    ...TEXT_STYLES.captionLarge,
    color: THEME.textMuted,
  },
});

export default Dashboard;
