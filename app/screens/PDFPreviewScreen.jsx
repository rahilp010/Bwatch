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
const PAGE_WIDTH = width - 48;
const PAGE_HEIGHT = PAGE_WIDTH * 1.414;

// --- THEME CONSTANTS ---
const THEME = {
  background: '#FAFAFA',
  surface: '#FFFFFF',
  primary: '#000000ff',
  textDark: '#232F2C',
  textMuted: '#7E918C',
  imageBg: '#E0EAE8',
};

// Helper to chunk array for grid
const chunkArray = (arr, size) => {
  return arr.reduce(
    (acc, _, i) => (i % size ? acc : [...acc, arr.slice(i, i + size)]),
    [],
  );
};

// Cover Page Component for individual watch
const WatchCoverPage = ({ watch, style, pdfConfig }) => {
  return (
    <View style={[styles.heroPageContainer, style.borderStyle]}>
      <Text
        style={[
          styles.heroMainTitle,
          { fontFamily: style.text.fontFamily },
        ]}
      >
        {watch.name || 'Watch Name Here'}
      </Text>

      <View style={styles.heroImageWrapper}>
        <Image
          source={{ uri: watch.image }}
          style={styles.heroImage}
          resizeMode="contain"
        />
      </View>

      {/* Bottom Right Description Box */}
      <View style={styles.heroDescBox}>
        <Text style={styles.heroDescTitle}>DESCRIPTION</Text>

        <View style={styles.heroSpecRow}>
          <Text style={styles.heroSpecLabel}>Brand</Text>
          <Text style={styles.heroSpecValue}>
            {watch.brand || 'N/A'}
          </Text>
        </View>
        <View style={styles.heroSpecRow}>
          <Text style={styles.heroSpecLabel}>Gender</Text>
          <Text style={styles.heroSpecValue}>
            {watch.gender || 'Unisex'}
          </Text>
        </View>
        <View style={styles.heroSpecRow}>
          <Text style={styles.heroSpecLabel}>Type</Text>
          <Text style={styles.heroSpecValue}>
            {watch.type || 'Analogue'}
          </Text>
        </View>
        <View style={styles.heroSpecRow}>
          <Text style={styles.heroSpecLabel}>Dial Color</Text>
          <Text style={styles.heroSpecValue}>
            {watch.color || 'Standard'}
          </Text>
        </View>
        <View style={styles.heroSpecRow}>
          <Text style={styles.heroSpecLabel}>Strap</Text>
          <Text style={styles.heroSpecValue}>
            {watch.strap || 'Leather/Metal'}
          </Text>
        </View>
        {watch.price && (
          <View style={styles.heroSpecRow}>
            <Text style={styles.heroSpecLabel}>Price</Text>
            <Text style={styles.heroSpecValue}>₹{watch.price}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const PDFPreviewScreen = () => {
  const { params, watches, goBack } = useApp();

  const coverPageRef = useRef(null);
  const contentPageRefs = useRef([]);
  // For separate mode, we need refs for each watch's cover page
  const individualCoverRefs = useRef([]);

  const watchId = params?.watchId;
  const selectedWatchIds = useMemo(
    () => params?.selectedWatchIds || [],
    [params?.selectedWatchIds],
  );
  const pdfMode = params?.pdfMode || 'single';
  const watch =
    watches.find(w => w.id === watchId) ||
    (watches.length > 0 ? watches[0] : null);

  const pdfConfig = params?.pdfConfig || {
    showPrice: true,
    showLogo: true,
    showDesc: true,
    template: 'minimal',
    accentColor: '#121212',
    customBgColor: '#FFFFFF',
    fontFamily: 'sans-serif',
    borderType: 'none',
    coverTitle: 'B-WATCH',
    coverSubtitle: 'OFFICIAL CATALOGUE',
    watermarkText: 'B-WATCH',
  };

  const targetWatches =
    selectedWatchIds.length > 0
      ? watches.filter(w => selectedWatchIds.includes(w.id))
      : watch
      ? [watch]
      : [];

  // Split into chunks of 9 (3 rows x 3 columns)
  const watchChunks = chunkArray(targetWatches, 9);

  if (contentPageRefs.current.length !== watchChunks.length) {
    contentPageRefs.current = Array(watchChunks.length)
      .fill(null)
      .map((_, i) => contentPageRefs.current[i] || React.createRef());
  }

  // Initialize individual cover refs for separate mode
  if (pdfMode === 'separate' && individualCoverRefs.current.length !== targetWatches.length) {
    individualCoverRefs.current = Array(targetWatches.length)
      .fill(null)
      .map((_, i) => individualCoverRefs.current[i] || React.createRef());
  }

  const [isSharing, setIsSharing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [currentDownloadIndex, setCurrentDownloadIndex] = useState(0);
  const [totalDownloads, setTotalDownloads] = useState(0);

  const animValues = useRef(
    [...Array(4)].map(() => new Animated.Value(0)),
  ).current;

  useEffect(() => {
    const animations = animValues.map(anim =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    );
    Animated.stagger(150, animations).start();
  }, [watchId, selectedWatchIds, animValues]);

  const getAnimStyle = index => ({
    opacity: animValues[index] || animValues[0],
    transform: [
      {
        translateY: (animValues[index] || animValues[0]).interpolate({
          inputRange: [0, 1],
          outputRange: [30, 0],
        }),
      },
    ],
  });

  const getDynamicStyle = () => {
    const accent = pdfConfig.accentColor || '#121212';
    const bg = pdfConfig.customBgColor || '#FFFFFF';
    const isDarkBg = ['#1A1A1A', '#0A1118'].includes(bg);
    const selectedFont =
      pdfConfig.fontFamily === 'serif'
        ? Platform.OS === 'ios'
          ? 'Georgia'
          : 'serif'
        : pdfConfig.fontFamily === 'monospace'
        ? Platform.OS === 'ios'
          ? 'Courier'
          : 'monospace'
        : 'System';

    const textStyle = {
      fontFamily: selectedFont,
      color: isDarkBg ? '#FFFFFF' : '#000000',
    };

    let borderStyle = {};
    if (pdfConfig.borderType === 'single')
      borderStyle = { borderWidth: 2, borderColor: accent };
    else if (pdfConfig.borderType === 'dotted')
      borderStyle = {
        borderWidth: 2,
        borderColor: accent,
        borderStyle: 'dotted',
      };

    return {
      page: { backgroundColor: bg, ...borderStyle },
      text: textStyle,
      accentText: { ...textStyle, color: accent },
      mutedText: { ...textStyle, color: isDarkBg ? '#999999' : '#666666' },
      borderStyle,
      isDarkBg,
      accent,
    };
  };

  if (targetWatches.length === 0) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Icon name="alert-triangle" size={48} color={THEME.textMuted} />
        <Text style={styles.errorText}>No timepiece selected.</Text>
        <TouchableOpacity style={styles.errorButton} onPress={() => goBack()}>
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const coverUri = await captureRef(coverPageRef, {
        format: 'jpeg',
        quality: 0.85,
      });
      const contentUris = [];
      for (let i = 0; i < watchChunks.length; i++) {
        if (contentPageRefs.current[i]) {
          const uri = await captureRef(contentPageRefs.current[i], {
            format: 'jpeg',
            quality: 0.85,
          });
          contentUris.push(uri);
        }
      }
      await Share.open({
        urls: [coverUri, ...contentUris],
        type: 'image/jpeg',
        title: 'Share Catalogue',
      });
    } catch (error) {
      if (error && error.message && error.message.includes('User did not share')) {
        return;
      }
      Toast.show({
        type: 'error',
        text1: 'Share Error',
        text2: 'Failed to share catalogue.',
      });
    } finally {
      setIsSharing(false);
    }
  };

  // Generate single PDF (all watches combined)
  const generateSinglePDF = async () => {
    const coverBase64 = await captureRef(coverPageRef, {
      format: 'png',
      result: 'base64',
    });
    const contentBase64s = [];
    for (let i = 0; i < watchChunks.length; i++) {
      if (contentPageRefs.current[i]) {
        const base64 = await captureRef(contentPageRefs.current[i], {
          format: 'png',
          result: 'base64',
        });
        contentBase64s.push(base64);
      }
    }

    const pdfDoc = await PDFDocument.create();
    const coverImg = await pdfDoc.embedPng(coverBase64);
    const page1 = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    page1.drawImage(coverImg, {
      x: 0,
      y: 0,
      width: PAGE_WIDTH,
      height: PAGE_HEIGHT,
    });

    for (const base64 of contentBase64s) {
      const img = await pdfDoc.embedPng(base64);
      const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      page.drawImage(img, {
        x: 0,
        y: 0,
        width: PAGE_WIDTH,
        height: PAGE_HEIGHT,
      });
    }

    const pdfBase64 = await pdfDoc.saveAsBase64();
    const fileName = `Catalogue_${new Date().getTime()}.pdf`;
    const filePath = `${RNFS.CachesDirectoryPath}/${fileName}`;

    await RNFS.writeFile(filePath, pdfBase64, 'base64');
    return filePath;
  };

  // Generate separate PDF for each watch with watch-specific cover
  const generateSeparatePDFs = async () => {
    const filePaths = [];

    for (let watchIndex = 0; watchIndex < targetWatches.length; watchIndex++) {
      setCurrentDownloadIndex(watchIndex + 1);

      const currentWatch = targetWatches[watchIndex];

      // Capture watch-specific cover page
      let coverBase64;
      if (individualCoverRefs.current[watchIndex]) {
        coverBase64 = await captureRef(individualCoverRefs.current[watchIndex], {
          format: 'png',
          result: 'base64',
        });
      } else {
        // Fallback to shared cover if individual ref not available
        coverBase64 = await captureRef(coverPageRef, {
          format: 'png',
          result: 'base64',
        });
      }

      const pdfDoc = await PDFDocument.create();
      const coverImg = await pdfDoc.embedPng(coverBase64);
      const page1 = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      page1.drawImage(coverImg, {
        x: 0,
        y: 0,
        width: PAGE_WIDTH,
        height: PAGE_HEIGHT,
      });

      // Find which chunk this watch belongs to and capture that page
      for (let chunkIndex = 0; chunkIndex < watchChunks.length; chunkIndex++) {
        const chunk = watchChunks[chunkIndex];
        const watchInChunk = chunk.find(w => w.id === currentWatch.id);

        if (watchInChunk && contentPageRefs.current[chunkIndex]) {
          const contentBase64 = await captureRef(contentPageRefs.current[chunkIndex], {
            format: 'png',
            result: 'base64',
          });
          const contentImg = await pdfDoc.embedPng(contentBase64);
          const contentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
          contentPage.drawImage(contentImg, {
            x: 0,
            y: 0,
            width: PAGE_WIDTH,
            height: PAGE_HEIGHT,
          });
          break;
        }
      }

      const pdfBase64 = await pdfDoc.saveAsBase64();
      const safeName = `${currentWatch.brand || 'Watch'}_${currentWatch.name || 'Model'}`.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `${safeName}_${new Date().getTime()}.pdf`;
      const filePath = `${RNFS.CachesDirectoryPath}/${fileName}`;

      await RNFS.writeFile(filePath, pdfBase64, 'base64');
      filePaths.push(filePath);
    }

    return filePaths;
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      let filePaths = [];

      if (pdfMode === 'separate' && targetWatches.length > 1) {
        setTotalDownloads(targetWatches.length);
        filePaths = await generateSeparatePDFs();

        // Share all PDFs
        await Share.open({
          urls: filePaths.map(fp => Platform.OS === 'android' ? `file://${fp}` : fp),
          type: 'application/pdf',
          saveToFiles: true,
          title: 'Save PDF Catalogues',
        });
      } else {
        setTotalDownloads(1);
        setCurrentDownloadIndex(1);
        const filePath = await generateSinglePDF();
        filePaths = [filePath];

        await Share.open({
          url: Platform.OS === 'android' ? `file://${filePath}` : filePath,
          type: 'application/pdf',
          saveToFiles: true,
          title: 'Save PDF Catalogue',
        });
      }

      Toast.show({
        type: 'success',
        text1: 'Saved',
        text2: pdfMode === 'separate' && targetWatches.length > 1
          ? `${filePaths.length} PDFs saved successfully!`
          : 'Catalogue saved successfully!',
      });
    } catch (error) {
      if (error && error.message && error.message.includes('User did not share')) {
        return;
      }
      Toast.show({
        type: 'error',
        text1: 'PDF Error',
        text2: 'Failed to save PDF.',
      });
    } finally {
      setIsDownloading(false);
      setCurrentDownloadIndex(0);
      setTotalDownloads(0);
    }
  };

  const heroWatch = targetWatches[0];
  const style = getDynamicStyle();

  // Render individual cover pages for separate mode (hidden, used for capture)
  const renderIndividualCoverPages = () => {
    if (pdfMode !== 'separate' || targetWatches.length <= 1) return null;
    
    return (
      <View style={{ position: 'absolute', left: -9999, top: 0 }}>
        {targetWatches.map((w, index) => (
          <View
            key={w.id}
            ref={el => {
              individualCoverRefs.current[index] = el;
            }}
            collapsable={false}
            style={{
              width: PAGE_WIDTH,
              height: PAGE_HEIGHT,
              opacity: 0.99,
            }}
          >
            <WatchCoverPage watch={w} style={style} pdfConfig={pdfConfig} />
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.background} />

      {/* HEADER */}
      <View style={styles.headerRow}>
        <Text style={styles.heroText}>Catalogue Preview</Text>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleShare}
          disabled={isSharing}
        >
          {isSharing ? (
            <ActivityIndicator size="small" color={THEME.textDark} />
          ) : (
            <Icon name="share-2" size={20} color={THEME.textDark} />
          )}
        </TouchableOpacity>
      </View>

      {/* PDF Mode Indicator */}
      {pdfMode === 'separate' && targetWatches.length > 1 && (
        <View style={styles.modeIndicator}>
          <Icon name="copy" size={16} color={THEME.primary} />
          <Text style={styles.modeIndicatorText}>
            Separate PDFs Mode ({targetWatches.length} PDFs will be generated)
          </Text>
        </View>
      )}

      {/* Hidden individual cover pages for separate mode capture */}
      {renderIndividualCoverPages()}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* PAGE 1: HERO COVER */}
        <Animated.View style={[styles.pdfPage, getAnimStyle(1)]}>
          <View
            ref={coverPageRef}
            collapsable={false}
            style={[styles.heroPageContainer, style.borderStyle]}
          >
            <Text
              style={[
                styles.heroMainTitle,
                { fontFamily: style.text.fontFamily },
              ]}
            >
              {heroWatch.name || 'Watch Name Here'}
            </Text>

            <View style={styles.heroImageWrapper}>
              <Image
                source={{ uri: heroWatch.image }}
                style={styles.heroImage}
                resizeMode="contain"
              />
            </View>

            {/* Bottom Right Description Box */}
            <View style={styles.heroDescBox}>
              <Text style={styles.heroDescTitle}>DESCRIPTION</Text>

              <View style={styles.heroSpecRow}>
                <Text style={styles.heroSpecLabel}>Brand</Text>
                <Text style={styles.heroSpecValue}>
                  {heroWatch.brand || 'N/A'}
                </Text>
              </View>
              <View style={styles.heroSpecRow}>
                <Text style={styles.heroSpecLabel}>Gender</Text>
                <Text style={styles.heroSpecValue}>
                  {heroWatch.gender || 'Unisex'}
                </Text>
              </View>
              <View style={styles.heroSpecRow}>
                <Text style={styles.heroSpecLabel}>Type</Text>
                <Text style={styles.heroSpecValue}>
                  {heroWatch.type || 'Analogue'}
                </Text>
              </View>
              <View style={styles.heroSpecRow}>
                <Text style={styles.heroSpecLabel}>Dial Color</Text>
                <Text style={styles.heroSpecValue}>
                  {heroWatch.color || 'Standard'}
                </Text>
              </View>
              <View style={styles.heroSpecRow}>
                <Text style={styles.heroSpecLabel}>Strap</Text>
                <Text style={styles.heroSpecValue}>
                  {heroWatch.strap || 'Leather/Metal'}
                </Text>
              </View>
              {heroWatch.price && (
                <View style={styles.heroSpecRow}>
                  <Text style={styles.heroSpecLabel}>Price</Text>
                  <Text style={styles.heroSpecValue}>₹{heroWatch.price}</Text>
                </View>
              )}
            </View>
          </View>
        </Animated.View>

        {/* PAGE 2+: GRID CONTENT */}
        {watchChunks.map((chunk, pageIndex) => (
          <Animated.View
            key={pageIndex}
            style={[styles.pdfPage, getAnimStyle(Math.min(pageIndex + 2, 3))]}
          >
            <View
              ref={el => {
                contentPageRefs.current[pageIndex] = el;
              }}
              collapsable={false}
              style={[styles.gridPageContainer, style.page]}
            >
              <View
                style={[
                  styles.gridContent,
                  targetWatches.length === 1 && styles.gridContentCentered,
                ]}
              >
                {chunk.map(item => (
                  <View
                    key={item.id}
                    style={[
                      styles.gridItem,
                      targetWatches.length === 1 && styles.gridItemSingle,
                    ]}
                  >
                    <Image
                      source={{ uri: item.image }}
                      style={styles.gridItemImage}
                      resizeMode="contain"
                    />

                    <Text
                      style={[styles.gridItemName, style.text]}
                      numberOfLines={1}
                    >
                      {item.name || 'Product Name'}
                    </Text>

                    <Text style={[styles.gridItemCode, style.mutedText]}>
                      CODE: W_{item.id.substring(0, 5)}
                    </Text>

                    {pdfConfig.showPrice && (
                      <>
                        <View style={styles.gridItemDivider} />
                        <Text style={[styles.gridItemPrice, style.text]}>
                          ₹{' '}
                          {item.price
                            ? parseFloat(item.price).toFixed(2)
                            : '0.00'}
                        </Text>
                      </>
                    )}

                    {/* Decorative Dots */}
                    <View style={styles.gridItemDots}>
                      <View
                        style={[
                          styles.dot,
                          { backgroundColor: style.mutedText.color },
                        ]}
                      />
                      <View
                        style={[
                          styles.dot,
                          { backgroundColor: style.mutedText.color },
                        ]}
                      />
                      <View
                        style={[
                          styles.dot,
                          { backgroundColor: style.mutedText.color },
                        ]}
                      />
                      <View
                        style={[
                          styles.dot,
                          { backgroundColor: style.mutedText.color },
                        ]}
                      />
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.gridPageFooter}>
                <Text style={[styles.gridFooterText, style.mutedText]}>
                  {pdfConfig.coverTitle} / {pdfConfig.coverSubtitle} — Page{' '}
                  {pageIndex + 1}
                </Text>
              </View>
            </View>
          </Animated.View>
        ))}

        <View style={{ height: 160 }} />
      </ScrollView>

      {/* FLOATING DOWNLOAD BUTTON */}
      <TouchableOpacity
        style={styles.downloadFab}
        onPress={handleDownload}
        disabled={isDownloading}
        activeOpacity={0.8}
      >
        {isDownloading ? (
          <ActivityIndicator size="small" color={THEME.surface} />
        ) : (
          <Icon name="download" size={24} color={THEME.surface} />
        )}
      </TouchableOpacity>

      {/* Download Progress Indicator */}
      {isDownloading && totalDownloads > 1 && (
        <View style={styles.downloadProgress}>
          <Text style={styles.downloadProgressText}>
            Generating PDF {currentDownloadIndex} of {totalDownloads}...
          </Text>
        </View>
      )}

      <Toast />
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
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
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
    alignItems: 'center',
  },
  heroText: {
    fontSize: 28,
    fontWeight: '400',
    color: THEME.textDark,
    alignSelf: 'flex-start',
    letterSpacing: -0.5,
  },
  modeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.surface,
    marginHorizontal: 24,
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  modeIndicatorText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.primary,
    marginLeft: 8,
  },
  pdfPage: {
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
    backgroundColor: THEME.surface,
    borderRadius: 8,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
    overflow: 'hidden',
  },
  heroPageContainer: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    position: 'relative',
    overflow: 'hidden',
  },
  heroMainTitle: {
    position: 'absolute',
    top: 40,
    left: 30,
    fontSize: 26,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: 1.5,
    zIndex: 10,
  },
  heroImageWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heroImage: { width: '120%', height: '120%', transform: [{ scale: 1.1 }] },
  heroDescBox: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: 'rgba(30,30,30,0.95)',
    padding: 16,
    width: 180,
    borderWidth: 1,
    borderColor: '#333',
  },
  heroDescTitle: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 12,
  },
  heroSpecRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  heroSpecLabel: { color: '#999', fontSize: 9 },
  heroSpecValue: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '500',
    maxWidth: 90,
    textAlign: 'right',
  },
  gridPageContainer: {
    flex: 1,
    padding: 24,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  gridContent: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginHorizontal: -5,
  },
  gridContentCentered: { justifyContent: 'center', alignItems: 'center' },
  gridItem: {
    width: '33.33%',
    padding: 5,
    alignItems: 'center',
    marginBottom: 20,
  },
  gridItemSingle: { width: '80%', transform: [{ scale: 1.2 }] },
  gridItemImage: { width: '100%', height: 110, marginBottom: 12 },
  gridItemName: {
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 2,
  },
  gridItemCode: { fontSize: 8, textAlign: 'center', marginBottom: 6 },
  gridItemDivider: {
    width: 30,
    height: 1,
    backgroundColor: '#E0E0E0',
    marginBottom: 6,
  },
  gridItemPrice: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  gridItemDots: { flexDirection: 'row', gap: 3 },
  dot: { width: 3, height: 3, borderRadius: 1.5, opacity: 0.5 },
  gridPageFooter: {
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F2',
  },
  gridFooterText: { fontSize: 8, letterSpacing: 0.5 },
  downloadFab: {
    position: 'absolute',
    bottom: 120,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: THEME.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 999,
  },
  downloadProgress: {
    position: 'absolute',
    bottom: 190,
    right: 24,
    backgroundColor: THEME.surface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 998,
  },
  downloadProgressText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.textDark,
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
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  errorButton: {
    backgroundColor: THEME.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
  },
  errorButtonText: {
    color: THEME.surface,
    fontSize: 15,
    fontWeight: '700',
  },
});

export default PDFPreviewScreen;
