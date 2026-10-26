import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import EmptyState from '../components/EmptyState';
import PrimaryButton from '../components/PrimaryButton';
import { colors, radius, spacing } from '../constants/theme';
import { pickImageFromGallery } from '../services/galleryPicker';

// Tapping the flash button cycles through these modes.
const FLASH_MODES = ['off', 'auto', 'on'];
const FLASH_ICONS = { off: 'flash-off', auto: 'flash-outline', on: 'flash' };

export default function CameraScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();

  const [flash, setFlash] = useState('off');
  const [facing, setFacing] = useState('back');
  const [isReady, setIsReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  if (!permission) {
    // Permission status is still loading.
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.permission, { paddingTop: insets.top }]}>
        <EmptyState
          icon="camera-outline"
          title="Camera access needed"
          message="Allow camera access to photograph plants. Photos are only sent to Pl@ntNet for identification."
        >
          <PrimaryButton
            title={permission.canAskAgain ? 'Allow camera' : 'Open settings'}
            icon="camera"
            onPress={permission.canAskAgain ? requestPermission : () => Linking.openSettings()}
            style={styles.permissionButton}
          />
          <PrimaryButton
            title="Go back"
            variant="secondary"
            onPress={() => navigation.goBack()}
            style={styles.permissionButton}
          />
        </EmptyState>
      </View>
    );
  }

  const cycleFlash = () => {
    setFlash((current) => FLASH_MODES[(FLASH_MODES.indexOf(current) + 1) % FLASH_MODES.length]);
  };

  const toggleFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  const takePicture = async () => {
    if (!cameraRef.current || !isReady || isCapturing) return;
    setIsCapturing(true);
    try {
      const { uri, width, height } = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      navigation.replace('Results', { photo: { uri, width, height } });
    } catch (error) {
      Alert.alert('Could not take photo', error.message);
      setIsCapturing(false);
    }
  };

  const openGallery = async () => {
    try {
      const photo = await pickImageFromGallery();
      if (photo) navigation.replace('Results', { photo });
    } catch (error) {
      Alert.alert('Could not open gallery', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
        flash={flash}
        // Pause the camera when this screen is not visible to save battery.
        active={isFocused}
        onCameraReady={() => setIsReady(true)}
        onMountError={(event) => Alert.alert('Camera error', event.message)}
      />

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        <RoundButton icon="close" label="Close camera" onPress={() => navigation.goBack()} />
        <Pressable
          onPress={cycleFlash}
          accessibilityRole="button"
          accessibilityLabel={`Flash ${flash}`}
          style={styles.flashButton}
        >
          <Ionicons name={FLASH_ICONS[flash]} size={22} color={colors.white} />
          <Text style={styles.flashLabel}>{flash.toUpperCase()}</Text>
        </Pressable>
      </View>

      {/* Framing guide */}
      <View style={styles.guideWrap} pointerEvents="none">
        <View style={styles.guide}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
        <Text style={styles.hint}>Centre a leaf or flower in the frame</Text>
      </View>

      {/* Bottom controls */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.lg }]}>
        <RoundButton icon="images-outline" label="Choose from gallery" onPress={openGallery} />

        <Pressable
          onPress={takePicture}
          disabled={!isReady || isCapturing}
          accessibilityRole="button"
          accessibilityLabel="Take picture"
          style={({ pressed }) => [styles.shutterOuter, pressed && styles.shutterPressed]}
        >
          <View style={styles.shutterInner}>
            {isCapturing && <ActivityIndicator color={colors.primary} />}
          </View>
        </Pressable>

        <RoundButton icon="camera-reverse-outline" label="Switch camera" onPress={toggleFacing} />
      </View>
    </View>
  );
}

function RoundButton({ icon, label, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={({ pressed }) => [styles.roundButton, pressed && styles.roundPressed]}
    >
      <Ionicons name={icon} size={24} color={colors.white} />
    </Pressable>
  );
}

const CORNER = 32;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.black,
  },
  permission: {
    flex: 1,
    backgroundColor: colors.background,
  },
  permissionButton: {
    alignSelf: 'stretch',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  flashButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.overlay,
  },
  flashLabel: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  roundButton: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundPressed: {
    opacity: 0.7,
  },
  guideWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  guide: {
    width: '72%',
    aspectRatio: 1,
  },
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
    borderColor: colors.white,
  },
  topLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 12 },
  topRight: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 12 },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 12,
  },
  hint: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
    backgroundColor: colors.overlay,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: spacing.lg,
  },
  shutterOuter: {
    width: 82,
    height: 82,
    borderRadius: radius.pill,
    borderWidth: 5,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterPressed: {
    transform: [{ scale: 0.94 }],
  },
  shutterInner: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
