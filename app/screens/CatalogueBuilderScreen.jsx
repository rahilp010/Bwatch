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
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import { useApp } from '../context/AppContext';

const { width } = Dimensions.get('window');

// --- THEME CONSTANTS MATCHING DASHBOARD & ADD WATCH ---
const THEME = {
  background: '#FAFAFA',
  surface: '#FFFFFF',
  primary: '#000000ff',
  textDark: '#232F2C',
  textMuted: '#7E918C',
  imageBg: '#E0EAE8',
};

const PRESET_IMAGES = [
  'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1547996160-81dfa63595aa?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1508656937213-bea3594fa3df?q=80&w=600&auto=format&fit=crop',
];

// Predefined Premium Catalog Templates
const CATALOG_TEMPLATES = [
  { id: 'minimal', name: 'Minimal', description: 'Clean & modern layout', previewColor: '#F5F5F5' },
  { id: 'luxury', name: 'Luxury', description: 'Elegant dark gold theme', previewColor: '#1A1A1A' },
  { id: 'vintage', name: 'Vintage', description: 'Classic retro cream style', previewColor: '#E8D5B7' },
  { id: 'modern', name: 'Modern', description: 'Bold red & navy contemporary', previewColor: '#2C3E50' },
  { id: 'midnight_gold', name: 'Midnight Gold', description: 'Premium navy & gold luxury', previewColor: '#0A1118' },
  { id: 'royal_minimalist', name: 'Royal Emerald', description: 'Emerald green serif layout', previewColor: '#FAFAF9' },
  { id: 'rose_gold_edition', name: 'Rose Gold', description: 'Soft warm rose-gold premium', previewColor: '#FDFBF7' },
];

const ACCENT_COLORS = [
  { name: 'Dark', value: '#121212' },
  { name: 'Gold', value: '#D4AF37' },
  { name: 'Emerald', value: '#0E3D26' },
  { name: 'Rose Gold', value: '#B76E79' },
  { name: 'Crimson', value: '#8B0000' },
  { name: 'Vibrant Red', value: '#E74C3C' },
];

const BG_COLORS = [
  { name: 'White', value: '#FFFFFF' },
  { name: 'Luxury Dark', value: '#1A1A1A' },
  { name: 'Midnight', value: '#0A1118' },
  { name: 'Vintage Sand', value: '#E8D5B7' },
  { name: 'Soft Gray', value: '#FAFAF9' },
  { name: 'Warm Cream', value: '#FDFBF7' },
];

const FONTS = [
  { label: 'Serif', value: 'serif' },
  { label: 'Sans-Serif', value: 'sans-serif' },
  { label: 'Monospace', value: 'monospace' },
];

const BORDERS = [
  { label: 'None', value: 'none' },
  { label: 'Solid', value: 'single' },
  { label: 'Dotted', value: 'dotted' },
];

const TEMPLATE_DEFAULTS = {
  minimal: { accentColor: '#121212', customBgColor: '#FFFFFF', fontFamily: 'sans-serif', borderType: 'none', coverTitle: 'B-WATCH', coverSubtitle: 'OFFICIAL CATALOGUE', watermarkText: 'B-WATCH' },
  luxury: { accentColor: '#D4AF37', customBgColor: '#1A1A1A', fontFamily: 'serif', borderType: 'single', coverTitle: 'LUXURY COLLECTION', coverSubtitle: 'OFFICIAL CATALOGUE', watermarkText: 'LUXURY' },
  vintage: { accentColor: '#4A3C2A', customBgColor: '#E8D5B7', fontFamily: 'serif', borderType: 'none', coverTitle: 'VINTAGE SELECTION', coverSubtitle: 'RETRO EDITION', watermarkText: 'VINTAGE' },
  modern: { accentColor: '#E74C3C', customBgColor: '#2C3E50', fontFamily: 'sans-serif', borderType: 'none', coverTitle: 'MODERN CHRONO', coverSubtitle: 'CONTEMPORARY EDITION', watermarkText: 'MODERN' },
  midnight_gold: { accentColor: '#D4AF37', customBgColor: '#0A1118', fontFamily: 'serif', borderType: 'single', coverTitle: 'MIDNIGHT GOLD', coverSubtitle: 'PREMIUM TIMEPIECES', watermarkText: 'MIDNIGHT' },
  royal_minimalist: { accentColor: '#0E3D26', customBgColor: '#FAFAF9', fontFamily: 'serif', borderType: 'single', coverTitle: 'ROYAL MINIMALIST', coverSubtitle: 'EXQUISITE CRAFTSMANSHIP', watermarkText: 'ROYAL' },
  rose_gold_edition: { accentColor: '#B76E79', customBgColor: '#FDFBF7', fontFamily: 'serif', borderType: 'none', coverTitle: 'ROSE GOLD', coverSubtitle: 'LIMITED ARCHIVE', watermarkText: 'ROSE GOLD' },
};

