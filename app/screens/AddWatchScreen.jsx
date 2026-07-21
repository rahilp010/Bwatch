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

// --- THEME CONSTANTS MATCHING DASHBOARD ---
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

const STRAP_OPTIONS = ['Metal', 'Leather', 'Rubber', 'Fabric'];
const WATCH_TYPES = ['Analogue', 'Digital', 'Smartwatch'];

const AddWatchScreen = () => {
  const { params, addWatch, updateWatch, watches, navigate, goBack } = useApp();

  const editWatchId = params?.watchId;
  const isEditMode = !!editWatchId;

  // Form State
  const [brand, setBrand] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [color, setColor] = useState('');
  const [gender, setGender] = useState('Men');
  const [strap, setStrap] = useState('Metal');
  const [type, setType] = useState('Analogue');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // Image Selection Modal/Options State
  const [showGallery, setShowGallery] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  // Setup Animated Values for staggered entrance
  const animValues = useRef(
    [...Array(10)].map(() => new Animated.Value(0)),
  ).current;

  // Set form fields based on whether we are in edit mode or add mode
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
        console.warn(err);
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
        text2: 'Camera permission is required to scan watches.',
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
        const options = {
          mediaType: 'photo',
          quality: 0.8,
          saveToPhotos: true,
        };

        launchCamera(options, async response => {
          setIsScanning(false);

          if (response.didCancel) {
            console.log('User cancelled camera picker');
          } else if (response.errorCode) {
            Toast.show({
              type: 'error',
              text1: 'Camera Error',
              text2: response.errorMessage || 'Failed to open camera.',
            });
          } else if (response.assets && response.assets.length > 0) {
            const imageUri = response.assets[0].uri;

            if (isConfigured) {
              try {
                Toast.show({
                  type: 'info',
                  text1: 'Uploading',
                  text2: 'Uploading image to cloud storage...',
                });
                const fileName = `watch_${Date.now()}.jpg`;
                const publicUrl = await uploadWatchImage(imageUri, fileName);
                setImageUrl(publicUrl);
                Toast.show({
                  type: 'success',
                  text1: 'Scan Complete',
                  text2: 'Timepiece scanned and uploaded successfully!',
                });
              } catch (error) {
                setImageUrl(imageUri);
                Toast.show({
                  type: 'info',
                  text1: 'Using Local Image',
                  text2:
                    'Could not upload to cloud, using local image instead.',
                });
              }
            } else {
              setImageUrl(imageUri);
              Toast.show({
                type: 'success',
                text1: 'Scan Complete',
                text2: 'Timepiece scanned and loaded successfully!',
              });
            }
          }
        });
      }
    });
  };

  const handleBrowseDeviceLibrary = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
    };

    launchImageLibrary(options, async response => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: response.errorMessage || 'Failed to open gallery.',
        });
      } else if (response.assets && response.assets.length > 0) {
        const imageUri = response.assets[0].uri;

        if (isConfigured) {
          try {
            Toast.show({
              type: 'info',
              text1: 'Uploading',
              text2: 'Uploading image to cloud storage...',
            });
            const fileName = `watch_${Date.now()}.jpg`;
            const publicUrl = await uploadWatchImage(imageUri, fileName);
            setImageUrl(publicUrl);
            setShowGallery(false);
            Toast.show({
              type: 'success',
              text1: 'Uploaded',
              text2: 'Image uploaded successfully!',
            });
          } catch (error) {
            setImageUrl(imageUri);
            setShowGallery(false);
            Toast.show({
              type: 'info',
              text1: 'Using Local Image',
              text2: 'Could not upload to cloud, using local image instead.',
            });
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
        text2: 'Please fill in Company Name and Model Number.',
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

      {/* HEADER MATCHING DASHBOARD */}
      <View style={[styles.headerRow, { alignItems: 'center', justifyContent: 'flex-start' }]}>
        {isEditMode && (
          <TouchableOpacity style={[styles.iconButton, { marginRight: 16 }]} onPress={() => goBack()}>
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
          {/* PHOTO UPLOAD SECTION */}
          <Animated.View style={[styles.uploadSection, getAnimStyle(1)]}>
            <View style={styles.dashedBox}>
              {isScanning ? (
                <View style={styles.scannerWrapper}>
                  <View style={styles.scanTargetBox}>
                    <Icon name="camera" size={32} color={THEME.textMuted} />
                    <Text style={styles.scanningText}>
                      Scanning timepiece...
                    </Text>
                  </View>
                </View>
              ) : (
                <>
                  <View style={styles.imagePreviewWrapper}>
                    {imageUrl ? (
                      <Image
                        source={{ uri: imageUrl }}
                        style={styles.previewImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <Icon
                        name="camera"
                        size={32}
                        color={THEME.textMuted}
                        style={styles.uploadIconBase}
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

            {/* GALLERY CHOOSER */}
            {showGallery && (
              <View style={styles.galleryChooser}>
                <Text style={styles.galleryHeading}>PREMIUM PRESETS</Text>
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
                    <Text
                      style={{
                        fontSize: 9,
                        color: THEME.surface,
                        fontWeight: '700',
                        marginTop: 4,
                      }}
                    >
                      DEVICE
                    </Text>
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

                <Text style={[styles.galleryHeading, { marginTop: 16 }]}>
                  CUSTOM IMAGE URL
                </Text>
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

          {/* FORM FIELDS */}
          <Animated.View style={getAnimStyle(2)}>
            <Text style={styles.label}>COMPANY NAME *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Rolex, Omega"
              placeholderTextColor={THEME.textMuted}
              value={brand}
              onChangeText={setBrand}
            />
          </Animated.View>

          <Animated.View style={getAnimStyle(3)}>
            <Text style={styles.label}>MODEL NUMBER *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Submariner 116610"
              placeholderTextColor={THEME.textMuted}
              value={name}
              onChangeText={setName}
            />
          </Animated.View>

          <Animated.View style={getAnimStyle(4)}>
            <Text style={styles.label}>PRICE (₹)</Text>
            <TextInput
              style={styles.input}
              placeholder="Optional (e.g. 8500.00)"
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

          {/* GENDER SEGMENTED CONTROL */}
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
                  activeOpacity={0.9}
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

          {/* STRAP DROPDOWN CHIPS */}
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

          {/* WATCH TYPE CHIPS */}
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

          {/* ACTIONS */}
          <Animated.View style={[styles.actionContainer, getAnimStyle(9)]}>
            <TouchableOpacity
              style={styles.saveButton}
              activeOpacity={0.8}
              onPress={handleSave}
            >
              <Icon
                name="check"
                size={20}
                color={THEME.surface}
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

// --- STYLES ALIGNED WITH DASHBOARD ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  heroText: {
    fontSize: 28, // Increased emphasis
    fontWeight: '400',
    color: THEME.textDark,
    alignSelf: 'flex-start',
    letterSpacing: -0.5,
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
    paddingBottom: 40,
  },
  heroSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  formContainer: {
    paddingHorizontal: 24,
  },
  uploadSection: {
    marginBottom: 24,
  },
  dashedBox: {
    borderRadius: 24,
    backgroundColor: THEME.surface,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  imagePreviewWrapper: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    backgroundColor: THEME.imageBg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 16,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  uploadActionsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  uploadButtonDark: {
    flex: 1,
    backgroundColor: THEME.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
  },
  uploadButtonTextDark: {
    color: THEME.surface,
    fontSize: 14,
    fontWeight: '600',
  },
  uploadButtonLight: {
    flex: 1,
    backgroundColor: THEME.imageBg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
  },
  uploadButtonTextLight: {
    color: THEME.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  btnIcon: {
    marginRight: 6,
  },
  scannerWrapper: {
    width: '100%',
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanTargetBox: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: THEME.primary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: THEME.imageBg,
    overflow: 'hidden',
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 3,
    backgroundColor: THEME.primary,
    zIndex: 100,
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  galleryHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.textMuted,
    letterSpacing: 1,
    marginBottom: 12,
  },
  galleryScroll: {
    gap: 12,
  },
  galleryThumbWrapper: {
    width: 64,
    height: 64,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: THEME.imageBg,
  },
  galleryThumbWrapperActive: {
    borderColor: THEME.primary,
  },
  galleryThumb: {
    width: '100%',
    height: '100%',
  },
  urlInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  urlInput: {
    flex: 1,
    backgroundColor: THEME.imageBg,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: THEME.textDark,
  },
  urlApplyBtn: {
    backgroundColor: THEME.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    color: THEME.textMuted,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 20,
  },
  input: {
    backgroundColor: THEME.surface,
    borderRadius: 16,
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
    borderRadius: 16,
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
    borderRadius: 12,
  },
  segmentButtonActive: {
    backgroundColor: THEME.primary,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.textMuted,
  },
  segmentTextActive: {
    color: THEME.surface,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
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
  chipButtonActive: {
    backgroundColor: THEME.primary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: THEME.textMuted,
  },
  chipTextActive: {
    color: THEME.surface,
    fontWeight: '600',
  },
  textArea: {
    height: 120,
    paddingTop: 16,
  },
  actionContainer: {
    marginTop: 40,
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: THEME.primary,
    flexDirection: 'row',
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  saveButtonText: {
    color: THEME.surface,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default AddWatchScreen;
