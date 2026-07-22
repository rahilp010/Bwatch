import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
  SafeAreaView,
  StatusBar,
  Switch,
  Dimensions,
  Image,
  ActivityIndicator,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Toast from 'react-native-toast-message';
import { launchImageLibrary } from 'react-native-image-picker';
import { uploadWatchImage } from '../supabase/watchService';
import { isConfigured } from '../supabase/client';
import { useApp } from '../context/AppContext';
import TemplateCoverCanvas from '../components/TemplateCoverCanvas';

const { width } = Dimensions.get('window');
const CANVAS_WIDTH = width - 40;
const CANVAS_HEIGHT = CANVAS_WIDTH * 1.414;

// --- THEME MATCHING NEW DESIGN SYSTEM ---
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

const CATALOG_TEMPLATES = [
  {
    id: 'minimal',
    name: 'Minimal',
    text: 'MINIMAL',
    previewColor: '#F5F5F5',
    textColor: '#1C1C1E',
  },
  {
    id: 'luxury',
    name: 'Luxury',
    text: 'LUXURY',
    previewColor: '#1C1C1E',
    textColor: '#D4AF37',
  },
  {
    id: 'vintage',
    name: 'Vintage',
    text: 'VINTAGE',
    previewColor: '#E8D5B7',
    textColor: '#4A3C2A',
  },
  {
    id: 'modern',
    name: 'Modern',
    text: 'MODERN',
    previewColor: '#0A1118',
    textColor: '#F0FE67',
  },
  {
    id: 'classic',
    name: 'Classic',
    text: 'CLASSIC',
    previewColor: '#4A3C2A',
    textColor: '#FFFFFF',
  },
];

const TEMPLATE_DEFAULTS = {
  minimal: {
    bgColor: '#F5F5F5',
    accentColor: '#1C1C1E',
    secondaryAccent: '#8E8E93',
    subtitle: 'PREMIUM WATCH',
    title: 'CATALOG',
    tagline: 'Timepiece Collection',
    year: '2025-2026',
    website: 'WWW.YOURWEBSITE.COM',
  },
  luxury: {
    bgColor: '#1C1C1E',
    accentColor: '#D4AF37',
    secondaryAccent: '#999999',
    subtitle: 'LUXURY TIMEPIECE',
    title: 'C O L L E C T I O N',
    tagline: 'Exclusive Edition',
    year: '2025-2026',
    website: 'WWW.YOURWEBSITE.COM',
  },
  vintage: {
    bgColor: '#E8D5B7',
    accentColor: '#4A3C2A',
    secondaryAccent: '#8B7355',
    subtitle: 'VINTAGE WATCH',
    title: 'CATALOG',
    tagline: 'Retro Edition',
    year: '2025-2026',
    website: 'WWW.YOURWEBSITE.COM',
  },
  modern: {
    bgColor: '#0A1118',
    accentColor: '#F0FE67',
    secondaryAccent: '#B0B0B0',
    subtitle: 'MODERN TIME',
    title: 'CATALOG',
    tagline: 'Contemporary Series',
    year: '2025-2026',
    website: 'WWW.YOURWEBSITE.COM',
  },
  classic: {
    bgColor: '#4A3C2A',
    accentColor: '#FFFFFF',
    secondaryAccent: '#C4B397',
    subtitle: 'CLASSIC WATCH',
    title: 'H E R I T A G E',
    tagline: 'Heritage Collection',
    year: '2025-2026',
    website: 'WWW.YOURWEBSITE.COM',
  },
};

const BG_PRESETS = [
  '#222426',
  '#0A1118',
  '#1C1C1E',
  '#4A3C2A',
  '#E8D5B7',
  '#F5F5F5',
];
const ACCENT_PRESETS = [
  '#FFFFFF',
  '#D4AF37',
  '#F0FE67',
  '#B76E79',
  '#1C1C1E',
  '#4A3C2A',
];

