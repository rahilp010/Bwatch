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
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import { useApp } from '../context/AppContext';

const { width } = Dimensions.get('window');

const PRESET_IMAGES = [
  'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1547996160-81dfa63595aa?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1508656937213-bea3594fa3df?q=80&w=600&auto=format&fit=crop',
];

const CatalogueBuilderScreen = () => {
  const { params, watches, updateWatch, navigate, goBack } = useApp();

  // Find current watch to build catalogue for
  const watchId = params?.watchId || (watches.length > 0 ? watches[0].id : null);
  const watch = watches.find((w) => w.id === watchId);

  // Builder Settings Toggles
  const [showPrice, setShowPrice] = useState(true);
  const [showLogo, setShowLogo] = useState(true);
  const [showDesc, setShowDesc] = useState(true);

  // Editable Fields
  const [brand, setBrand] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [color, setColor] = useState('');
  const [strap, setStrap] = useState('');
  const [type, setType] = useState('');

  const [showGallery, setShowGallery] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Setup form fields on mount or when watch ID changes
  useEffect(() => {
    if (watch) {
      setBrand(watch.brand);
      setName(watch.name);
      setPrice(watch.price);
      setDescription(watch.description);
      setImageUrl(watch.image);
      setColor(watch.color || 'Silver Dial');
      setStrap(watch.strap || 'Metal');
      setType(watch.type || 'Analogue');
    }
  }, [watchId, watch]);

  // Animation values for cascading entrance
  const animValues = useRef(
    [...Array(7)].map(() => new Animated.Value(0)),
  ).current;

  useEffect(() => {
    const animations = animValues.map((anim) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    );
    Animated.stagger(80, animations).start();
  }, [watchId]);

  const getAnimStyle = (index) => ({
    opacity: animValues[index],
    transform: [
      {
        translateY: animValues[index].interpolate({
          inputRange: [0, 1],
          outputRange: [25, 0],
        }),
      },
    ],
  });

  if (watches.length === 0) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Icon name="book" size={48} color="#999" />
        <Text style={styles.errorText}>No watches in collection to build a catalogue.</Text>
        <TouchableOpacity style={styles.errorButton} onPress={() => navigate('AddWatch')}>
          <Text style={styles.errorButtonText}>Add a Watch First</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!watch) {
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

  // Handle saving the current edits back to storage and state
  const handleSaveEdits = async () => {
    await updateWatch(watch.id, {
      brand,
      name,
      price,
      description,
      image: imageUrl,
      color,
      strap,
      type,
    });
  };

  // Navigates to PDF Preview with the latest visual modifications
  const handlePrint = async () => {
    // Auto-save edits first
    await handleSaveEdits();

    navigate('PDFPreview', {
      watchId: watch.id,
      pdfConfig: {
        showPrice,
        showLogo,
        showDesc,
      },
    });
  };

  // Triggers a premium simulated download experience
  const handleDownload = async () => {
    // Auto-save edits first
    await handleSaveEdits();

    setIsDownloading(true);

    // Simulated download time
    setTimeout(() => {
      setIsDownloading(false);
      Toast.show({
        type: 'success',
        text1: 'Download Complete',
        text2: `PDF Catalogue for "${brand} ${name}" downloaded successfully!`,
      });
    }, 2000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9F9FB" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIcon} onPress={() => goBack()}>
          <Icon name="arrow-left" size={22} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerLeft}>
          <MaterialIcon name="book-open-outline" size={20} color="#000" />
          <Text style={styles.headerTitle}>Catalogue Builder</Text>
        </View>
        <TouchableOpacity style={styles.headerIcon} onPress={handleSaveEdits}>
          <Icon name="save" size={22} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* HERO EDIT TITLE */}
        <Animated.View style={getAnimStyle(0)}>
          <Text style={styles.sectionTitle}>Catalogue Details</Text>
        </Animated.View>

        {/* IMAGE PREVIEW AND EDIT */}
        <Animated.View style={[styles.imageEditCard, getAnimStyle(1)]}>
          <View style={styles.imageStage}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.watchImage} resizeMode="contain" />
            ) : (
              <Icon name="image" size={32} color="#AAA" />
            )}
          </View>
          <TouchableOpacity style={styles.editImageBtn} onPress={() => setShowGallery(!showGallery)}>
            <Icon name="edit-2" size={14} color="#FFF" style={{ marginRight: 6 }} />
            <Text style={styles.editImageBtnText}>Change Photo</Text>
          </TouchableOpacity>

          {showGallery && (
            <View style={styles.galleryChooser}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryScroll}>
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
            </View>
          )}
        </Animated.View>

        {/* EDIT FORM */}
        <Animated.View style={getAnimStyle(2)}>
          <Text style={styles.label}>BRAND NAME</Text>
          <TextInput style={styles.input} value={brand} onChangeText={setBrand} placeholder="Brand Name" />

          <Text style={styles.label}>MODEL NAME</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Model Name" />

          <Text style={styles.label}>PRICE ($)</Text>
          <TextInput
            style={styles.input}
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
            placeholder="Price"
          />
        </Animated.View>

        {/* SPECIFICATIONS EDIT */}
        <Animated.View style={getAnimStyle(3)}>
          <Text style={styles.label}>DIAL COLOR</Text>
          <TextInput style={styles.input} value={color} onChangeText={setColor} placeholder="Dial Color" />

          <View style={styles.row}>
            <View style={styles.halfCol}>
              <Text style={styles.label}>STRAP</Text>
              <TextInput style={styles.input} value={strap} onChangeText={setStrap} placeholder="Strap Type" />
            </View>
            <View style={styles.halfCol}>
              <Text style={styles.label}>WATCH TYPE</Text>
              <TextInput style={styles.input} value={type} onChangeText={setType} placeholder="Type" />
            </View>
          </View>
        </Animated.View>

        <Animated.View style={getAnimStyle(4)}>
          <Text style={styles.label}>DESCRIPTION</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
            placeholder="Description"
          />
        </Animated.View>

        {/* PDF EXPORT CONFIGURATION */}
        <Animated.View style={[styles.settingsCard, getAnimStyle(5)]}>
          <Text style={styles.settingsHeader}>PDF EXPORT CONFIGURATION</Text>

          <View style={styles.switchRow}>
            <Text style={styles.settingText}>Show Price Tag</Text>
            <Switch
              value={showPrice}
              onValueChange={setShowPrice}
              trackColor={{ true: '#000', false: '#CCC' }}
              thumbColor={showPrice ? '#FFF' : '#F4F3F4'}
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.settingText}>Include B-Watch Brand Logo</Text>
            <Switch
              value={showLogo}
              onValueChange={setShowLogo}
              trackColor={{ true: '#000', false: '#CCC' }}
              thumbColor={showLogo ? '#FFF' : '#F4F3F4'}
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.settingText}>Show Description Text</Text>
            <Switch
              value={showDesc}
              onValueChange={setShowDesc}
              trackColor={{ true: '#000', false: '#CCC' }}
              thumbColor={showDesc ? '#FFF' : '#F4F3F4'}
            />
          </View>
        </Animated.View>

        {/* BUTTON ACTIONS */}
        <Animated.View style={[styles.actionsWrapper, getAnimStyle(6)]}>
          <TouchableOpacity style={styles.btnPrimary} onPress={handlePrint} activeOpacity={0.8}>
            <Icon name="printer" color="#FFF" size={18} style={{ marginRight: 8 }} />
            <Text style={styles.btnTextPrimary}>Print (PDF Preview)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnSecondary}
            onPress={handleDownload}
            activeOpacity={0.8}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <>
                <Icon name="download" color="#000" size={18} style={{ marginRight: 8 }} />
                <Text style={styles.btnTextSecondary}>Download PDF</Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Space for global bottom nav */}
        <View style={{ height: 120 }} />
      </ScrollView>
      <Toast />
    </SafeAreaView>
  );
};

