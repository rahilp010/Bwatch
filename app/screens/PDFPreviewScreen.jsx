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
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Share from 'react-native-share';
import { captureRef } from 'react-native-view-shot';
import { PDFDocument } from 'pdf-lib';
import RNFS from 'react-native-fs';
import Toast from 'react-native-toast-message';
import { useApp } from '../context/AppContext';

const { width } = Dimensions.get('window');
const PAGE_WIDTH = width - 40;
// Standard A4 aspect ratio (1 : 1.414) for accurate print layout simulation
const PAGE_HEIGHT = PAGE_WIDTH * 1.414;

const PDFPreviewScreen = () => {
  const { params, watches, goBack } = useApp();
  
  // Refs for capturing PDF pages
  const coverPageRef = useRef(null);
  const contentPageRef = useRef(null);

  // Load target watch and config params
  const watchId = params?.watchId;
  const watch = watches.find(w => w.id === watchId) || (watches.length > 0 ? watches[0] : null);
  const pdfConfig = params?.pdfConfig || { showPrice: true, showLogo: true, showDesc: true };

  const [isSharing, setIsSharing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Staggered animation setup for the PDF pages
  const animValues = useRef(
    [...Array(3)].map(() => new Animated.Value(0)),
  ).current;

  useEffect(() => {
    const animations = animValues.map(anim =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    );
    Animated.stagger(150, animations).start();
  }, [watchId]);

  const getAnimStyle = index => ({
    opacity: animValues[index],
    transform: [
      {
        translateY: animValues[index].interpolate({
          inputRange: [0, 1],
          outputRange: [40, 0],
        }),
      },
    ],
  });

  if (!watch) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Icon name="alert-triangle" size={48} color="#FF9800" />
        <Text style={styles.errorText}>No timepiece is selected for PDF generation.</Text>
        <TouchableOpacity style={styles.errorButton} onPress={() => goBack()}>
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Action: Share PDF (shares Cover and Content pages as JPEGs/PNGs)
  const handleShare = async () => {
    setIsSharing(true);
    try {
      // Capture Cover Page and Content Page as images
      const coverUri = await captureRef(coverPageRef, {
        format: 'jpeg',
        quality: 0.85,
      });
      const contentUri = await captureRef(contentPageRef, {
        format: 'jpeg',
        quality: 0.85,
      });

      await Share.open({
        urls: [coverUri, contentUri],
        type: 'image/jpeg',
        title: 'Share Watch Catalogue',
      });
    } catch (error) {
      console.log('Error sharing: ', error);
      Toast.show({
        type: 'error',
        text1: 'Share Error',
        text2: 'An error occurred while trying to share the catalogue.',
      });
    } finally {
      setIsSharing(false);
    }
  };

  // Action: Download PDF (creates a real PDF document from screenshots and saves it)
  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      // Capture both pages as base64 png
      const coverBase64 = await captureRef(coverPageRef, {
        format: 'png',
        result: 'base64',
      });
      const contentBase64 = await captureRef(contentPageRef, {
        format: 'png',
        result: 'base64',
      });

      // Create PDF using pdf-lib
      const pdfDoc = await PDFDocument.create();

      // Embed images
      const coverImg = await pdfDoc.embedPng(coverBase64);
      const contentImg = await pdfDoc.embedPng(contentBase64);

      // Page 1
      const page1 = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      page1.drawImage(coverImg, {
        x: 0,
        y: 0,
        width: PAGE_WIDTH,
        height: PAGE_HEIGHT,
      });

      // Page 2
      const page2 = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      page2.drawImage(contentImg, {
        x: 0,
        y: 0,
        width: PAGE_WIDTH,
        height: PAGE_HEIGHT,
      });

      // Save PDF as bytes
      const pdfBytes = await pdfDoc.save();

      // Convert to base64 for file writing
      const pdfBase64 = Array.from(pdfBytes)
        .map(b => String.fromCharCode(b))
        .join('');
      const pdfDataUri = `data:application/pdf;base64,${btoa(pdfBase64)}`;

      // Determine download directory based on platform
      const downloadDir = Platform.OS === 'android' 
        ? RNFS.DownloadDirectoryPath 
        : RNFS.DocumentDirectoryPath;
      
      const safeBrand = watch.brand.replace(/[^a-zA-Z0-9]/g, '_');
      const safeName = watch.name.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `${safeBrand}_${safeName}_Catalogue.pdf`;
      const filePath = `${downloadDir}/${fileName}`;

      // Write file to device
      await RNFS.writeFile(filePath, pdfDataUri.split(',')[1], 'base64');

      Toast.show({
        type: 'success',
        text1: 'PDF Saved',
        text2: `Catalogue PDF saved to ${fileName}`,
      });
    } catch (error) {
      console.log('Error generating PDF: ', error);
      Toast.show({
        type: 'error',
        text1: 'PDF Error',
        text2: 'An error occurred while generating the PDF document.',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9F9FB" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => goBack()}>
          <Icon name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PDF Preview</Text>
        <TouchableOpacity style={styles.iconButton} onPress={handleShare}>
          <Icon name="share-2" size={20} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* PAGE 1: COVER PAGE */}
        <Animated.View style={[styles.pdfPage, getAnimStyle(0)]}>
          <View ref={coverPageRef} collapsable={false} style={{ flex: 1, backgroundColor: '#FFFFFF', padding: 24, paddingVertical: 32 }}>
            {/* Faint watermark graphic */}
            <View style={styles.graphicOverlay}>
              <View style={styles.graphicStrapTop} />
              <View style={styles.graphicFace} />
              <View style={styles.graphicStrapBottom} />
            </View>

            <View style={styles.coverTopContent}>
              {pdfConfig.showLogo && (
                <View style={styles.brandRow}>
                  <Icon name="watch" size={16} color="#000" />
                  <Text style={styles.brandText}>B-WATCH</Text>
                </View>
              )}
              
              <Text style={styles.coverTitle}>{watch.brand.toUpperCase()}</Text>
              <Text style={styles.coverSubTitle}>{watch.name.toUpperCase()}</Text>
              <View style={styles.titleUnderline} />
              <Text style={styles.coverDate}>OFFICIAL CATALOGUE</Text>
            </View>

            <View style={styles.coverFooter}>
              <View style={styles.footerDivider} />
              <View style={styles.footerRow}>
                <View>
                  <Text style={styles.footerTextPrimary}>
                    Dealer Verification Copy
                  </Text>
                  <Text style={styles.footerTextSecondary}>Ref: BW-{watch.id}-CAT</Text>
                </View>
                <Text style={styles.pageNumber}>01</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* PAGE 2: CONTENT PAGE */}
        <Animated.View style={[styles.pdfPage, getAnimStyle(1)]}>
          <View ref={contentPageRef} collapsable={false} style={{ flex: 1, backgroundColor: '#FFFFFF', padding: 24 }}>
            {pdfConfig.showLogo && (
              <View style={styles.contentPageHeader}>
                <Text style={styles.pageHeaderLogo}>B-WATCH CATALOGUE</Text>
                <Text style={styles.pageHeaderRef}>Ref: BW-{watch.id}</Text>
              </View>
            )}

            <View style={styles.imageStage}>
              <Image
                source={{ uri: watch.image }}
                style={styles.watchImage}
                resizeMode="contain"
              />
            </View>

            <View style={styles.itemDetails}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>TIMEPIECE SPECIFICATIONS</Text>
              </View>
              
              <Text style={styles.itemTitle}>{watch.brand} {watch.name}</Text>
              
              {/* Dynamic Price Display */}
              {pdfConfig.showPrice && (
                <Text style={styles.itemPrice}>
                  {watch.price ? `$${parseFloat(watch.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : 'N/A'}
                </Text>
              )}

              {/* Spec Table */}
              <View style={styles.specTable}>
                <View style={styles.specTableRow}>
                  <Text style={styles.specTableLabel}>GENDER</Text>
                  <Text style={styles.specTableValue}>{watch.gender || 'Men'}</Text>
                </View>
                <View style={styles.specTableRow}>
                  <Text style={styles.specTableLabel}>STRAP TYPE</Text>
                  <Text style={styles.specTableValue}>{watch.strap || 'Metal'}</Text>
                </View>
                <View style={styles.specTableRow}>
                  <Text style={styles.specTableLabel}>WATCH TYPE</Text>
                  <Text style={styles.specTableValue}>{watch.type || 'Analogue'}</Text>
                </View>
                <View style={styles.specTableRow}>
                  <Text style={styles.specTableLabel}>DIAL COLOR</Text>
                  <Text style={styles.specTableValue}>{watch.color || 'Silver'}</Text>
                </View>
              </View>

              {/* Dynamic Description Display */}
              {pdfConfig.showDesc && (
                <Text style={styles.itemDescription}>
                  {watch.description}
                </Text>
              )}
              
              <View style={styles.contentPageFooter}>
                <View style={styles.footerDivider} />
                <View style={styles.footerRow}>
                  <Text style={styles.footerTextSecondary}>© 2026 B-Watch International Ltd.</Text>
                  <Text style={styles.pageNumber}>02</Text>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* END MARKER */}
        <Animated.View style={[styles.endMarkerContainer, getAnimStyle(2)]}>
          <Text style={styles.endMarkerText}>END OF DOCUMENT</Text>
        </Animated.View>

        {/* Space for absolute bottom actions and global bottom dock */}
        <View style={{ height: 160 }} />
      </ScrollView>

      {/* BOTTOM ACTION BAR */}
      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={styles.secondaryButton} 
          activeOpacity={0.7} 
          onPress={handleShare}
          disabled={isSharing}
        >
          {isSharing ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <>
              <Icon name="share" size={18} color="#000" style={styles.btnIcon} />
              <Text style={styles.secondaryButtonText}>SHARE</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.primaryButton} 
          activeOpacity={0.8} 
          onPress={handleDownload}
          disabled={isDownloading}
        >
          {isDownloading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Icon name="download" size={18} color="#FFF" style={styles.btnIcon} />
              <Text style={styles.primaryButtonText}>DOWNLOAD</Text>
            </>
          )}
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
    backgroundColor: '#F9F9FB', // Light off-white base
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    backgroundColor: '#F9F9FB',
  },
  iconButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    letterSpacing: -0.2,
  },
  scrollContent: {
    padding: 20,
    alignItems: 'center',
  },
  pdfPage: {
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  // -- Abstract Cover Graphic --
  graphicOverlay: {
    position: 'absolute',
    top: -20,
    right: 40,
    alignItems: 'center',
    opacity: 0.03,
    zIndex: 0,
  },
  graphicStrapTop: { width: 40, height: 60, backgroundColor: '#000' },
  graphicFace: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#000',
    borderWidth: 15,
    borderColor: '#FFF',
  },
  graphicStrapBottom: { width: 40, height: 60, backgroundColor: '#000' },

  // -- Cover Page Content --
  coverTopContent: {
    padding: 32,
    paddingTop: 60,
    zIndex: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  brandText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#666',
    letterSpacing: 2,
    marginLeft: 6,
  },
  coverTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#000',
    letterSpacing: -0.5,
  },
  coverSubTitle: {
    fontSize: 18,
    fontWeight: '300',
    color: '#444',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  titleUnderline: {
    width: 45,
    height: 3,
    backgroundColor: '#000',
    marginTop: 15,
    marginBottom: 25,
  },
  coverDate: {
    fontSize: 10,
    fontWeight: '700',
    color: '#888',
    letterSpacing: 1.5,
  },
  coverFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 32,
  },
  footerDivider: {
    height: 1,
    backgroundColor: '#EAEAEA',
    marginBottom: 16,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  footerTextPrimary: {
    fontSize: 11,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  footerTextSecondary: {
    fontSize: 9,
    color: '#888',
  },
  pageNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
  },
  // -- Content Page Details --
  contentPageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 20,
    borderBottomWidth: 1,
    borderColor: '#F0F0F2',
    paddingBottom: 8,
  },
  pageHeaderLogo: {
    fontSize: 9,
    fontWeight: '700',
    color: '#666',
    letterSpacing: 1,
  },
  pageHeaderRef: {
    fontSize: 9,
    color: '#999',
  },
  imageStage: {
    marginHorizontal: 24,
    marginVertical: 16,
    height: 160,
    backgroundColor: '#F7F7F9',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  watchImage: {
    width: '85%',
    height: '85%',
  },
  itemDetails: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  badge: {
    backgroundColor: '#F0F0F2',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#555',
    letterSpacing: 0.5,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    letterSpacing: -0.5,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#444',
    marginTop: 4,
    marginBottom: 8,
  },
  specTable: {
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderRadius: 6,
    overflow: 'hidden',
  },
  specTableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F7F7F9',
  },
  specTableLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#888',
    letterSpacing: 0.5,
  },
  specTableValue: {
    fontSize: 9,
    fontWeight: '600',
    color: '#000',
  },
  itemDescription: {
    fontSize: 11,
    color: '#555',
    lineHeight: 16,
  },
  contentPageFooter: {
    marginTop: 20,
    paddingTop: 16,
    left: 0,
    right: 0,
  },
  // -- End Marker --
  endMarkerContainer: {
    paddingVertical: 20,
  },
  endMarkerText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B0B0B0',
    letterSpacing: 1.5,
  },
  // -- Bottom Action Bar --
  bottomBar: {
    position: 'absolute',
    bottom: 95, // Float above the global bottom nav
    left: 20,
    right: 20,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 10,
  },
  btnIcon: {
    marginRight: 6,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 12,
    paddingVertical: 14,
    marginRight: 10,
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000',
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    borderRadius: 12,
    paddingVertical: 14,
  },
  primaryButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
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

export default PDFPreviewScreen;