const CatalogueBuilderScreen = () => {
  const { params, watches, updateWatch, navigate, goBack } = useApp();
  const selectedWatchIds = params?.selectedWatchIds || [];
  const pdfMode = params?.pdfMode || 'single';
  const selectedWatches = watches.filter(w => selectedWatchIds.includes(w.id));
  const watchId =
    params?.watchId || (watches.length > 0 ? watches[0].id : null);
  const watch = watches.find(w => w.id === watchId);
  const targetWatches =
    selectedWatches.length > 0 ? selectedWatches : watch ? [watch] : [];

  const [currentWatchIndex, setCurrentWatchIndex] = useState(0);
  const currentWatch = targetWatches[currentWatchIndex] || null;

  const [showPrice, setShowPrice] = useState(true);
  const [showDesc, setShowDesc] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState('minimal');

  // --- WATCH FIELDS ---
  const [brand, setBrand] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [color, setColor] = useState('');
  const [strap, setStrap] = useState('');
  const [type, setType] = useState('');
  const [gender, setGender] = useState('');

  // --- TEMPLATE CANVAS STATE ---
  const [templateBgColor, setTemplateBgColor] = useState('#F5F5F5');
  const [templateAccentColor, setTemplateAccentColor] = useState('#1C1C1E');
  const [templateSecondaryAccent, setTemplateSecondaryAccent] =
    useState('#8E8E93');
  const [templateContent, setTemplateContent] = useState({
    subtitle: 'PREMIUM WATCH',
    title: 'CATALOG',
    brandName: '',
    tagline: 'Timepiece Collection',
    year: '2025-2026',
    website: 'WWW.YOURWEBSITE.COM',
  });
  const [coverImage, setCoverImage] = useState(null);

  // --- DETAILS PAGE STATE ---
  const [detailsFontFamily, setDetailsFontFamily] = useState('sans-serif');
  const [detailsFontSize, setDetailsFontSize] = useState('medium'); // small, medium, large
  const [detailsImageScale, setDetailsImageScale] = useState(1.0); // 0.8, 1.0, 1.2
  const [detailsCodePrefix, setDetailsCodePrefix] = useState('CODE: ');
  const [detailsShowBrand, setDetailsShowBrand] = useState(true);
  const [detailsFooterText, setDetailsFooterText] = useState('');

  // --- EDITOR STATE ---
  const [isDownloading, setIsDownloading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeTextKey, setActiveTextKey] = useState(null);
  const [tempText, setTempText] = useState('');

  // Populate watch fields when current watch changes
  useEffect(() => {
    if (currentWatch) {
      setBrand(currentWatch.brand || '');
      setName(currentWatch.name || '');
      setPrice(currentWatch.price || '');
      setDescription(currentWatch.description || '');
      setImageUrl(currentWatch.image || '');
      setColor(currentWatch.color || 'Silver');
      setStrap(currentWatch.strap || 'Metal');
      setType(currentWatch.type || 'Analogue');
      setGender(currentWatch.gender || 'Men');
      // Auto-set cover image and brand name from watch data
      setCoverImage(currentWatch.image || null);
      setTemplateContent(prev => ({
        ...prev,
        brandName: currentWatch.brand || 'Brand Name',
      }));
    }
  }, [currentWatchIndex, currentWatch]);

  // Apply template defaults when template selection changes
  useEffect(() => {
    const defaults = TEMPLATE_DEFAULTS[selectedTemplate];
    if (defaults) {
      setTemplateBgColor(defaults.bgColor);
      setTemplateAccentColor(defaults.accentColor);
      setTemplateSecondaryAccent(defaults.secondaryAccent);
      setTemplateContent(prev => ({
        ...prev,
        subtitle: defaults.subtitle,
        title: defaults.title,
        brandName: brand || prev.brandName || 'Brand Name',
        tagline: defaults.tagline,
        year: defaults.year,
        website: defaults.website,
      }));
    }
  }, [selectedTemplate, brand]);

  // --- ANIMATIONS ---
  const animValues = useRef(
    [...Array(8)].map(() => new Animated.Value(0)),
  ).current;

  useEffect(() => {
    const animations = animValues.map(anim =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    );
    Animated.stagger(80, animations).start();
  }, [currentWatchIndex, animValues]);

  const getAnimStyle = index => ({
    opacity: animValues[index],
    transform: [
      {
        translateY: animValues[index].interpolate({
          inputRange: [0, 1],
          outputRange: [30, 0],
        }),
      },
    ],
  });

  // --- EARLY RETURN ---
  if (watches.length === 0 || !currentWatch) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Icon name="alert-triangle" size={48} color={THEME.textMuted} />
        <Text style={styles.errorText}>Data not found.</Text>
        <TouchableOpacity style={styles.errorButton} onPress={() => goBack()}>
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // --- HANDLERS ---
  const handleSaveCurrentWatch = async () => {
    await updateWatch(currentWatch.id, {
      brand,
      name,
      price,
      description,
      image: imageUrl,
      color,
      strap,
      type,
      gender,
    });
  };

  const handleChangePhoto = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, async response => {
      if (response.didCancel) return;
      if (response.assets && response.assets.length > 0) {
        const imageUri = response.assets[0].uri;
        if (isConfigured) {
          try {
            Toast.show({ type: 'info', text1: 'Uploading...' });
            const publicUrl = await uploadWatchImage(
              imageUri,
              `watch_${Date.now()}.jpg`,
            );
            setImageUrl(publicUrl);
          } catch (err) {
            setImageUrl(imageUri);
          }
        } else {
          setImageUrl(imageUri);
        }
      }
    });
  };

  const handleCanvasImagePick = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, async response => {
      if (response.didCancel) return;
      if (response.assets && response.assets.length > 0) {
        const imageUri = response.assets[0].uri;
        if (isConfigured) {
          try {
            Toast.show({ type: 'info', text1: 'Uploading Cover...' });
            const publicUrl = await uploadWatchImage(
              imageUri,
              `cover_${Date.now()}.jpg`,
            );
            setCoverImage(publicUrl);
          } catch (err) {
            setCoverImage(imageUri);
          }
        } else {
          setCoverImage(imageUri);
        }
      }
    });
  };

  const openTextEditor = key => {
    setActiveTextKey(key);
    setTempText(templateContent[key] || '');
    setModalVisible(true);
  };

  const saveTextEdit = () => {
    setTemplateContent(prev => ({ ...prev, [activeTextKey]: tempText }));
    setModalVisible(false);
  };

  const handlePrint = async () => {
    await handleSaveCurrentWatch();
    navigate('PDFPreview', {
      watchId: targetWatches.length > 0 ? targetWatches[0].id : watchId,
      selectedWatchIds: targetWatches.length > 1 ? selectedWatchIds : undefined,
      pdfMode,
      pdfConfig: {
        showPrice,
        showDesc,
        template: selectedTemplate,
        // Template canvas data
        templateBgColor,
        templateAccentColor,
        templateSecondaryAccent,
        templateContent,
        coverImage,
        // Details customization
        detailsFontFamily,
        detailsFontSize,
        detailsImageScale,
        detailsCodePrefix,
        detailsShowBrand,
        detailsFooterText,
      },
    });
  };

  const handleDownload = async () => {
    await handleSaveCurrentWatch();
    setIsDownloading(true);
    setTimeout(() => {
      setIsDownloading(false);
      Toast.show({ type: 'success', text1: 'Downloaded' });
    }, 2000);
  };


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.background} />
      <View style={styles.headerRow}>
        <Text style={styles.heroText}>Builder</Text>
      </View>

      {targetWatches.length > 1 && (
        <View style={styles.watchNavigator}>
          <TouchableOpacity
            style={[
              styles.navArrow,
              currentWatchIndex === 0 && styles.navArrowDisabled,
            ]}
            onPress={async () => {
              await handleSaveCurrentWatch();
              setCurrentWatchIndex(currentWatchIndex - 1);
            }}
            disabled={currentWatchIndex === 0}
          >
            <Icon name="chevron-left" size={20} color={THEME.primary} />
          </TouchableOpacity>
          <View style={styles.watchIndicatorContainer}>
            <Text style={styles.watchIndicatorText}>
              {currentWatchIndex + 1} of {targetWatches.length}
            </Text>
            <Text style={styles.watchIndicatorName} numberOfLines={1}>
              {currentWatch.brand} - {currentWatch.name}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.navArrow,
              currentWatchIndex === targetWatches.length - 1 &&
                styles.navArrowDisabled,
            ]}
            onPress={async () => {
              await handleSaveCurrentWatch();
              setCurrentWatchIndex(currentWatchIndex + 1);
            }}
            disabled={currentWatchIndex === targetWatches.length - 1}
          >
            <Icon name="chevron-right" size={20} color={THEME.primary} />
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formContainer}>
          {/* TEMPLATE SELECTOR */}
          <Animated.View style={[styles.templateSection, getAnimStyle(0)]}>
            <Text style={styles.label}>CHOOSE TEMPLATE</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.templateScroll}
            >
              {CATALOG_TEMPLATES.map(template => (
                <TouchableOpacity
                  key={template.id}
                  style={[
                    styles.templateCard,
                    selectedTemplate === template.id &&
                      styles.templateCardActive,
                  ]}
                  onPress={() => setSelectedTemplate(template.id)}
                >
                  {selectedTemplate === template.id && (
                    <View style={styles.activeTickBadge}>
                      <Icon name="check" size={10} color="#FFFFFF" />
                    </View>
                  )}
                  <View
                    style={[
                      styles.templatePreview,
                      { backgroundColor: template.previewColor },
                    ]}
                  >
                    <Text
                      style={[
                        styles.templatePreviewText,
                        { color: template.textColor || '#fff' },
                      ]}
                    >
                      {template.text}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>

          {/* WATCH IMAGE CARD */}
          <Animated.View style={[styles.cardContainer, getAnimStyle(1)]}>
            <TouchableOpacity
              style={styles.imageStage}
              activeOpacity={0.9}
              onPress={handleChangePhoto}
            >
              {imageUrl ? (
                <>
                  <Image
                    source={{ uri: imageUrl }}
                    style={styles.watchImage}
                    resizeMode="cover"
                  />
                  <View style={styles.imageOverlay} />
                  <View style={styles.changePhotoBadge}>
                    <Icon
                      name="camera"
                      size={14}
                      color={THEME.textDark}
                      style={styles.changePhotoIcon}
                    />
                    <Text style={styles.changePhotoText}>Change Photo</Text>
                  </View>
                </>
              ) : (
                <View style={styles.placeholderContainer}>
                  <Icon
                    name="camera"
                    size={32}
                    color={THEME.textMuted}
                    style={styles.placeholderIcon}
                  />
                  <Text style={styles.placeholderText}>Tap to Add Photo</Text>
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* BRAND & MODEL */}
          <Animated.View style={getAnimStyle(2)}>
            <Text style={styles.label}>BRAND & MODEL</Text>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.halfCol]}
                value={brand}
                onChangeText={setBrand}
                placeholder="Brand"
                placeholderTextColor={THEME.textMuted}
              />
              <TextInput
                style={[styles.input, styles.halfCol]}
                value={name}
                onChangeText={setName}
                placeholder="Model"
                placeholderTextColor={THEME.textMuted}
              />
            </View>
            <Text style={styles.label}>PRICE (₹)</Text>
            <TextInput
              style={styles.input}
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
              placeholder="Price"
              placeholderTextColor={THEME.textMuted}
            />
          </Animated.View>

          {/* LIVE COVER PAGE EDITOR */}
          <Animated.View style={[styles.canvasSection, getAnimStyle(3)]}>
            <Text style={styles.label}>COVER PAGE DESIGNER</Text>
            <Text style={styles.canvasHint}>
              Tap any text or image on the canvas to customize
            </Text>
            <View style={styles.canvasContainer}>
              <TemplateCoverCanvas
                bgColor={templateBgColor}
                accentColor={templateAccentColor}
                secondaryAccent={templateSecondaryAccent}
                content={templateContent}
                coverImage={coverImage}
                editMode={true}
                onTextEdit={openTextEditor}
                onImagePick={handleCanvasImagePick}
                canvasWidth={CANVAS_WIDTH}
                canvasHeight={CANVAS_HEIGHT}
              />
            </View>
          </Animated.View>

          {/* COLOR CUSTOMIZATION */}
          <Animated.View
            style={[
              styles.cardContainerBox,
              styles.colorSection,
              getAnimStyle(4),
            ]}
          >
            <Text style={styles.settingsHeader}>DESIGN SETTINGS</Text>

            <Text style={styles.colorLabel}>Background Color</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.colorRow}
            >
              {BG_PRESETS.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: c },
                    templateBgColor === c && styles.colorCircleActive,
                  ]}
                  onPress={() => setTemplateBgColor(c)}
                />
              ))}
            </ScrollView>

            <Text style={styles.colorLabel}>Accent Color</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.colorRow}
            >
              {ACCENT_PRESETS.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: c },
                    templateAccentColor === c && styles.colorCircleActive,
                  ]}
                  onPress={() => setTemplateAccentColor(c)}
                />
              ))}
            </ScrollView>
          </Animated.View>

          {/* DETAILS PAGE CUSTOMIZATION */}
          <Animated.View
            style={[
              styles.cardContainerBox,
              { marginTop: 24 },
              getAnimStyle(5),
            ]}
          >
            <Text style={styles.settingsHeader}>DETAILS PAGE CUSTOMIZATION</Text>

            <Text style={styles.customLabel}>FONT FAMILY</Text>
            <View style={styles.selectorRow}>
              {[
                { label: 'Sans-Serif', value: 'sans-serif' },
                { label: 'Serif', value: 'serif' },
                { label: 'Monospace', value: 'monospace' },
              ].map(item => (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.selectorButton,
                    detailsFontFamily === item.value && styles.selectorButtonActive,
                  ]}
                  onPress={() => setDetailsFontFamily(item.value)}
                >
                  <Text
                    style={[
                      styles.selectorButtonText,
                      detailsFontFamily === item.value && styles.selectorButtonTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.customLabel}>FONT SIZE</Text>
            <View style={styles.selectorRow}>
              {[
                { label: 'Small', value: 'small' },
                { label: 'Medium', value: 'medium' },
                { label: 'Large', value: 'large' },
              ].map(item => (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.selectorButton,
                    detailsFontSize === item.value && styles.selectorButtonActive,
                  ]}
                  onPress={() => setDetailsFontSize(item.value)}
                >
                  <Text
                    style={[
                      styles.selectorButtonText,
                      detailsFontSize === item.value && styles.selectorButtonTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.customLabel}>IMAGE SIZE (SCALE)</Text>
            <View style={styles.selectorRow}>
              {[
                { label: '80%', value: 0.8 },
                { label: '100%', value: 1.0 },
                { label: '120%', value: 1.2 },
              ].map(item => (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.selectorButton,
                    detailsImageScale === item.value && styles.selectorButtonActive,
                  ]}
                  onPress={() => setDetailsImageScale(item.value)}
                >
                  <Text
                    style={[
                      styles.selectorButtonText,
                      detailsImageScale === item.value && styles.selectorButtonTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.customLabel}>CODE LABEL PREFIX</Text>
            <TextInput
              style={styles.customInput}
              value={detailsCodePrefix}
              onChangeText={setDetailsCodePrefix}
              placeholder="e.g. CODE:"
              placeholderTextColor={THEME.textMuted}
            />

            <Text style={styles.customLabel}>FOOTER CUSTOM TEXT</Text>
            <TextInput
              style={styles.customInput}
              value={detailsFooterText}
              onChangeText={setDetailsFooterText}
              placeholder="e.g. Custom Footer Text"
              placeholderTextColor={THEME.textMuted}
            />

            <View style={[styles.switchRow, { borderBottomWidth: 0, marginTop: 12 }]}>
              <Text style={styles.settingText}>Show Brand Name</Text>
              <Switch
                value={detailsShowBrand}
                onValueChange={setDetailsShowBrand}
                thumbColor={THEME.surface}
                trackColor={{ true: THEME.primary }}
              />
            </View>
          </Animated.View>

          {/* EXPORT CONFIGURATION */}
          <Animated.View
            style={[
              styles.cardContainerBox,
              styles.exportSection,
              getAnimStyle(6),
            ]}
          >
            <Text style={styles.settingsHeader}>EXPORT CONFIGURATION</Text>
            <View style={styles.switchRow}>
              <Text style={styles.settingText}>Show Price Tag</Text>
              <Switch
                value={showPrice}
                onValueChange={setShowPrice}
                thumbColor={THEME.surface}
                trackColor={{ true: THEME.primary }}
              />
            </View>
            <View style={[styles.switchRow, styles.switchRowLast]}>
              <Text style={styles.settingText}>Show Description Text</Text>
              <Switch
                value={showDesc}
                onValueChange={setShowDesc}
                thumbColor={THEME.surface}
                trackColor={{ true: THEME.primary }}
              />
            </View>
          </Animated.View>

          {/* ACTION BUTTONS */}
          <Animated.View style={[styles.actionsWrapper, getAnimStyle(7)]}>
            <TouchableOpacity
              style={styles.btnPrimary}
              onPress={handlePrint}
              activeOpacity={0.8}
            >
              <Icon
                name="printer"
                color={THEME.textDark}
                size={20}
                style={styles.btnIcon}
              />
              <Text style={styles.btnTextPrimary}>Print Preview (PDF)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btnSecondary}
              onPress={handleDownload}
              activeOpacity={0.8}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <ActivityIndicator size="small" color={THEME.primary} />
              ) : (
                <>
                  <Icon
                    name="download"
                    color={THEME.surface}
                    size={20}
                    style={styles.btnIcon}
                  />
                  <Text style={styles.btnTextSecondary}>Download PDF</Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* TEXT EDIT MODAL */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Text</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="x" size={24} color={THEME.textDark} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.modalInput}
              value={tempText}
              onChangeText={setTempText}
              autoFocus
              multiline={
                activeTextKey === 'subtitle' || activeTextKey === 'title'
              }
            />
            <TouchableOpacity
              style={styles.modalSaveBtn}
              onPress={saveTextEdit}
            >
              <Text style={styles.modalSaveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.background },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  heroText: {
    fontSize: 32,
    fontWeight: '400',
    color: THEME.textDark,
    letterSpacing: -0.5,
  },
  scrollContent: { paddingBottom: 40 },
  formContainer: { paddingHorizontal: 20 },
  watchNavigator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: THEME.surface,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 2,
  },
  navArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navArrowDisabled: { opacity: 0.3 },
  watchIndicatorContainer: { flex: 1, alignItems: 'center' },
  watchIndicatorText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.textMuted,
  },
  watchIndicatorName: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.textDark,
  },
  label: {
    fontSize: 12,
    color: THEME.textMuted,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 20,
  },
  input: {
    backgroundColor: THEME.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 15,
    color: THEME.textDark,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  row: { flexDirection: 'row', gap: 12 },
  halfCol: { flex: 1 },
  cardContainer: {
    backgroundColor: THEME.surface,
    borderRadius: 32,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  cardContainerBox: {
    backgroundColor: THEME.surface,
    borderRadius: 32,
    paddingVertical: 22,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  templateSection: { marginBottom: 12 },
  templateScroll: { gap: 12 },
  templateCard: {
    width: 120,
    backgroundColor: THEME.surface,
    borderRadius: 24,
    borderColor: 'transparent',
    position: 'relative',
    alignItems: 'center',
    marginTop: 10,
  },
  templateCardActive: { borderColor: THEME.primary },
  templatePreview: {
    width: '100%',
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  templatePreviewText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 3,
    textAlign: 'center',
    textTransform: 'uppercase',
    paddingLeft: 3,
  },
  activeTickBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#2ECC71',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 100,
  },
  imageStage: {
    width: '100%',
    aspectRatio: 0.9,
    backgroundColor: THEME.background,
    borderRadius: 28,
    overflow: 'hidden',
    position: 'relative',
  },
  watchImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '35%',
    backgroundColor: 'rgba(0,0,0,0.25)',
    zIndex: 2,
  },
  changePhotoBadge: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.accentColor,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 3,
  },
  changePhotoIcon: { marginRight: 6 },
  changePhotoText: {
    color: THEME.textDark,
    fontSize: 14,
    fontWeight: '600',
  },
  placeholderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderIcon: { marginBottom: 8 },
  placeholderText: {
    fontSize: 15,
    color: THEME.textMuted,
    fontWeight: '500',
  },

  // Canvas section
  canvasSection: { marginTop: 24 },
  canvasHint: {
    fontSize: 13,
    color: THEME.textMuted,
    marginBottom: 16,
    fontWeight: '400',
  },
  canvasContainer: {
    alignItems: 'center',
    borderRadius: 24,
    overflow: 'hidden',
  },

  // Color customization
  colorSection: { marginTop: 24 },
  colorLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.textMuted,
    marginBottom: 10,
  },
  colorRow: { flexDirection: 'row', marginBottom: 20 },
  colorCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  colorCircleActive: {
    borderWidth: 3,
    borderColor: THEME.accentColor,
  },

  // Export config
  exportSection: { marginTop: 24 },
  settingsHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.textMuted,
    letterSpacing: 1,
    marginBottom: 12,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: THEME.background,
  },
  switchRowLast: { borderBottomWidth: 0 },
  settingText: { fontSize: 15, fontWeight: '500', color: THEME.textDark },
  actionsWrapper: { marginTop: 40, marginBottom: 20, gap: 12 },
  btnPrimary: {
    backgroundColor: THEME.accentColor,
    flexDirection: 'row',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  btnTextPrimary: { color: THEME.textDark, fontWeight: '600', fontSize: 16 },
  btnSecondary: {
    backgroundColor: THEME.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    borderRadius: 30,
  },
  btnTextSecondary: { fontWeight: '600', fontSize: 16, color: THEME.surface },
  btnIcon: { marginRight: 8 },
  bottomSpacer: { height: 120 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: THEME.surface,
    borderRadius: 24,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: THEME.textDark },
  modalInput: {
    backgroundColor: THEME.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: THEME.textDark,
    minHeight: 60,
    marginBottom: 24,
  },
  modalSaveBtn: {
    backgroundColor: THEME.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  modalSaveBtnText: { color: THEME.surface, fontSize: 16, fontWeight: '700' },

  selectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    marginBottom: 16,
  },
  selectorButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    alignItems: 'center',
    backgroundColor: THEME.surface,
  },
  selectorButtonActive: {
    borderColor: THEME.primary,
    backgroundColor: THEME.primary,
  },
  selectorButtonText: {
    fontSize: 13,
    color: THEME.textDark,
    fontWeight: '600',
  },
  selectorButtonTextActive: {
    color: THEME.surface,
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
  errorButtonText: { color: THEME.surface, fontSize: 15, fontWeight: '600' },
});

export default CatalogueBuilderScreen;