// --- STYLES ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9FB' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderColor: '#EEE',
    backgroundColor: '#F9F9FB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', marginLeft: 8 },
  headerIcon: {
    padding: 6,
  },
  scrollContent: { padding: 20, paddingBottom: 40 },
  sectionTitle: { fontSize: 24, fontWeight: '700', marginBottom: 20 },
  imageEditCard: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  imageStage: {
    width: '100%',
    height: 150,
    backgroundColor: '#F0F0F2',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  watchImage: {
    width: '90%',
    height: '90%',
  },
  editImageBtn: {
    backgroundColor: '#1C1C1C',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editImageBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  galleryChooser: {
    width: '100%',
    marginTop: 15,
    borderTopWidth: 1,
    borderColor: '#EEE',
    paddingTop: 12,
  },
  galleryScroll: {
    gap: 8,
  },
  galleryThumbWrapper: {
    width: 50,
    height: 50,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
    backgroundColor: '#F0F0F2',
  },
  galleryThumbWrapperActive: {
    borderColor: '#000',
  },
  galleryThumb: {
    width: '100%',
    height: '100%',
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: '#666',
    marginBottom: 6,
    marginTop: 14,
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#000',
  },
  row: { flexDirection: 'row', gap: 12 },
  halfCol: { flex: 1 },
  textArea: {
    height: 90,
    paddingTop: 12,
  },
  settingsCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEE',
    marginTop: 25,
    marginBottom: 20,
  },
  settingsHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#888',
    letterSpacing: 1,
    marginBottom: 10,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#F0F0F2',
  },
  settingText: { fontSize: 13, fontWeight: '600', color: '#333' },
  actionsWrapper: {
    marginTop: 10,
  },
  btnPrimary: {
    backgroundColor: '#000',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  btnTextPrimary: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  btnSecondary: {
    backgroundColor: '#FFF',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#000',
  },
  btnTextSecondary: { fontWeight: '700', fontSize: 14, color: '#000' },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9F9FB',
    padding: 20,
  },
  errorText: {
    fontSize: 15,
    color: '#555',
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 20,
    textAlign: 'center',
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

export default CatalogueBuilderScreen;
