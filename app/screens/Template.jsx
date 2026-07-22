import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { launchImageLibrary } from 'react-native-image-picker';
import TemplateCoverCanvas from '../components/TemplateCoverCanvas';

const { width } = Dimensions.get('window');
const CANVAS_WIDTH = width - 40;
const CANVAS_HEIGHT = CANVAS_WIDTH * 1.414;

const THEME = {
  background: '#E6E6E6',
  surface: '#FFFFFF',
  primary: '#1C1C1E',
  textDark: '#1C1C1E',
  textMuted: '#8E8E93',
  accentColor: '#F0FE67',
};

const Template = () => {
  const [bgColor, setBgColor] = useState('#222426');
  const [accentColor, setAccentColor] = useState('#FFFFFF');
  const [secondaryAccent] = useState('#B0B0B0');

  const [coverImage, setCoverImage] = useState(null);
  const [content, setContent] = useState({
    subtitle: 'LUXURY WATCH',
    title: 'CATALOG',
    brandName: 'Brand Name',
    tagline: 'Tagline Here',
    year: '2025-2026',
    website: 'WWW.YOURWEBSITE.COM',
  });

  const [editMode, setEditMode] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeTextKey, setActiveTextKey] = useState(null);
  const [tempText, setTempText] = useState('');

  const handleImagePick = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, response => {
      if (response.didCancel || response.errorCode) return;
      if (response.assets && response.assets.length > 0) {
        setCoverImage(response.assets[0].uri);
      }
    });
  };

  const openTextEditor = key => {
    setActiveTextKey(key);
    setTempText(content[key]);
    setModalVisible(true);
  };

  const saveTextEdit = () => {
    setContent(prev => ({ ...prev, [activeTextKey]: tempText }));
    setModalVisible(false);
  };



  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.background} />

      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Icon
            name="layout"
            size={20}
            color={THEME.textDark}
            style={styles.headerIcon}
          />
          <Text style={styles.headerTitle}>Template Editor</Text>
        </View>
        <TouchableOpacity
          style={[styles.toggleBtn, editMode ? styles.toggleBtnActive : null]}
          onPress={() => setEditMode(!editMode)}
        >
          <Icon
            name={editMode ? 'edit-2' : 'eye'}
            size={16}
            color={editMode ? THEME.surface : THEME.textDark}
          />
          <Text
            style={[
              styles.toggleBtnText,
              editMode ? styles.toggleBtnTextActive : null,
            ]}
          >
            {editMode ? 'Editing' : 'Preview'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TemplateCoverCanvas
          bgColor={bgColor}
          accentColor={accentColor}
          secondaryAccent={secondaryAccent}
          content={content}
          coverImage={coverImage}
          editMode={editMode}
          onTextEdit={openTextEditor}
          onImagePick={handleImagePick}
          canvasWidth={CANVAS_WIDTH}
          canvasHeight={CANVAS_HEIGHT}
        />

        {editMode && (
          <View style={styles.customizationPanel}>
            <Text style={styles.panelTitle}>Design Settings</Text>

            <Text style={styles.colorLabel}>Background Color</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.colorRow}
            >
              {['#222426', '#0A1118', '#4A3C2A', '#1C1C1E', '#F5F5F5'].map(c => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: c },
                    bgColor === c && styles.colorCircleActive,
                  ]}
                  onPress={() => setBgColor(c)}
                />
              ))}
            </ScrollView>

            <Text style={styles.colorLabel}>Accent Color</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.colorRow}
            >
              {['#FFFFFF', '#D4AF37', '#F0FE67', '#B76E79', '#1C1C1E'].map(c => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: c },
                    accentColor === c && styles.colorCircleActive,
                  ]}
                  onPress={() => setAccentColor(c)}
                />
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.exportBtn}>
              <Icon
                name="download"
                size={20}
                color={THEME.textDark}
                style={styles.exportIcon}
              />
              <Text style={styles.exportBtnText}>Export Template</Text>
            </TouchableOpacity>
          </View>
        )}

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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.background },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: THEME.background,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerIcon: { marginRight: 8 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: THEME.textDark },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: THEME.surface,
    borderWidth: 1,
    borderColor: '#D4D4D4',
  },
  toggleBtnActive: {
    backgroundColor: THEME.primary,
    borderColor: THEME.primary,
  },
  toggleBtnText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '600',
    color: THEME.textDark,
  },
  toggleBtnTextActive: { color: THEME.surface },
  scrollContent: { alignItems: 'center', paddingTop: 10 },
  customizationPanel: {
    width: CANVAS_WIDTH,
    backgroundColor: THEME.surface,
    marginTop: 24,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.textDark,
    marginBottom: 20,
  },
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
  exportBtn: {
    backgroundColor: THEME.accentColor,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 10,
  },
  exportIcon: { marginRight: 8 },
  exportBtnText: { color: THEME.textDark, fontSize: 15, fontWeight: '700' },
  bottomSpacer: { height: 100 },
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
});

export default Template;
