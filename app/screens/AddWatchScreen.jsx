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
  Dimensions,
  Image,
  Alert,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import Toast from 'react-native-toast-message';
import { useApp } from '../context/AppContext';
import { uploadWatchImage } from '../supabase/watchService';
import { isConfigured } from '../supabase/client';

const { width } = Dimensions.get('window');

// --- THEME MATCHING NEW DESIGN SYSTEM ---
const THEME = {
  background: '#E6E6E6',
  surface: '#FFFFFF',
  primary: '#1C1C1E',
  inactivePill: '#D4D4D4',
  textDark: '#1C1C1E',
  textLight: '#FFFFFF',
  textMuted: '#8E8E93',
  accentColor: '#F0FE67',
  imageBg: '#FFFFFF',
};

const PRESET_IMAGES = [];

const STRAP_OPTIONS = ['Metal', 'Leather', 'Rubber', 'Fabric'];
const WATCH_TYPES = ['Analogue', 'Digital', 'Smartwatch'];

const AddWatchScreen = () => {
  const { params, addWatch, updateWatch, watches, navigate, goBack } = useApp();
  const editWatchId = params?.watchId;
  const isEditMode = !!editWatchId;

  const [brand, setBrand] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [color, setColor] = useState('');
  const [gender, setGender] = useState('Men');
  const [strap, setStrap] = useState('Metal');
  const [type, setType] = useState('Analogue');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const [showGallery, setShowGallery] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const animValues = useRef(
    [...Array(10)].map(() => new Animated.Value(0)),
  ).current;

  useEffect(() => {
    if (isEditMode) {
      const watchToEdit = (watches || []).find(w => w.id === editWatchId);
      if (watchToEdit) {
        setBrand(watchToEdit.brand || '');
        setName(watchToEdit.name || '');
        setPrice(watchToEdit.price || '');
        setColor(watchToEdit.color || '');
        setGender(watchToEdit.gender || 'Men');
        setStrap(watchToEdit.strap || 'Metal');
        setType(watchToEdit.type || 'Analogue');
        setDescription(watchToEdit.description || '');
        setImageUrl(watchToEdit.image || '');
      }
    } else {
      setBrand('');
      setName('');
      setPrice('');
      setColor('');
      setGender('Men');
      setStrap('Metal');
      setType('Analogue');
      setDescription('');
      setImageUrl('');
    }
  }, [editWatchId, isEditMode, watches]);

  useEffect(() => {
    const animations = animValues.map(anim =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    );
    Animated.stagger(80, animations).start();
  }, [animValues]);

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'B-Watch needs access to your camera to scan timepieces.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        return false;
      }
    }
    return true;
  };

  const runCameraScan = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Toast.show({
        type: 'error',
        text1: 'Permission Denied',
        text2: 'Camera permission is required.',
      });
      return;
    }
    setIsScanning(true);
    scanLineAnim.setValue(0);
    Animated.sequence([
      Animated.timing(scanLineAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(scanLineAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        launchCamera(
          { mediaType: 'photo', quality: 0.8, saveToPhotos: true },
          async response => {
            setIsScanning(false);
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
                  Toast.show({ type: 'success', text1: 'Scan Complete' });
                } catch (error) {
                  setImageUrl(imageUri);
                }
              } else {
                setImageUrl(imageUri);
              }
            }
          },
        );
      }
    });
  };

  const handleBrowseDeviceLibrary = () => {
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
            setShowGallery(false);
          } catch (error) {
            setImageUrl(imageUri);
            setShowGallery(false);
          }
        } else {
          setImageUrl(imageUri);
          setShowGallery(false);
        }
      }
    });
  };

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

  const handleSave = async () => {
    if (!brand.trim() || !name.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please fill in Company and Model.',
      });
      return;
    }
    const watchData = {
      brand,
      name,
      price: price || '0.00',
      color: color || 'Default Dial',
      gender,
      strap,
      type,
      description: description || 'No description provided.',
      image: imageUrl,
    };
    if (isEditMode) {
      await updateWatch(editWatchId, watchData);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Watch updated successfully!',
      });
    } else {
      await addWatch(watchData);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Watch added to collection!',
      });
    }
    navigate('Dashboard');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.background} />
      <View style={styles.headerRow}>
        {isEditMode && (
          <TouchableOpacity
            style={[styles.iconButton, { marginRight: 16 }]}
            onPress={() => goBack()}
          >
            <Icon name="arrow-left" size={20} color={THEME.textDark} />
          </TouchableOpacity>
        )}
        <Text style={styles.heroText}>
          {isEditMode ? 'Edit Timepiece' : 'Add Timepiece'}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.formContainer}>
          <Animated.View style={[styles.uploadSection, getAnimStyle(1)]}>
            <View style={styles.dashedBox}>
              {isScanning ? (
                <View style={styles.scannerWrapper}>
                  <View style={styles.scanTargetBox}>
                    {/* <Icon name="camera" size={32} color={THEME.textMuted} /> */}
                    <MaterialIcon
                      name="camera-iris"
                      size={44}
                      color={THEME.textMuted}
                      style={styles.btnIcon}
                    />
                    <Text style={styles.scanningText}>Opening Camera...</Text>
                  </View>
                </View>
              ) : (
                <>
                  <View style={styles.imagePreviewWrapper}>
                    {imageUrl ? (
                      <Image
                        source={{ uri: imageUrl }}
                        style={styles.previewImage}
                        resizeMode="contain"
                      />
                    ) : (
                      // <Icon name="camera" size={32} color={THEME.textMuted} />
                      <MaterialIcon
                        name="camera-iris"
                        size={44}
                        color={THEME.textMuted}
                        style={styles.btnIcon}
                      />
                    )}
                  </View>
                  <View style={styles.uploadActionsRow}>
                    <TouchableOpacity
                      style={styles.uploadButtonDark}
                      activeOpacity={0.8}
                      onPress={() => setShowGallery(!showGallery)}
                    >
                      <Icon
                        name="image"
                        size={16}
                        color={THEME.surface}
                        style={styles.btnIcon}
                      />
                      <Text style={styles.uploadButtonTextDark}>Gallery</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.uploadButtonLight}
                      activeOpacity={0.8}
                      onPress={runCameraScan}
                    >
                      <MaterialIcon
                        name="camera-iris"
                        size={18}
                        color={THEME.primary}
                        style={styles.btnIcon}
                      />
                      <Text style={styles.uploadButtonTextLight}>Scan</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>

            {showGallery && (
              <View style={styles.galleryChooser}>
                <Text style={styles.galleryHeading}>PRESETS & LIBRARY</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.galleryScroll}
                >
                  <TouchableOpacity
                    style={[
                      styles.galleryThumbWrapper,
                      {
                        backgroundColor: THEME.primary,
                        alignItems: 'center',
                        justifyContent: 'center',
                      },
                    ]}
                    onPress={handleBrowseDeviceLibrary}
                  >
                    <Icon name="folder" size={18} color={THEME.surface} />
                  </TouchableOpacity>
                  {PRESET_IMAGES.map((img, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.galleryThumbWrapper,
                        imageUrl === img && styles.galleryThumbWrapperActive,
                      ]}
                      onPress={() => {
                        setImageUrl(img);
                        setShowGallery(false);
                      }}
                    >
                      <Image
                        source={{ uri: img }}
                        style={styles.galleryThumb}
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <View style={styles.urlInputRow}>
                  <TextInput
                    style={styles.urlInput}
                    placeholder="https://example.com/watch.png"
                    placeholderTextColor={THEME.textMuted}
                    value={customUrlInput}
                    onChangeText={setCustomUrlInput}
                  />
                  <TouchableOpacity
                    style={styles.urlApplyBtn}
                    onPress={() => {
                      if (customUrlInput.trim()) {
                        setImageUrl(customUrlInput);
                        setCustomUrlInput('');
                        setShowGallery(false);
                      }
                    }}
                  >
                    <Icon name="check" size={18} color={THEME.surface} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </Animated.View>

          <Animated.View style={getAnimStyle(2)}>
            <Text style={styles.label}>COMPANY NAME *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Rolex"
              placeholderTextColor={THEME.textMuted}
              value={brand}
              onChangeText={setBrand}
            />
          </Animated.View>

          <Animated.View style={getAnimStyle(3)}>
            <Text style={styles.label}>MODEL NUMBER *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Submariner"
              placeholderTextColor={THEME.textMuted}
              value={name}
              onChangeText={setName}
            />
          </Animated.View>

          <Animated.View style={getAnimStyle(4)}>
            <Text style={styles.label}>PRICE (₹)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 8500.00"
              placeholderTextColor={THEME.textMuted}
              keyboardType="numeric"
              value={price}
              onChangeText={setPrice}
            />
          </Animated.View>

          <Animated.View style={getAnimStyle(5)}>
            <Text style={styles.label}>COLOR DIAL</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Deep Blue"
              placeholderTextColor={THEME.textMuted}
              value={color}
              onChangeText={setColor}
            />
          </Animated.View>

          <Animated.View style={getAnimStyle(6)}>
            <Text style={styles.label}>GENDER</Text>
            <View style={styles.segmentedControl}>
              {['Men', 'Women', 'Unisex'].map(item => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.segmentButton,
                    gender === item && styles.segmentButtonActive,
                  ]}
                  onPress={() => setGender(item)}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      gender === item && styles.segmentTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          <Animated.View style={getAnimStyle(7)}>
            <Text style={styles.label}>STRAP TYPE</Text>
            <View style={styles.chipsRow}>
              {STRAP_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.chipButton,
                    strap === opt && styles.chipButtonActive,
                  ]}
                  onPress={() => setStrap(opt)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      strap === opt && styles.chipTextActive,
                    ]}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          <Animated.View style={getAnimStyle(8)}>
            <Text style={styles.label}>WATCH TYPE</Text>
            <View style={styles.chipsRow}>
              {WATCH_TYPES.map(opt => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.chipButton,
                    type === opt && styles.chipButtonActive,
                  ]}
                  onPress={() => setType(opt)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      type === opt && styles.chipTextActive,
                    ]}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          <Animated.View style={getAnimStyle(9)}>
            <Text style={styles.label}>DESCRIPTION</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Detailed specifications..."
              placeholderTextColor={THEME.textMuted}
              multiline
              textAlignVertical="top"
              value={description}
              onChangeText={setDescription}
            />
          </Animated.View>

          <Animated.View style={[styles.actionContainer, getAnimStyle(9)]}>
            <TouchableOpacity
              style={styles.saveButton}
              activeOpacity={0.8}
              onPress={handleSave}
            >
              <Icon
                name="check"
                size={20}
                color={THEME.textDark}
                style={{ marginRight: 8 }}
              />
              <Text style={styles.saveButtonText}>
                {isEditMode ? 'Update Timepiece' : 'Save to Collection'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.background },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  heroText: {
    fontSize: 32,
    fontWeight: '400',
    color: THEME.textDark,
    letterSpacing: -0.5,
  },
  iconButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: THEME.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  scrollContent: { paddingBottom: 40 },
  formContainer: { paddingHorizontal: 20 },
  uploadSection: { marginBottom: 24 },
  dashedBox: {
    borderRadius: 32,
    backgroundColor: THEME.surface,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  imagePreviewWrapper: {
    width: '100%',
    height: 180,
    borderRadius: 24,
    backgroundColor: THEME.background,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 16,
  },
  previewImage: { width: '100%', height: '100%' },
  uploadActionsRow: { flexDirection: 'row', width: '100%', gap: 12 },
  uploadButtonDark: {
    flex: 1,
    backgroundColor: THEME.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 20,
  },
  uploadButtonTextDark: {
    color: THEME.surface,
    fontSize: 14,
    fontWeight: '600',
  },
  uploadButtonLight: {
    flex: 1,
    backgroundColor: THEME.background,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 20,
  },
  uploadButtonTextLight: {
    color: THEME.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  btnIcon: { marginRight: 6 },
  scannerWrapper: {
    width: '100%',
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanTargetBox: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    borderColor: THEME.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.background,
  },
  scanningText: {
    fontSize: 13,
    color: THEME.primary,
    fontWeight: '600',
    marginTop: 10,
  },
  galleryChooser: {
    backgroundColor: THEME.surface,
    borderRadius: 24,
    padding: 20,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  galleryHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.textMuted,
    letterSpacing: 1,
    marginBottom: 12,
  },
  galleryScroll: { gap: 12 },
  galleryThumbWrapper: {
    width: 64,
    height: 64,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: THEME.background,
  },
  galleryThumbWrapperActive: { borderColor: THEME.primary },
  galleryThumb: { width: '100%', height: '100%' },
  urlInputRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  urlInput: {
    flex: 1,
    backgroundColor: THEME.background,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: THEME.textDark,
  },
  urlApplyBtn: {
    backgroundColor: THEME.primary,
    borderRadius: 16,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    color: THEME.textMuted,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 8,
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
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: THEME.surface,
    borderRadius: 20,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 16,
  },
  segmentButtonActive: { backgroundColor: THEME.primary },
  segmentText: { fontSize: 14, fontWeight: '600', color: THEME.textMuted },
  segmentTextActive: { color: THEME.surface },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chipButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    backgroundColor: THEME.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  chipButtonActive: { backgroundColor: THEME.primary },
  chipText: { fontSize: 14, fontWeight: '500', color: THEME.textMuted },
  chipTextActive: { color: THEME.surface, fontWeight: '600' },
  textArea: { height: 120, paddingTop: 16 },
  actionContainer: { marginTop: 40, marginBottom: 20 },
  saveButton: {
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
  saveButtonText: { color: THEME.textDark, fontSize: 16, fontWeight: '600' },
});

export default AddWatchScreen;