const CatalogueBuilderScreen = () => {
  const { params, watches, updateWatch, navigate, goBack } = useApp();

  const selectedWatchIds = params?.selectedWatchIds || [];
  const pdfMode = params?.pdfMode || 'single';
  const selectedWatches = watches.filter(w => selectedWatchIds.includes(w.id));
  const watchId = params?.watchId || (watches.length > 0 ? watches[0].id : null);
  const watch = watches.find(w => w.id === watchId);
  const targetWatches = selectedWatches.length > 0 ? selectedWatches : watch ? [watch] : [];

  // Track which watch is currently being edited (for multi-watch mode)
  const [currentWatchIndex, setCurrentWatchIndex] = useState(0);
  const currentWatch = targetWatches[currentWatchIndex] || null;

  const [showPrice, setShowPrice] = useState(true);
  const [showLogo, setShowLogo] = useState(true);
  const [showDesc, setShowDesc] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState('minimal');

  const [accentColor, setAccentColor] = useState('#121212');
  const [customBgColor, setCustomBgColor] = useState('#FFFFFF');
  const [fontFamily, setFontFamily] = useState('sans-serif');
  const [borderType, setBorderType] = useState('none');
  const [coverTitle, setCoverTitle] = useState('B-WATCH');
  const [coverSubtitle, setCoverSubtitle] = useState('OFFICIAL CATALOGUE');
  const [watermarkText, setWatermarkText] = useState('B-WATCH');

  const [brand, setBrand] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [color, setColor] = useState('');
  const [strap, setStrap] = useState('');
  const [type, setType] = useState('');
  const [gender, setGender] = useState('');

  const [showGallery, setShowGallery] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showLivePreview, setShowLivePreview] = useState(true);

  // Load current watch data into form fields
  useEffect(() => {
    if (currentWatch) {
      setBrand(currentWatch.brand || '');
      setName(currentWatch.name || '');
      setPrice(currentWatch.price || '');
      setDescription(currentWatch.description || '');
      setImageUrl(currentWatch.image || '');
      setColor(currentWatch.color || 'Silver Dial');
      setStrap(currentWatch.strap || 'Metal');
      setType(currentWatch.type || 'Analogue');
      setGender(currentWatch.gender || 'Men');
    }
  }, [currentWatchIndex, currentWatch?.id]);

  useEffect(() => {
    const defaults = TEMPLATE_DEFAULTS[selectedTemplate];
    if (defaults) {
      setAccentColor(defaults.accentColor);
      setCustomBgColor(defaults.customBgColor);
      setFontFamily(defaults.fontFamily);
      setBorderType(defaults.borderType);
      setCoverTitle(
        targetWatches.length > 1
          ? 'COLLECTION'
          : brand
          ? brand.toUpperCase()
          : defaults.coverTitle,
      );
      setCoverSubtitle(defaults.coverSubtitle);
      setWatermarkText(defaults.watermarkText);
    }
  }, [selectedTemplate, targetWatches.length, brand]);

  const animValues = useRef([...Array(8)].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const animations = animValues.map(anim =>
      Animated.timing(anim, { toValue: 1, duration: 500, useNativeDriver: true }),
    );
    Animated.stagger(80, animations).start();
  }, [currentWatchIndex, animValues]);

  const getAnimStyle = index => ({
    opacity: animValues[index],
    transform: [{ translateY: animValues[index].interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
  });

  const getDynamicPreviewStyle = () => {
    const isDarkBg = ['#1A1A1A', '#0A1118'].includes(customBgColor);
    const selectedFont = fontFamily === 'serif' ? (Platform.OS === 'ios' ? 'Georgia' : 'serif') : fontFamily === 'monospace' ? (Platform.OS === 'ios' ? 'Courier' : 'monospace') : 'System';
    const textStyle = { fontFamily: selectedFont, color: isDarkBg ? '#FFFFFF' : '#000000' };
    let borderStyle = {};
    if (borderType === 'single') borderStyle = { borderWidth: 2, borderColor: accentColor };
    else if (borderType === 'dotted') borderStyle = { borderWidth: 2, borderColor: accentColor, borderStyle: 'dotted' };
    return { page: { backgroundColor: customBgColor, ...borderStyle }, text: textStyle, accentText: { ...textStyle, color: accentColor }, mutedText: { ...textStyle, color: isDarkBg ? '#CCCCCC' : '#666666' }, borderStyle, isDarkBg };
  };

  if (watches.length === 0) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Icon name="book" size={48} color={THEME.textMuted} />
        <Text style={styles.errorText}>No watches in collection to build a catalogue.</Text>
        <TouchableOpacity style={styles.errorButton} onPress={() => navigate('AddWatch')}>
          <Text style={styles.errorButtonText}>Add a Watch First</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!currentWatch) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Icon name="alert-triangle" size={48} color="#FF9800" />
        <Text style={styles.errorText}>Selected timepiece details could not be found.</Text>
        <TouchableOpacity style={styles.errorButton} onPress={() => goBack()}>
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Save current watch edits
  const handleSaveCurrentWatch = async () => {
    await updateWatch(currentWatch.id, {
      brand, name, price, description, image: imageUrl, color, strap, type, gender,
    });
  };

  // Save all watches and navigate to PDF preview
  const handlePrint = async () => {
    // Save current watch first
    await handleSaveCurrentWatch();
    
    Toast.show({
      type: 'success',
      text1: 'Saved',
      text2: `Watch "${name}" updated successfully!`,
    });

    navigate('PDFPreview', {
      watchId: targetWatches.length > 0 ? targetWatches[0].id : watchId,
      selectedWatchIds: targetWatches.length > 1 ? selectedWatchIds : undefined,
      pdfMode: pdfMode,
      pdfConfig: {
        showPrice, showLogo, showDesc, template: selectedTemplate,
        accentColor, customBgColor, fontFamily, borderType,
        coverTitle, coverSubtitle, watermarkText,
      },
    });
  };

  const handleDownload = async () => {
    await handleSaveCurrentWatch();
    setIsDownloading(true);
    setTimeout(() => {
      setIsDownloading(false);
      Toast.show({
        type: 'success',
        text1: 'Download Complete',
        text2: `PDF Catalogue for "${brand} ${name}" downloaded successfully!`,
      });
    }, 2000);
  };

  // Navigate to next/previous watch in multi-watch mode
  const goToNextWatch = async () => {
    // Save current watch before moving
    await handleSaveCurrentWatch();
    if (currentWatchIndex < targetWatches.length - 1) {
      setCurrentWatchIndex(currentWatchIndex + 1);
    }
  };

  const goToPrevWatch = async () => {
    // Save current watch before moving
    await handleSaveCurrentWatch();
    if (currentWatchIndex > 0) {
      setCurrentWatchIndex(currentWatchIndex - 1);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.background} />

      {/* HEADER */}
      <View style={styles.headerRow}>
        <Text style={styles.heroText}>
          {targetWatches.length > 1 ? 'Edit Watches' : 'Catalogue Details'}
        </Text>
      </View>

      {/* WATCH NAVIGATOR (Multi-watch mode) */}
      {targetWatches.length > 1 && (
        <View style={styles.watchNavigator}>
          <TouchableOpacity
            style={[styles.navArrow, currentWatchIndex === 0 && styles.navArrowDisabled]}
            onPress={goToPrevWatch}
            disabled={currentWatchIndex === 0}
          >
            <Icon name="chevron-left" size={20} color={currentWatchIndex === 0 ? THEME.textMuted : THEME.primary} />
          </TouchableOpacity>
          
          <View style={styles.watchIndicatorContainer}>
            <Text style={styles.watchIndicatorText}>
              {currentWatchIndex + 1} of {targetWatches.length}
            </Text>
            <Text style={styles.watchIndicatorName} numberOfLines={1}>
              {currentWatch.brand} - {currentWatch.name}
            </Text>
            {/* Progress dots */}
            <View style={styles.progressDots}>
              {targetWatches.map((_, idx) => (
                <View
                  key={idx}
                  style={[styles.progressDot, idx === currentWatchIndex && styles.progressDotActive]}
                />
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.navArrow, currentWatchIndex === targetWatches.length - 1 && styles.navArrowDisabled]}
            onPress={goToNextWatch}
            disabled={currentWatchIndex === targetWatches.length - 1}
          >
            <Icon name="chevron-right" size={20} color={currentWatchIndex === targetWatches.length - 1 ? THEME.textMuted : THEME.primary} />
          </TouchableOpacity>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          {/* TEMPLATE SELECTION */}
          <Animated.View style={[styles.templateSection, getAnimStyle(0)]}>
            <Text style={styles.label}>CHOOSE TEMPLATE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.templateScroll}>
              {CATALOG_TEMPLATES.map(template => (
                <TouchableOpacity
                  key={template.id}
                  style={[styles.templateCard, selectedTemplate === template.id && styles.templateCardActive]}
                  onPress={() => setSelectedTemplate(template.id)}
                >
                  <View style={[styles.templatePreview, { backgroundColor: template.previewColor }]} />
                  <Text style={[styles.templateName, selectedTemplate === template.id && styles.templateNameActive]}>{template.name}</Text>
                  <Text style={styles.templateDesc}>{template.description}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>

          {/* IMAGE PREVIEW AND EDIT */}
          <Animated.View style={[styles.cardContainer, getAnimStyle(1)]}>
            <View style={styles.imageStage}>
              {imageUrl ? (
                <Image source={{ uri: imageUrl }} style={styles.watchImage} resizeMode="contain" />
              ) : (
                <Icon name="image" size={32} color={THEME.textMuted} />
              )}
            </View>
            <TouchableOpacity style={styles.editImageBtn} onPress={() => setShowGallery(!showGallery)}>
              <Icon name="edit-2" size={14} color={THEME.surface} style={{ marginRight: 6 }} />
              <Text style={styles.editImageBtnText}>Change Photo</Text>
            </TouchableOpacity>
            {showGallery && (
              <View style={styles.galleryChooser}>
                <Text style={styles.galleryHeading}>PREMIUM PRESETS</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryScroll}>
                  {PRESET_IMAGES.map((img, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.galleryThumbWrapper, imageUrl === img && styles.galleryThumbWrapperActive]}
                      onPress={() => { setImageUrl(img); setShowGallery(false); }}
                    >
                      <Image source={{ uri: img }} style={styles.galleryThumb} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </Animated.View>

          {/* EDIT FORM */}
          <Animated.View style={getAnimStyle(2)}>
            <Text style={styles.label}>BRAND NAME</Text>
            <TextInput style={styles.input} value={brand} onChangeText={setBrand} placeholder="Brand Name" placeholderTextColor={THEME.textMuted} />
            <Text style={styles.label}>MODEL NAME</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Model Name" placeholderTextColor={THEME.textMuted} />
            <Text style={styles.label}>PRICE (₹)</Text>
            <TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="Price" placeholderTextColor={THEME.textMuted} />
          </Animated.View>

          {/* SPECIFICATIONS EDIT */}
          <Animated.View style={getAnimStyle(3)}>
            <Text style={styles.label}>DIAL COLOR</Text>
            <TextInput style={styles.input} value={color} onChangeText={setColor} placeholder="Dial Color" placeholderTextColor={THEME.textMuted} />
            <View style={styles.row}>
              <View style={styles.halfCol}>
                <Text style={styles.label}>STRAP</Text>
                <TextInput style={styles.input} value={strap} onChangeText={setStrap} placeholder="Strap Type" placeholderTextColor={THEME.textMuted} />
              </View>
              <View style={styles.halfCol}>
                <Text style={styles.label}>WATCH TYPE</Text>
                <TextInput style={styles.input} value={type} onChangeText={setType} placeholder="Type" placeholderTextColor={THEME.textMuted} />
              </View>
            </View>
            <Text style={styles.label}>GENDER</Text>
            <TextInput style={styles.input} value={gender} onChangeText={setGender} placeholder="Gender (Men/Women)" placeholderTextColor={THEME.textMuted} />
          </Animated.View>

          <Animated.View style={getAnimStyle(4)}>
            <Text style={styles.label}>DESCRIPTION</Text>
            <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} multiline textAlignVertical="top" placeholder="Description" placeholderTextColor={THEME.textMuted} />
          </Animated.View>

          {/* LIVE PREVIEW SECTION */}
          <Animated.View style={[styles.cardContainer, { marginTop: 24 }, getAnimStyle(5)]}>
            <TouchableOpacity style={styles.previewHeader} onPress={() => setShowLivePreview(!showLivePreview)}>
              <View style={styles.previewHeaderLeft}>
                <Icon name="eye" size={18} color={THEME.textDark} style={{ marginRight: 8 }} />
                <Text style={styles.previewHeaderText}>Live PDF Preview</Text>
              </View>
              <Icon name={showLivePreview ? 'chevron-up' : 'chevron-down'} size={20} color={THEME.textMuted} />
            </TouchableOpacity>
            {showLivePreview && (() => {
              const previewStyle = getDynamicPreviewStyle();
              const miniGridItems = targetWatches.length > 1 ? [1, 2, 3] : [1];
              return (
                <View style={styles.previewContent}>
                  <Text style={styles.miniPageLabel}>Page 1 (Cover)</Text>
                  <View style={[styles.miniHeroPage, previewStyle.borderStyle]}>
                    <Text style={[styles.miniHeroTitle, { fontFamily: previewStyle.text.fontFamily }]}>{name || 'Watch Name Here'}</Text>
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                      {imageUrl ? (
                        <Image source={{ uri: imageUrl }} style={{ width: 100, height: 100 }} resizeMode="contain" />
                      ) : (
                        <Icon name="image" size={24} color="#555" />
                      )}
                    </View>
                    <View style={styles.miniDescBox}>
                      <Text style={{ color: '#FFF', fontSize: 6, fontWeight: '700', marginBottom: 4 }}>DESCRIPTION</Text>
                      <Text style={{ color: '#999', fontSize: 5 }}>Brand: <Text style={{ color: '#FFF' }}>{brand}</Text></Text>
                      <Text style={{ color: '#999', fontSize: 5 }}>Type: <Text style={{ color: '#FFF' }}>{type}</Text></Text>
                    </View>
                  </View>
                  <Text style={[styles.miniPageLabel, { marginTop: 12 }]}>Page 2 (Grid Catalog)</Text>
                  <View style={[styles.miniPage, previewStyle.page]}>
                    <View style={[styles.miniGrid, targetWatches.length === 1 && { justifyContent: 'center' }]}>
                      {miniGridItems.map((item, idx) => (
                        <View key={idx} style={[styles.miniGridItem, targetWatches.length === 1 && { width: '80%' }]}>
                          {imageUrl ? (
                            <Image source={{ uri: imageUrl }} style={{ width: '100%', height: 40, marginBottom: 4 }} resizeMode="contain" />
                          ) : (
                            <View style={{ width: '100%', height: 40, backgroundColor: '#EEE', marginBottom: 4 }} />
                          )}
                          <Text style={[previewStyle.text, { fontSize: 6, fontWeight: '700', textAlign: 'center' }]}>{name || 'Product'}</Text>
                          <Text style={[previewStyle.mutedText, { fontSize: 5, textAlign: 'center', marginBottom: 2 }]}>CODE: W_001</Text>
                          {showPrice && (
                            <Text style={[previewStyle.text, { fontSize: 6, fontWeight: '700', textAlign: 'center' }]}>₹{price || '0.00'}</Text>
                          )}
                        </View>
                      ))}
                    </View>
                    <View style={[styles.miniFooter, { borderTopColor: previewStyle.isDarkBg ? '#333' : '#EAEAEA' }]}>
                      <Text style={[previewStyle.mutedText, { fontSize: 5 }]}>{coverTitle} / {coverSubtitle}</Text>
                    </View>
                  </View>
                </View>
              );
            })()}
          </Animated.View>

          {/* CATALOG CUSTOMIZATION */}
          <Animated.View style={[styles.cardContainer, { marginTop: 24 }, getAnimStyle(5)]}>
            <Text style={styles.settingsHeader}>CATALOG CUSTOMIZATION</Text>
            <Text style={styles.customLabel}>ACCENT COLOR</Text>
            <View style={styles.colorPickerContainer}>
              {ACCENT_COLORS.map(c => (
                <TouchableOpacity key={c.value} style={[styles.colorBubble, { backgroundColor: c.value }, accentColor === c.value && styles.colorBubbleActive]} onPress={() => setAccentColor(c.value)}>
                  {accentColor === c.value && <Icon name="check" size={14} color={c.value === '#FFFFFF' ? '#000' : '#FFF'} />}
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.customLabel}>BACKGROUND COLOR</Text>
            <View style={styles.colorPickerContainer}>
              {BG_COLORS.map(c => (
                <TouchableOpacity key={c.value} style={[styles.colorBubble, { backgroundColor: c.value, borderWidth: 1, borderColor: '#DDD' }, customBgColor === c.value && styles.colorBubbleActive]} onPress={() => setCustomBgColor(c.value)}>
                  {customBgColor === c.value && <Icon name="check" size={14} color={['#FFFFFF', '#FAFAF9', '#FDFBF7', '#E8D5B7'].includes(c.value) ? '#000' : '#FFF'} />}
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.customLabel}>TYPOGRAPHY</Text>
            <View style={styles.choiceGroup}>
              {FONTS.map(f => (
                <TouchableOpacity key={f.value} style={[styles.choiceButton, fontFamily === f.value && styles.choiceButtonActive]} onPress={() => setFontFamily(f.value)}>
                  <Text style={[styles.choiceText, fontFamily === f.value && styles.choiceTextActive]}>{f.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.customLabel}>PAGE BORDER STYLE</Text>
            <View style={styles.choiceGroup}>
              {BORDERS.map(b => (
                <TouchableOpacity key={b.value} style={[styles.choiceButton, borderType === b.value && styles.choiceButtonActive]} onPress={() => setBorderType(b.value)}>
                  <Text style={[styles.choiceText, borderType === b.value && styles.choiceTextActive]}>{b.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.customLabel}>COVER PAGE TITLE</Text>
            <TextInput style={styles.customInput} value={coverTitle} onChangeText={setCoverTitle} placeholder="e.g. EXCLUSIVE TIMEPIECES" placeholderTextColor={THEME.textMuted} />
            <Text style={styles.customLabel}>COVER PAGE SUBTITLE</Text>
            <TextInput style={styles.customInput} value={coverSubtitle} onChangeText={setCoverSubtitle} placeholder="e.g. OFFICIAL CATALOGUE" placeholderTextColor={THEME.textMuted} />
            <Text style={styles.customLabel}>WATERMARK TEXT</Text>
            <TextInput style={styles.customInput} value={watermarkText} onChangeText={setWatermarkText} placeholder="e.g. B-WATCH" placeholderTextColor={THEME.textMuted} />
          </Animated.View>

          {/* EXPORT CONFIGURATION */}
          <Animated.View style={[styles.cardContainer, { marginTop: 24 }, getAnimStyle(6)]}>
            <Text style={styles.settingsHeader}>EXPORT CONFIGURATION</Text>
            <View style={styles.switchRow}>
              <Text style={styles.settingText}>Show Price Tag</Text>
              <Switch value={showPrice} onValueChange={setShowPrice} trackColor={{ true: THEME.primary, false: '#CCC' }} thumbColor={THEME.surface} />
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.settingText}>Include Brand Logo</Text>
              <Switch value={showLogo} onValueChange={setShowLogo} trackColor={{ true: THEME.primary, false: '#CCC' }} thumbColor={THEME.surface} />
            </View>
            <View style={[styles.switchRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.settingText}>Show Description Text</Text>
              <Switch value={showDesc} onValueChange={setShowDesc} trackColor={{ true: THEME.primary, false: '#CCC' }} thumbColor={THEME.surface} />
            </View>
          </Animated.View>

          {/* BUTTON ACTIONS */}
          <Animated.View style={[styles.actionsWrapper, getAnimStyle(7)]}>
            <TouchableOpacity style={styles.btnPrimary} onPress={handlePrint} activeOpacity={0.8}>
              <Icon name="printer" color={THEME.surface} size={20} style={{ marginRight: 8 }} />
              <Text style={styles.btnTextPrimary}>Print Preview (PDF)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnSecondary} onPress={handleDownload} activeOpacity={0.8} disabled={isDownloading}>
              {isDownloading ? (
                <ActivityIndicator size="small" color={THEME.primary} />
              ) : (
                <>
                  <Icon name="download" color={THEME.primary} size={20} style={{ marginRight: 8 }} />
                  <Text style={styles.btnTextSecondary}>Download PDF</Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>
        <View style={{ height: 120 }} />
      </ScrollView>
      <Toast />
    </SafeAreaView>
  );
};

// --- STYLES ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.background },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12 },
  heroText: { fontSize: 28, fontWeight: '400', color: THEME.textDark, alignSelf: 'flex-start', letterSpacing: -0.5 },
  scrollContent: { paddingBottom: 40 },
  formContainer: { paddingHorizontal: 24 },
  
  // Watch Navigator styles
  watchNavigator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 24,
    marginBottom: 16,
    backgroundColor: THEME.surface,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
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
  navArrowDisabled: {
    opacity: 0.5,
  },
  watchIndicatorContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 12,
  },
  watchIndicatorText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.textMuted,
    marginBottom: 4,
  },
  watchIndicatorName: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.textDark,
    marginBottom: 8,
    maxWidth: 200,
  },
  progressDots: {
    flexDirection: 'row',
    gap: 6,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.imageBg,
  },
  progressDotActive: {
    backgroundColor: THEME.primary,
    width: 20,
  },
  
  label: { fontSize: 12, color: THEME.textMuted, fontWeight: '700', letterSpacing: 1, marginBottom: 8, marginTop: 20 },
  input: { backgroundColor: THEME.surface, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 16, fontSize: 15, color: THEME.textDark, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 },
  row: { flexDirection: 'row', gap: 12 },
  halfCol: { flex: 1 },
  textArea: { height: 120, paddingTop: 16 },
  cardContainer: { backgroundColor: THEME.surface, borderRadius: 24, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  templateSection: { marginBottom: 8 },
  templateScroll: { gap: 12 },
  templateCard: { width: 120, backgroundColor: THEME.surface, borderRadius: 16, padding: 12, borderWidth: 2, borderColor: 'transparent', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 },
  templateCardActive: { borderColor: THEME.primary },
  templatePreview: { width: '100%', height: 60, borderRadius: 8, marginBottom: 8 },
  templateName: { fontSize: 14, fontWeight: '600', color: THEME.textDark, marginBottom: 2 },
  templateNameActive: { color: THEME.primary },
  templateDesc: { fontSize: 10, color: THEME.textMuted },
  imageStage: { width: '100%', height: 160, backgroundColor: THEME.imageBg, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  watchImage: { width: '90%', height: '90%' },
  editImageBtn: { backgroundColor: THEME.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 16 },
  editImageBtnText: { color: THEME.surface, fontSize: 13, fontWeight: '600' },
  galleryChooser: { width: '100%', marginTop: 16, borderTopWidth: 1, borderColor: THEME.imageBg, paddingTop: 16 },
  galleryHeading: { fontSize: 11, fontWeight: '700', color: THEME.textMuted, letterSpacing: 1, marginBottom: 12 },
  galleryScroll: { gap: 12 },
  galleryThumbWrapper: { width: 60, height: 60, borderRadius: 12, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent', backgroundColor: THEME.imageBg },
  galleryThumbWrapperActive: { borderColor: THEME.primary },
  galleryThumb: { width: '100%', height: '100%' },
  settingsHeader: { fontSize: 12, fontWeight: '700', color: THEME.textMuted, letterSpacing: 1, marginBottom: 12 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderColor: THEME.imageBg },
  settingText: { fontSize: 14, fontWeight: '600', color: THEME.textDark },
  actionsWrapper: { marginTop: 40, marginBottom: 20 },
  btnPrimary: { backgroundColor: THEME.primary, flexDirection: 'row', paddingVertical: 18, borderRadius: 20, alignItems: 'center', justifyContent: 'center', shadowColor: THEME.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 4, marginBottom: 16 },
  btnTextPrimary: { color: THEME.surface, fontWeight: '700', fontSize: 15 },
  btnSecondary: { backgroundColor: THEME.surface, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 18, borderRadius: 20, borderWidth: 2, borderColor: THEME.primary },
  btnTextSecondary: { fontWeight: '700', fontSize: 15, color: THEME.primary },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: THEME.background, padding: 24 },
  errorText: { fontSize: 16, color: THEME.textMuted, fontWeight: '600', marginTop: 16, marginBottom: 24, textAlign: 'center' },
  errorButton: { backgroundColor: THEME.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16 },
  errorButtonText: { color: THEME.surface, fontSize: 15, fontWeight: '700' },
  previewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottomWidth: 1, borderColor: THEME.imageBg },
  previewHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  miniPageLabel: { fontSize: 10, fontWeight: '700', color: THEME.textMuted, marginBottom: 8 },
  miniHeroPage: { height: 180, backgroundColor: '#1A1A1A', borderRadius: 12, padding: 12, position: 'relative', overflow: 'hidden' },
  miniHeroTitle: { color: '#FFF', fontSize: 14, fontWeight: '300' },
  miniDescBox: { position: 'absolute', bottom: 12, right: 12, backgroundColor: '#222', padding: 8, width: 90, borderWidth: 1, borderColor: '#444' },
  miniPage: { height: 180, backgroundColor: '#FAFAFA', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#EAEAEA' },
  miniGrid: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', marginHorizontal: -2 },
  miniGridItem: { width: '33.33%', padding: 4, alignItems: 'center' },
  miniFooter: { marginTop: 'auto', paddingTop: 8, borderTopWidth: 1, alignItems: 'center' },
  previewHeaderText: { fontSize: 15, fontWeight: '700', color: THEME.textDark },
  previewContent: { marginTop: 16, gap: 12 },
  customLabel: { fontSize: 11, fontWeight: '700', color: THEME.textMuted, marginBottom: 8, marginTop: 20, letterSpacing: 1 },
  colorPickerContainer: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  colorBubble: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  colorBubbleActive: { borderWidth: 2, borderColor: THEME.primary },
  choiceGroup: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  choiceButton: { flex: 1, paddingVertical: 12, backgroundColor: THEME.imageBg, borderRadius: 12, borderWidth: 2, borderColor: 'transparent', alignItems: 'center' },
  choiceButtonActive: { backgroundColor: THEME.surface, borderColor: THEME.primary },
  choiceText: { fontSize: 13, fontWeight: '600', color: THEME.textDark },
  choiceTextActive: { color: THEME.primary },
  customInput: { backgroundColor: THEME.imageBg, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 14, color: THEME.textDark, marginBottom: 4 },
});

export default CatalogueBuilderScreen;
