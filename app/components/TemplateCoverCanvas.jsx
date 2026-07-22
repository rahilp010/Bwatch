import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const THEME = {
  accentColor: '#F0FE67',
  textDark: '#1C1C1E',
};

/**
 * TemplateCoverCanvas - A reusable Canva-style cover page renderer.
 *
 * Props:
 *  bgColor          - string   - Canvas background color
 *  accentColor      - string   - Primary accent (title, brand, website text)
 *  secondaryAccent  - string   - Muted secondary (subtitle, tagline, year)
 *  content          - object   - { subtitle, title, brandName, tagline, year, website }
 *  coverImage       - string|null - URI of the hero image
 *  editMode         - bool     - Show edit badges / dashed borders
 *  onTextEdit       - fn(key)  - Called when an editable text zone is tapped
 *  onImagePick      - fn()     - Called when the image zone is tapped
 *  canvasWidth      - number   - Pixel width of the canvas
 *  canvasHeight     - number   - Pixel height of the canvas
 */
const TemplateCoverCanvas = ({
  bgColor = '#222426',
  accentColor = '#FFFFFF',
  secondaryAccent = '#B0B0B0',
  content = {},
  coverImage = null,
  editMode = false,
  onTextEdit = () => {},
  onImagePick = () => {},
  canvasWidth = SCREEN_WIDTH - 40,
  canvasHeight = (SCREEN_WIDTH - 40) * 1.414,
}) => {
  const {
    subtitle = 'LUXURY WATCH',
    title = 'CATALOG',
    brandName = 'Brand Name',
    tagline = 'Tagline Here',
    year = '2025-2026',
    website = 'WWW.YOURWEBSITE.COM',
  } = content;

  return (
    <View
      style={[
        styles.canvasWrapper,
        {
          width: canvasWidth,
          height: canvasHeight,
          backgroundColor: bgColor,
        },
      ]}
    >
      {/* HEADER TEXT ZONE */}
      <View style={styles.topTextContainer}>
        <TouchableOpacity
          activeOpacity={editMode ? 0.7 : 1}
          onPress={() => editMode && onTextEdit('subtitle')}
          style={[
            styles.editableZone,
            editMode && styles.editableZoneActive,
          ]}
        >
          <Text style={[styles.subtitleText, { color: secondaryAccent }]}>
            {subtitle}
          </Text>
          {editMode && (
            <View style={styles.editIconBadge}>
              <Icon name="edit-2" size={10} color="#FFF" />
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={editMode ? 0.7 : 1}
          onPress={() => editMode && onTextEdit('title')}
          style={[
            styles.editableZone,
            editMode && styles.editableZoneActive,
          ]}
        >
          <Text style={[styles.titleText, { color: accentColor }]}>
            {title}
          </Text>
          {editMode && (
            <View style={styles.editIconBadge}>
              <Icon name="edit-2" size={10} color="#FFF" />
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* MAIN HERO IMAGE ZONE */}
      <TouchableOpacity
        activeOpacity={editMode ? 0.8 : 1}
        onPress={() => editMode && onImagePick()}
        style={[styles.imageZone, editMode && styles.imageZoneEditable]}
      >
        {coverImage ? (
          <Image
            source={{ uri: coverImage }}
            style={styles.heroImage}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Icon name="image" size={40} color="rgba(255,255,255,0.2)" />
            <Text style={styles.placeholderText}>
              {editMode ? 'Tap to Add Watch Image' : ''}
            </Text>
          </View>
        )}
        {editMode && (
          <View style={styles.imageEditBadge}>
            <Icon name="camera" size={14} color={THEME.textDark} />
            <Text style={styles.imageEditBadgeText}>Replace Image</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* FOOTER ZONE */}
      <View style={styles.footerContainer}>
        {/* Bottom Left: Brand */}
        <TouchableOpacity
          activeOpacity={editMode ? 0.7 : 1}
          onPress={() => editMode && onTextEdit('brandName')}
          style={[
            styles.editableZone,
            editMode && styles.editableZoneActive,
            styles.brandRow,
          ]}
        >
          <View
            style={[styles.brandLogoCircle, { borderColor: accentColor }]}
          />
          <View>
            <Text style={[styles.brandNameText, { color: accentColor }]}>
              {brandName}
            </Text>
            <TouchableOpacity
              activeOpacity={editMode ? 0.7 : 1}
              onPress={() => editMode && onTextEdit('tagline')}
            >
              <Text
                style={[styles.brandTaglineText, { color: secondaryAccent }]}
              >
                {tagline}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {/* Bottom Right: Year/Web */}
        <View style={styles.footerRight}>
          <TouchableOpacity
            activeOpacity={editMode ? 0.7 : 1}
            onPress={() => editMode && onTextEdit('year')}
            style={[
              styles.editableZone,
              editMode && styles.editableZoneActive,
            ]}
          >
            <Text style={[styles.yearText, { color: secondaryAccent }]}>
              {year}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={editMode ? 0.7 : 1}
            onPress={() => editMode && onTextEdit('website')}
            style={[
              styles.editableZone,
              editMode && styles.editableZoneActive,
            ]}
          >
            <Text style={[styles.websiteText, { color: accentColor }]}>
              {website}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  canvasWrapper: {
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  topTextContainer: {
    alignItems: 'center',
    marginTop: '15%',
    zIndex: 10,
  },
  subtitleText: {
    fontSize: 16,
    fontWeight: '300',
    letterSpacing: 4,
    marginBottom: 8,
  },
  titleText: {
    fontSize: 42,
    fontWeight: '700',
    letterSpacing: 8,
    textAlign: 'center',
  },
  imageZone: {
    position: 'absolute',
    top: '25%',
    left: '5%',
    right: '5%',
    height: '55%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  imageZoneEditable: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    borderStyle: 'dashed',
    borderRadius: 10,
  },
  heroImage: { width: '100%', height: '100%' },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  placeholderText: {
    color: 'rgba(255,255,255,0.4)',
    marginTop: 10,
    fontSize: 14,
  },
  imageEditBadge: {
    position: 'absolute',
    bottom: 16,
    backgroundColor: THEME.accentColor,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  imageEditBadgeText: {
    color: THEME.textDark,
    fontWeight: '600',
    fontSize: 12,
    marginLeft: 6,
  },
  footerContainer: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    zIndex: 10,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandLogoCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 10,
  },
  brandNameText: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  brandTaglineText: { fontSize: 8, fontWeight: '400', marginTop: 2 },
  footerRight: { alignItems: 'flex-end' },
  yearText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 2,
    marginBottom: 4,
  },
  websiteText: { fontSize: 8, fontWeight: '400', letterSpacing: 1 },
  editableZone: {
    padding: 4,
    position: 'relative',
  },
  editableZoneActive: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    borderStyle: 'dashed',
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  editIconBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#007AFF',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default TemplateCoverCanvas;
