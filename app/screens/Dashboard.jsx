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
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useApp } from '../context/AppContext';

const { width } = Dimensions.get('window');

// --- THEME CONSTANTS ---
const THEME = {
  background: '#FAFAFA',
  surface: '#FFFFFF',
  primary: '#000000ff',
  textDark: '#232F2C',
  textMuted: '#7E918C',
  imageBg: '#E0EAE8',
};

const CATEGORIES = ['All', 'Men', 'Women', 'Unisex'];

// Skeleton Card component
const SkeletonCard = ({ index }) => {
  const isEven = index % 2 === 0;
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
    <Animated.View
      style={[
        styles.cardContainer,
        { marginTop: isEven ? 0 : 40, opacity: pulseAnim },
      ]}
    >
      <View style={styles.cardImageWrapper}>
        <View
          style={[
            styles.skeletonElement,
            { width: '100%', height: '100%', borderRadius: 22 },
          ]}
        />
      </View>
      <View style={styles.cardInfo}>
        <View
          style={[
            styles.skeletonElement,
            { width: '80%', height: 16, borderRadius: 4, marginBottom: 8 },
          ]}
        />
        <View
          style={[
            styles.skeletonElement,
            { width: '50%', height: 12, borderRadius: 4, marginBottom: 8 },
          ]}
        />
        <View
          style={[
            styles.skeletonElement,
            { width: '40%', height: 14, borderRadius: 4 },
          ]}
        />
      </View>
    </Animated.View>
  );
};

