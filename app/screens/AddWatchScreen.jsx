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

const { width } = Dimensions.get('window');

const PRESET_IMAGES = [
  'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?q=80&w=600&auto=format&fit=crop', // Rolex Silver
  'https://images.unsplash.com/photo-1547996160-81dfa63595aa?q=80&w=600&auto=format&fit=crop', // Submariner Black
  'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?q=80&w=600&auto=format&fit=crop', // Omega Gold
  'https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?q=80&w=600&auto=format&fit=crop', // Classic Metal
  'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?q=80&w=600&auto=format&fit=crop', // Sport Diver
  'https://images.unsplash.com/photo-1508656937213-bea3594fa3df?q=80&w=600&auto=format&fit=crop', // Retro Vintage
];

const STRAP_OPTIONS = ['Metal', 'Leather', 'Rubber', 'Fabric'];
const WATCH_TYPES = ['Analogue', 'Digital', 'Smartwatch'];

const AddWatchScreen = () => {
  const { addWatch, navigate, goBack } = useApp();

  // Form State
  const [brand, setBrand] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [color, setColor] = useState('');
  const [gender, setGender] = useState('Men');
  const [strap, setStrap] = useState('Metal');
  const [type, setType] = useState('Analogue');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState(PRESET_IMAGES[0]);

  // Image Selection Modal/Options State
  const [showGallery, setShowGallery] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  // Setup Animated Values for staggered entrance of form elements
  const animValues = useRef(
    [...Array(9)].map(() => new Animated.Value(0)),
  ).current;

  useEffect(() => {
    // Premium staggered slide-up and fade-in sequence
    const animations = animValues.map(anim =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    );

    Animated.stagger(80, animations).start();
  }, []);

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
    return true; // iOS permission is requested automatically by launchCamera
  };

  // Scanning animation trigger + native camera picker
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

        launchCamera(options, (response) => {
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
            setImageUrl(response.assets[0].uri);
            Toast.show({
              type: 'success',
              text1: 'Scan Complete',
              text2: 'Timepiece scanned and loaded successfully!',
            });
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

    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: response.errorMessage || 'Failed to open gallery.',
        });
      } else if (response.assets && response.assets.length > 0) {
        setImageUrl(response.assets[0].uri);
        setShowGallery(false);
      }
    });
  };

  // Helper function to apply animations to style array
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

  const handleSave = () => {
    if (!brand.trim() || !name.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please fill in Company Name and Model Number.',
      });
      return;
    }

    addWatch({
      brand,
      name,
      price: price || '0.00',
      color: color || 'Default Dial',
      gender,
      strap,
      type,
      description: description || 'No description provided.',
      image: imageUrl,
    });

    Toast.show({
      type: 'success',
      text1: 'Success',
      text2: 'Watch added to collection!',
    });
    navigate('Dashboard');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9F9FB" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => goBack()}>
          <Icon name="arrow-left" size={20} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <MaterialIcon name="watch-variant" size={20} color="#000" />
          <Text style={styles.headerTitle}>Add Watch</Text>
        </View>
        <TouchableOpacity style={styles.saveHeaderBtn} onPress={handleSave}>
          <Icon name="check" size={20} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* PHOTO UPLOAD SECTION */}
        <Animated.View style={[styles.uploadSection, getAnimStyle(0)]}>
          <View style={styles.dashedBox}>
            {isScanning ? (
              <View style={styles.scannerWrapper}>
                <View style={styles.scanTargetBox}>
                  <Animated.View 
                    style={[
                      styles.scanLine, 
                      { 
                        transform: [{ 
                          translateY: scanLineAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 160]
                          }) 
                        }] 
                      }
                    ]} 
                  />
                  <Icon name="camera" size={32} color="#AAA" />
                  <Text style={styles.scanningText}>Scanning timepiece...</Text>
                </View>
              </View>
            ) : (
              <>
                <View style={styles.imagePreviewWrapper}>
                  {imageUrl ? (
                    <Image source={{ uri: imageUrl }} style={styles.previewImage} resizeMode="cover" />
                  ) : (
                    <Icon name="camera" size={32} color="#B0B0B0" style={styles.uploadIconBase} />
                  )}
                </View>
                <Text style={styles.uploadTitle}>Add timepiece photography</Text>

                <View style={styles.uploadActionsRow}>
                  <TouchableOpacity
                    style={styles.uploadButtonDark}
                    activeOpacity={0.8}
                    onPress={() => setShowGallery(!showGallery)}
                  >
                    <Icon name="image" size={16} color="#FFF" style={styles.btnIcon} />
                    <Text style={styles.uploadButtonTextDark}>Choose Photo</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.uploadButtonLight}
                    activeOpacity={0.8}
                    onPress={runCameraScan}
                  >
                    <MaterialIcon name="camera-iris" size={18} color="#000" style={styles.btnIcon} />
                    <Text style={styles.uploadButtonTextLight}>Camera Scan</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>

          {/* GALLERY CHOOSER ACCORDION */}
          {showGallery && (
            <View style={styles.galleryChooser}>
              <Text style={styles.galleryHeading}>Select from Premium Watch Presets:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryScroll}>
                {/* Browse Device Gallery Option */}
                <TouchableOpacity 
                  style={[
                    styles.galleryThumbWrapper, 
                    { 
                      backgroundColor: '#1C1C1C', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: '#444'
                    }
                  ]}
                  onPress={handleBrowseDeviceLibrary}
                >
                  <Icon name="folder" size={16} color="#FFF" />
                  <Text style={{ fontSize: 8, color: '#FFF', fontWeight: 'bold', marginTop: 2 }}>Device</Text>
                </TouchableOpacity>

                {PRESET_IMAGES.map((img, idx) => (
                  <TouchableOpacity 
                    key={idx} 
                    style={[styles.galleryThumbWrapper, imageUrl === img && styles.galleryThumbWrapperActive]}
                    onPress={() => {
                      setImageUrl(img);
                      setShowGallery(false);
                    }}
                  >
                    <Image source={{ uri: img }} style={styles.galleryThumb} />
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.galleryHeading}>Or Paste Custom Image URL:</Text>
              <View style={styles.urlInputRow}>
                <TextInput
                  style={styles.urlInput}
                  placeholder="https://example.com/watch.png"
                  placeholderTextColor="#999"
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
                  <Text style={styles.urlApplyText}>Apply</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Animated.View>

        {/* FORM FIELDS */}
        <Animated.View style={getAnimStyle(1)}>
          <Text style={styles.label}>COMPANY NAME *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Rolex, Omega, Patek Philippe"
            placeholderTextColor="#999"
            value={brand}
            onChangeText={setBrand}
          />
        </Animated.View>

        <Animated.View style={getAnimStyle(2)}>
          <Text style={styles.label}>MODEL NUMBER *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Submariner 116610"
            placeholderTextColor="#999"
            value={name}
            onChangeText={setName}
          />
        </Animated.View>

        <Animated.View style={getAnimStyle(3)}>
          <Text style={styles.label}>PRICE ($)</Text>
          <TextInput
            style={styles.input}
            placeholder="Optional (e.g. 8500.00)"
            placeholderTextColor="#999"
            keyboardType="numeric"
            value={price}
            onChangeText={setPrice}
          />
        </Animated.View>

        <Animated.View style={getAnimStyle(4)}>
          <Text style={styles.label}>COLOR DIAL</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Deep Blue"
            placeholderTextColor="#999"
            value={color}
            onChangeText={setColor}
          />
        </Animated.View>

        {/* GENDER SEGMENTED CONTROL */}
        <Animated.View style={getAnimStyle(5)}>
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
        <Animated.View style={getAnimStyle(6)}>
          <Text style={styles.label}>STRAP TYPE</Text>
          <View style={styles.chipsRow}>
            {STRAP_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt}
                style={[styles.chipButton, strap === opt && styles.chipButtonActive]}
                onPress={() => setStrap(opt)}
              >
                <Text style={[styles.chipText, strap === opt && styles.chipTextActive]}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* WATCH TYPE CHIPS */}
        <Animated.View style={getAnimStyle(7)}>
          <Text style={styles.label}>WATCH TYPE</Text>
          <View style={styles.chipsRow}>
            {WATCH_TYPES.map(opt => (
              <TouchableOpacity
                key={opt}
                style={[styles.chipButton, type === opt && styles.chipButtonActive]}
                onPress={() => setType(opt)}
              >
                <Text style={[styles.chipText, type === opt && styles.chipTextActive]}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        <Animated.View style={getAnimStyle(8)}>
          <Text style={styles.label}>DESCRIPTION</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Detailed specifications, history, or condition..."
            placeholderTextColor="#999"
            multiline
            textAlignVertical="top"
            value={description}
            onChangeText={setDescription}
          />
        </Animated.View>

        {/* ACTIONS */}
        <Animated.View style={[styles.actionContainer, getAnimStyle(8)]}>
          <TouchableOpacity style={styles.saveButton} activeOpacity={0.8} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Watch</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} activeOpacity={0.6} onPress={() => navigate('Dashboard')}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Space for global bottom nav */}
        <View style={{ height: 100 }} />
      </ScrollView>
      <Toast />
    </SafeAreaView>
  );
};

// --- STYLES ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9FB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    backgroundColor: '#F9F9FB',
  },
  backButton: {
    padding: 6,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginLeft: 6,
    letterSpacing: -0.2,
  },
  saveHeaderBtn: {
    padding: 6,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  uploadSection: {
    marginBottom: 24,
  },
  dashedBox: {
    borderWidth: 1.5,
    borderColor: '#D0D0D0',
    borderStyle: 'dashed',
    borderRadius: 12,
    backgroundColor: '#F0F0F2',
    padding: 20,
    alignItems: 'center',
    overflow: 'hidden',
  },
  imagePreviewWrapper: {
    width: '100%',
    height: 160,
    borderRadius: 8,
    backgroundColor: '#EAEAEA',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 10,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  uploadIconBase: {
    marginBottom: 12,
  },
  uploadTitle: {
    fontSize: 14,
    color: '#555',
    marginBottom: 16,
    fontWeight: '500',
  },
  uploadActionsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  uploadButtonDark: {
    flex: 1,
    backgroundColor: '#000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  uploadButtonTextDark: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  uploadButtonLight: {
    flex: 1,
    backgroundColor: '#E5E5E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D0D0D0',
  },
  uploadButtonTextLight: {
    color: '#000',
    fontSize: 13,
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
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: '#EAEAEA',
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 3,
    backgroundColor: 'red',
    zIndex: 100,
  },
  scanningText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
    marginTop: 10,
  },
  galleryChooser: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    padding: 16,
    marginTop: 12,
  },
  galleryHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: '#666',
    letterSpacing: 0.5,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  galleryScroll: {
    gap: 10,
    paddingBottom: 15,
  },
  galleryThumbWrapper: {
    width: 60,
    height: 60,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: '#F0F0F2',
  },
  galleryThumbWrapperActive: {
    borderColor: '#000',
  },
  galleryThumb: {
    width: '100%',
    height: '100%',
  },
  urlInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 5,
  },
  urlInput: {
    flex: 1,
    backgroundColor: '#F0F0F2',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#000',
  },
  urlApplyBtn: {
    backgroundColor: '#000',
    borderRadius: 6,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  urlApplyText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  label: {
    fontSize: 11,
    color: '#666',
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#000',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F2',
    borderRadius: 8,
    padding: 4,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  segmentButtonActive: {
    backgroundColor: '#1C1C1C',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  segmentTextActive: {
    color: '#FFF',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F0F0F2',
  },
  chipButtonActive: {
    backgroundColor: '#000',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  chipTextActive: {
    color: '#FFF',
  },
  textArea: {
    height: 90,
    paddingTop: 12,
  },
  actionContainer: {
    marginTop: 32,
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: '#000',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default AddWatchScreen;
