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
import TemplateCoverCanvas from '../components/TemplateCoverCanvas';

const { width } = Dimensions.get('window');
const PAGE_WIDTH = width - 40;
const PAGE_HEIGHT = PAGE_WIDTH * 1.414;

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

const chunkArray = (arr, size) =>
  arr.reduce(
    (acc, _, i) => (i % size ? acc : [...acc, arr.slice(i, i + size)]),
    [],
  );

// Cover page now rendered by TemplateCoverCanvas component

const PDFPreviewScreen = () => {
  const { params, watches, goBack } = useApp();
  const coverPageRefs = useRef([]);
  const contentPageRefs = useRef([]);
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
    showDesc: true,
    template: 'minimal',
    templateBgColor: '#F5F5F5',
    templateAccentColor: '#1C1C1E',
    templateSecondaryAccent: '#8E8E93',
    templateContent: {
      subtitle: 'PREMIUM WATCH',
      title: 'CATALOG',
      brandName: 'Brand Name',
      tagline: 'Timepiece Collection',
      year: '2025-2026',
      website: 'WWW.YOURWEBSITE.COM',
    },
    coverImage: null,
  };

  const targetWatches =
    selectedWatchIds.length > 0
      ? watches.filter(w => selectedWatchIds.includes(w.id))
      : watch
      ? [watch]
      : [];
  const watchChunks = chunkArray(targetWatches, 9);

  const coverPagesCount = pdfMode === 'separate' ? targetWatches.length : 1;
  if (coverPageRefs.current.length !== coverPagesCount) {
    coverPageRefs.current = Array(coverPagesCount)
      .fill(null)
      .map((_, i) => coverPageRefs.current[i] || React.createRef());
  }

  const contentPagesCount =
    pdfMode === 'separate' ? targetWatches.length : watchChunks.length;
  if (contentPageRefs.current.length !== contentPagesCount) {
    contentPageRefs.current = Array(contentPagesCount)
      .fill(null)
      .map((_, i) => contentPageRefs.current[i] || React.createRef());
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
    const bg = pdfConfig.templateBgColor || '#F5F5F5';
    const isDarkBg = [
      '#1A1A1A',
      '#0A1118',
      '#1C1C1E',
      '#222426',
      '#4A3C2A',
    ].includes(bg);
    
    const selectedFont =
      pdfConfig.detailsFontFamily === 'serif'
        ? Platform.OS === 'ios'
          ? 'Georgia'
          : 'serif'
        : pdfConfig.detailsFontFamily === 'monospace'
        ? Platform.OS === 'ios'
          ? 'Courier'
          : 'monospace'
        : 'System';

    const textStyle = {
      fontFamily: selectedFont,
      color: isDarkBg ? '#FFFFFF' : '#000000',
    };

    const fontSizes = {
      small: { title: 16, code: 11, price: 14 },
      medium: { title: 20, code: 13, price: 18 },
      large: { title: 24, code: 15, price: 22 },
    };
    const fontSize = fontSizes[pdfConfig.detailsFontSize || 'medium'] || fontSizes.medium;

    return {
      page: { backgroundColor: bg },
      text: textStyle,
      mutedText: { ...textStyle, color: isDarkBg ? '#999999' : '#666666' },
      isDarkBg,
      fontSize,
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
      if (pdfMode === 'separate' && targetWatches.length > 1) {
        const filePaths = await generateSeparatePDFs();
        await Share.open({
          urls: filePaths.map(fp =>
            Platform.OS === 'android' ? `file://${fp}` : fp,
          ),
          type: 'application/pdf',
          title: 'Share Catalogues',
        });
      } else {
        const filePath = await generateSinglePDF();
        await Share.open({
          url: Platform.OS === 'android' ? `file://${filePath}` : filePath,
          type: 'application/pdf',
          title: 'Share Catalogue',
        });
      }
    } catch (error) {
      if (error?.message?.includes('User did not share')) return;
      Toast.show({ type: 'error', text1: 'Share Error' });
    } finally {
      setIsSharing(false);
    }
  };

  const generateSinglePDF = async () => {
    const coverBase64 = await captureRef(coverPageRefs.current[0], {
      format: 'png',
      result: 'base64',
    });
    const contentBase64s = [];
    for (let i = 0; i < watchChunks.length; i++) {
      if (contentPageRefs.current[i])
        contentBase64s.push(
          await captureRef(contentPageRefs.current[i], {
            format: 'png',
            result: 'base64',
          }),
        );
    }
    const pdfDoc = await PDFDocument.create();
    const coverImg = await pdfDoc.embedPng(coverBase64);
    pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]).drawImage(coverImg, {
      x: 0,
      y: 0,
      width: PAGE_WIDTH,
      height: PAGE_HEIGHT,
    });
    for (const base64 of contentBase64s) {
      const img = await pdfDoc.embedPng(base64);
      pdfDoc
        .addPage([PAGE_WIDTH, PAGE_HEIGHT])
        .drawImage(img, { x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT });
    }
    const pdfBase64 = await pdfDoc.saveAsBase64();
    const filePath = `${
      RNFS.CachesDirectoryPath
    }/Catalogue_${new Date().getTime()}.pdf`;
    await RNFS.writeFile(filePath, pdfBase64, 'base64');
    return filePath;
  };

  const generateSeparatePDFs = async () => {
    const filePaths = [];
    for (let i = 0; i < targetWatches.length; i++) {
      setCurrentDownloadIndex(i + 1);
      const currentWatch = targetWatches[i];

      const coverBase64 = await captureRef(coverPageRefs.current[i], {
        format: 'png',
        result: 'base64',
      });
      const contentBase64 = await captureRef(contentPageRefs.current[i], {
        format: 'png',
        result: 'base64',
      });

      const pdfDoc = await PDFDocument.create();
      const coverImg = await pdfDoc.embedPng(coverBase64);
      const contentImg = await pdfDoc.embedPng(contentBase64);

      pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]).drawImage(coverImg, {
        x: 0,
        y: 0,
        width: PAGE_WIDTH,
        height: PAGE_HEIGHT,
      });

      pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]).drawImage(contentImg, {
        x: 0,
        y: 0,
        width: PAGE_WIDTH,
        height: PAGE_HEIGHT,
      });

      const pdfBase64 = await pdfDoc.saveAsBase64();
      const safeName = `${currentWatch.brand || 'Watch'}_${
        currentWatch.name || 'Model'
      }`.replace(/[^a-zA-Z0-9]/g, '_');
      const filePath = `${
        RNFS.CachesDirectoryPath
      }/${safeName}_${new Date().getTime()}.pdf`;

      await RNFS.writeFile(filePath, pdfBase64, 'base64');
      filePaths.push(filePath);
    }
    return filePaths;
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      if (pdfMode === 'separate' && targetWatches.length > 1) {
        setTotalDownloads(targetWatches.length);
        const filePaths = await generateSeparatePDFs();
        await Share.open({
          urls: filePaths.map(fp =>
            Platform.OS === 'android' ? `file://${fp}` : fp,
          ),
          type: 'application/pdf',
          saveToFiles: true,
          title: 'Save PDF Catalogues',
        });
        Toast.show({
          type: 'success',
          text1: 'Saved',
          text2: `${filePaths.length} PDFs saved successfully!`,
        });
      } else {
        setTotalDownloads(1);
        setCurrentDownloadIndex(1);
        const filePath = await generateSinglePDF();
        await Share.open({
          url: Platform.OS === 'android' ? `file://${filePath}` : filePath,
          type: 'application/pdf',
          saveToFiles: true,
          title: 'Save PDF Catalogue',
        });
        Toast.show({
          type: 'success',
          text1: 'Saved',
          text2: 'Catalogue saved successfully!',
        });
      }
    } catch (error) {
      if (error?.message?.includes('User did not share')) return;
      Toast.show({ type: 'error', text1: 'PDF Error' });
    } finally {
      setIsDownloading(false);
      setCurrentDownloadIndex(0);
      setTotalDownloads(0);
    }
  };

  const heroWatch = targetWatches[0];
  const style = getDynamicStyle();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.background} />
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: THEME.surface }]}
          onPress={() => goBack()}
        >
          <Icon name="arrow-left" size={20} color={THEME.textDark} />
        </TouchableOpacity>
        <Text style={styles.heroText}>Preview</Text>
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: THEME.primary }]}
          onPress={handleShare}
          disabled={isSharing}
        >
          {isSharing ? (
            <ActivityIndicator size="small" color={THEME.surface} />
          ) : (
            <Icon name="share-2" size={20} color={THEME.surface} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {pdfMode === 'separate' ? (
          targetWatches.map((item, index) => (
            <React.Fragment key={item.id}>
              {/* Watch Cover Page */}
              <Animated.View style={[styles.pdfPage, getAnimStyle(1)]}>
                <View
                  ref={el => {
                    coverPageRefs.current[index] = el;
                  }}
                  collapsable={false}
                  style={styles.flex1}
                >
                  <TemplateCoverCanvas
                    bgColor={pdfConfig.templateBgColor}
                    accentColor={pdfConfig.templateAccentColor}
                    secondaryAccent={pdfConfig.templateSecondaryAccent}
                    content={{
                      ...pdfConfig.templateContent,
                      title: item.name,
                      brandName: item.brand || 'Brand Name',
                    }}
                    coverImage={item.image}
                    editMode={false}
                    canvasWidth={PAGE_WIDTH}
                    canvasHeight={PAGE_HEIGHT}
                  />
                </View>
              </Animated.View>

              {/* Watch Details Page */}
              <Animated.View style={[styles.pdfPage, getAnimStyle(2)]}>
                <View
                  ref={el => {
                    contentPageRefs.current[index] = el;
                  }}
                  collapsable={false}
                  style={[styles.gridPageContainer, style.page]}
                >
                  <View
                    style={[styles.gridContent, styles.gridContentCentered]}
                  >
                    <View style={[styles.gridItem, styles.gridItemSingle]}>
                      <Image
                        source={{ uri: item.image }}
                        style={[styles.gridItemImage, { transform: [{ scale: pdfConfig.detailsImageScale || 1.0 }] }]}
                        resizeMode="contain"
                      />
                      <Text
                        style={[styles.gridItemName, style.text, { fontSize: style.fontSize.title }]}
                        numberOfLines={1}
                      >
                        {pdfConfig.detailsShowBrand ? `${item.brand || 'Watch'} — ` : ''}{item.name}
                      </Text>
                      <Text style={[styles.gridItemCode, style.mutedText, { fontSize: style.fontSize.code }]}>
                        {pdfConfig.detailsCodePrefix || 'CODE: '}{item.id.substring(0, 5)}
                      </Text>
                      {pdfConfig.showPrice && (
                        <>
                          <View style={styles.gridItemDivider} />
                          <Text style={[styles.gridItemPrice, style.text, { fontSize: style.fontSize.price }]}>
                            ₹ {item.price}
                          </Text>
                        </>
                      )}
                    </View>
                  </View>
                  <View style={styles.gridPageFooter}>
                    <Text style={[styles.gridFooterText, style.mutedText]}>
                      {pdfConfig.detailsFooterText || pdfConfig.templateContent?.title || 'CATALOG'} — Page 2
                    </Text>
                  </View>
                </View>
              </Animated.View>
            </React.Fragment>
          ))
        ) : (
          <>
            {/* Shared Cover Page */}
            <Animated.View style={[styles.pdfPage, getAnimStyle(1)]}>
              <View
                ref={el => {
                  coverPageRefs.current[0] = el;
                }}
                collapsable={false}
                style={styles.flex1}
              >
                <TemplateCoverCanvas
                  bgColor={pdfConfig.templateBgColor}
                  accentColor={pdfConfig.templateAccentColor}
                  secondaryAccent={pdfConfig.templateSecondaryAccent}
                  content={{
                    ...pdfConfig.templateContent,
                    brandName:
                      pdfConfig.templateContent?.brandName || heroWatch.brand,
                  }}
                  coverImage={pdfConfig.coverImage || heroWatch.image}
                  editMode={false}
                  canvasWidth={PAGE_WIDTH}
                  canvasHeight={PAGE_HEIGHT}
                />
              </View>
            </Animated.View>

            {/* Grid Content Pages */}
            {watchChunks.map((chunk, pageIndex) => (
              <Animated.View
                key={pageIndex}
                style={[
                  styles.pdfPage,
                  getAnimStyle(Math.min(pageIndex + 2, 3)),
                ]}
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
                          targetWatches.length === 2 && styles.gridItemDouble,
                        ]}
                      >
                        <Image
                          source={{ uri: item.image }}
                          style={[styles.gridItemImage, { transform: [{ scale: pdfConfig.detailsImageScale || 1.0 }] }]}
                          resizeMode="contain"
                        />
                        <Text
                          style={[styles.gridItemName, style.text, { fontSize: style.fontSize.title }]}
                          numberOfLines={1}
                        >
                          {pdfConfig.detailsShowBrand ? `${item.brand || 'Watch'} — ` : ''}{item.name}
                        </Text>
                        <Text style={[styles.gridItemCode, style.mutedText, { fontSize: style.fontSize.code }]}>
                          {pdfConfig.detailsCodePrefix || 'CODE: '}{item.id.substring(0, 5)}
                        </Text>
                        {pdfConfig.showPrice && (
                          <>
                            <View style={styles.gridItemDivider} />
                            <Text style={[styles.gridItemPrice, style.text, { fontSize: style.fontSize.price }]}>
                              ₹ {item.price}
                            </Text>
                          </>
                        )}
                      </View>
                    ))}
                  </View>
                  <View style={styles.gridPageFooter}>
                    <Text style={[styles.gridFooterText, style.mutedText]}>
                      {pdfConfig.detailsFooterText || pdfConfig.templateContent?.title || 'CATALOG'} — Page{' '}
                      {pageIndex + 2}
                    </Text>
                  </View>
                </View>
              </Animated.View>
            ))}
          </>
        )}
        <View style={{ height: 160 }} />
      </ScrollView>

      <TouchableOpacity
        style={styles.downloadFab}
        onPress={handleDownload}
        disabled={isDownloading}
        activeOpacity={0.8}
      >
        {isDownloading ? (
          <ActivityIndicator size="small" color={THEME.textDark} />
        ) : (
          <Icon name="download" size={24} color={THEME.textDark} />
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.background },
  flex1: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  iconButton: {
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
  scrollContent: { paddingBottom: 40, alignItems: 'center' },
  heroText: {
    fontSize: 32,
    fontWeight: '400',
    color: THEME.textDark,
    letterSpacing: -0.5,
  },
  pdfPage: {
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
    backgroundColor: THEME.surface,
    borderRadius: 32,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
    overflow: 'hidden',
  },
  gridPageContainer: {
    flex: 1,
    padding: 24,
    paddingBottom: 16,
    backgroundColor: THEME.surface,
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
  gridItemDouble: {
    width: '46%',
    marginHorizontal: '2%',
    transform: [{ scale: 1.05 }],
  },
  gridItemImage: { width: '100%', height: 110, marginBottom: 12 },
  gridItemName: {
    fontSize: 10,
    fontWeight: '600',
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
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 6,
  },
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
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: THEME.accentColor,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 999,
  },
  downloadProgress: {
    position: 'absolute',
    bottom: 195,
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

export default PDFPreviewScreen;