const Dashboard = () => {
  const { watches, loading, refreshWatches, navigate } = useApp();

  // States
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedWatches, setSelectedWatches] = useState([]);
  const [sortBy, setSortBy] = useState('none');
  const [showPdfModeModal, setShowPdfModeModal] = useState(false);

  // Animation Values
  const animatedValues = useRef([]);
  const slideAnim = useRef(new Animated.Value(width)).current;
  const modalAnim = useRef(new Animated.Value(0)).current;

  // Swipe-to-refresh handler
  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshWatches();
    setRefreshing(false);
  };

  // 1. Filter Logic
  const filteredWatches = useMemo(() => {
    let result = (watches || []).filter(watch => {
      if (selectedCategory === 'All') return true;
      if (selectedCategory === 'Men' && watch.gender === 'Men') return true;
      if (selectedCategory === 'Women' && watch.gender === 'Women') return true;
      if (selectedCategory === 'Unisex' && watch.gender === 'Unisex')
        return true;
      return false;
    });

    if (sortBy === 'price_asc') {
      result = [...result].sort((a, b) => parseFloat(a.price || 0) - parseFloat(b.price || 0));
    } else if (sortBy === 'price_desc') {
      result = [...result].sort((a, b) => parseFloat(b.price || 0) - parseFloat(a.price || 0));
    } else if (sortBy === 'brand_asc') {
      result = [...result].sort((a, b) => (a.brand || '').localeCompare(b.brand || ''));
    }

    return result;
  }, [watches, selectedCategory, sortBy]);

  // 2. Entrance Animation for Grid Items
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
  }, [filteredWatches, selectedCategory]);

  // 3. Side Panel Toggle Animation
  const toggleFilter = open => {
    setIsFilterOpen(open);
    Animated.timing(slideAnim, {
      toValue: open ? 0 : width,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  // 4. Selection Mode Toggle
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedWatches([]);
  };

  // 5. Toggle Watch Selection
  const toggleWatchSelection = watchId => {
    setSelectedWatches(prev => {
      if (prev.includes(watchId)) {
        return prev.filter(id => id !== watchId);
      } else {
        return [...prev, watchId];
      }
    });
  };

  // 6. Handle Generate Catalog
  const handleGenerateCatalog = () => {
    if (selectedWatches.length === 0) return;
    // If only 1 watch selected, go directly to CatalogueBuilder
    if (selectedWatches.length === 1) {
      navigate('CatalogueBuilder', { selectedWatchIds: selectedWatches, pdfMode: 'single' });
      setIsSelectionMode(false);
      setSelectedWatches([]);
      return;
    }
    // If multiple watches selected, show PDF mode selection modal
    setShowPdfModeModal(true);
  };

  const handlePdfModeSelect = (mode) => {
    setShowPdfModeModal(false);
    navigate('CatalogueBuilder', { selectedWatchIds: selectedWatches, pdfMode: mode });
    setIsSelectionMode(false);
    setSelectedWatches([]);
  };

  // Modal Animation - only animate in, let React Native Modal handle fade out
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

  // Card Render Function
  const renderCard = (item, index) => {
    const anim = animatedValues.current[index] || new Animated.Value(1);
    const isSelected = selectedWatches.includes(item.id);
    const isEven = index % 2 === 0;

    const translateY = anim.interpolate({
      inputRange: [0, 1],
      outputRange: [30, 0],
    });

    return (
      <Animated.View
        key={item.id}
        style={[
          styles.cardContainer,
          { marginTop: isEven ? 0 : 40 },
          { opacity: anim, transform: [{ translateY }] },
        ]}
      >
        <TouchableOpacity
          style={styles.cardTouchable}
          activeOpacity={0.8}
          onPress={() => {
            if (isSelectionMode) toggleWatchSelection(item.id);
            else navigate('WatchDetails', { watchId: item.id });
          }}
          onLongPress={() => {
            if (!isSelectionMode) {
              setIsSelectionMode(true);
              setSelectedWatches([item.id]);
            }
          }}
          delayLongPress={300}
        >
          {/* Card Image */}
          <View
            style={[
              styles.cardImageWrapper,
              isSelectionMode && isSelected && styles.cardImageWrapperSelected,
            ]}
          >
            <Image
              source={{ uri: item.image }}
              style={styles.cardImage}
              resizeMode="cover"
            />
            <View
              style={[
                styles.actionButton,
                isSelected && styles.actionButtonSelected,
              ]}
            >
              {isSelectionMode ? (
                <Icon
                  name="check"
                  size={18}
                  color={isSelected ? THEME.surface : THEME.primary}
                />
              ) : (
                <Icon name="shopping-bag" size={16} color={THEME.surface} />
              )}
            </View>
          </View>

          {/* Card Info */}
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.cardSubtitle} numberOfLines={1}>
              {item.brand}
            </Text>
            <Text style={styles.cardPrice}>
              ₹{item.price ? parseFloat(item.price).toFixed(2) : '0.00'}
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.background} />

      {/* HEADER */}
      <View style={styles.headerRow}>
        <Text style={styles.logoText}>B-WATCH</Text>

        <View style={styles.headerActions}>
          {isSelectionMode ? (
            <>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={toggleSelectionMode}
              >
                <Icon name="x" size={20} color={THEME.textDark} />
              </TouchableOpacity>
              {selectedWatches.length > 0 && (
                <TouchableOpacity
                  style={[
                    styles.iconButton,
                    { backgroundColor: THEME.primary },
                  ]}
                  onPress={handleGenerateCatalog}
                >
                  <Icon name="file-text" size={18} color={THEME.surface} />
                </TouchableOpacity>
              )}
            </>
          ) : (
            <>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={toggleSelectionMode}
              >
                <Icon name="check-square" size={18} color={THEME.textDark} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => toggleFilter(true)}
              >
                <Icon name="menu" size={20} color={THEME.textDark} />
              </TouchableOpacity>
            </>
          )}
        </View>
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
        {/* HERO SECTION */}
        <View style={styles.heroSection}>
          <Text style={styles.heroText}>Collections</Text>
          {isSelectionMode && (
            <Text style={styles.selectText}>
              {selectedWatches.length} Selected
            </Text>
          )}
        </View>

        {/* QUICK CATEGORY PILLS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryPill,
                selectedCategory === cat && styles.categoryPillActive,
              ]}
              onPress={() => setSelectedCategory(cat)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.categoryPillText,
                  selectedCategory === cat && styles.categoryPillTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* BEST PICKS LIST */}
        <View style={styles.listSection}>
          {loading && !refreshing ? (
            <View style={styles.listContainer}>
              {Array.from({ length: 6 }).map((_, idx) => (
                <SkeletonCard key={idx} index={idx} />
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
      </ScrollView>

      {/* RIGHT PANEL OVERLAY */}
      {isFilterOpen && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => toggleFilter(false)}
        />
      )}

      {/* SLIDING RIGHT PANEL (FILTERS) */}
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
            <Icon name="check" size={18} color={THEME.surface} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterOption,
            sortBy === 'price_desc' && styles.filterOptionActive,
          ]}
          onPress={() => {
            setSortBy(sortBy === 'price_desc' ? 'none' : 'price_desc');
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
            <Icon name="check" size={18} color={THEME.surface} />
          )}
        </TouchableOpacity>

        <Text style={[styles.filterSectionTitle, { marginTop: 24 }]}>SORT BY BRAND</Text>

        <TouchableOpacity
          style={[
            styles.filterOption,
            sortBy === 'brand_asc' && styles.filterOptionActive,
          ]}
          onPress={() => {
            setSortBy(sortBy === 'brand_asc' ? 'none' : 'brand_asc');
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
            <Icon name="check" size={18} color={THEME.surface} />
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* PDF MODE SELECTION MODAL */}
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
                <Icon name="file-text" size={28} color={THEME.surface} />
              </View>
              <Text style={styles.modalTitle}>PDF Export Mode</Text>
              <Text style={styles.modalSubtitle}>
                {selectedWatches.length} watches selected
              </Text>
            </View>

            <Text style={styles.modalDescription}>
              Choose how you want to generate the PDF catalogue:
            </Text>

            {/* Single PDF Option */}
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

            {/* Separate PDFs Option */}
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

            {/* Cancel Button */}
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

// --- STYLES ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
  },
  logoText: {
    fontSize: 22,
    fontWeight: '800',
    color: THEME.textDark,
    letterSpacing: 1.2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  heroSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  heroText: {
    fontSize: 32,
    fontWeight: '400',
    color: THEME.textDark,
    alignSelf: 'flex-start',
    letterSpacing: -0.5,
  },
  selectText: {
    fontSize: 16,
    fontWeight: '500',
    color: THEME.primary,
    marginTop: 8,
  },
  categoryScroll: {
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 36,
  },
  categoryPill: {
    backgroundColor: THEME.surface,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginRight: 1,
  },
  categoryPillActive: {
    backgroundColor: THEME.primary,
  },
  categoryPillText: {
    fontSize: 15,
    fontWeight: '500',
    color: THEME.textMuted,
  },
  categoryPillTextActive: {
    color: THEME.surface,
    fontWeight: '600',
  },
  listSection: {
    paddingHorizontal: 24,
  },
  listContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cardContainer: {
    width: '47%',
    marginBottom: 32,
  },
  cardTouchable: {
    flexDirection: 'column',
    width: '100%',
  },
  cardImageWrapper: {
    width: '100%',
    aspectRatio: 0.82,
    borderRadius: 24,
    backgroundColor: THEME.imageBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardImageWrapperSelected: {
    borderColor: THEME.primary,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
  },
  cardInfo: {
    paddingHorizontal: 4,
    width: '100%',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.textDark,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: THEME.textMuted,
    marginBottom: 8,
  },
  cardPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.textDark,
  },
  actionButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  actionButtonSelected: {
    backgroundColor: THEME.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    marginTop: 16,
    color: THEME.textMuted,
    fontSize: 16,
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
    shadowColor: '#000',
    shadowOffset: { width: -10, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  panelTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: THEME.textDark,
  },
  closeBtn: {
    padding: 8,
    marginRight: -8,
  },
  filterSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.textMuted,
    letterSpacing: 1.5,
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
    fontSize: 16,
    fontWeight: '600',
    color: THEME.textDark,
  },
  filterOptionTextActive: {
    color: THEME.surface,
  },
  skeletonElement: {
    backgroundColor: '#EAEAEA',
  },
  // Modal Styles
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
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
    fontSize: 22,
    fontWeight: '800',
    color: THEME.textDark,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: THEME.textMuted,
  },
  modalDescription: {
    fontSize: 14,
    color: THEME.textMuted,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  modalOptionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: THEME.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  modalOptionContent: {
    flex: 1,
  },
  modalOptionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.textDark,
    marginBottom: 2,
  },
  modalOptionDesc: {
    fontSize: 13,
    color: THEME.textMuted,
  },
  modalCancelButton: {
    marginTop: 8,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.textMuted,
  },
});

export default Dashboard;
