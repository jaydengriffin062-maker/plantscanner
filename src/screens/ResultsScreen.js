import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AlternativeMatches from '../components/AlternativeMatches';
import CareTipsCard from '../components/CareTipsCard';
import EmptyState from '../components/EmptyState';
import PrimaryButton from '../components/PrimaryButton';
import ResultCard from '../components/ResultCard';
import { colors, radius, spacing } from '../constants/theme';
import { addToHistory, createScanId } from '../services/historyStorage';
import { persistImage, prepareImageForUpload } from '../services/imageService';
import { identifyPlant } from '../services/plantNetApi';

/**
 * Route params, one of:
 *   { photo: { uri, width, height } }  -> identify a new photo
 *   { record }                         -> show a saved scan from history (offline)
 */
export default function ResultsScreen({ navigation, route }) {
  const { photo, record: savedRecord } = route.params ?? {};
  const insets = useSafeAreaInsets();

  const [state, setState] = useState(() =>
    savedRecord ? { status: 'success', record: savedRecord } : { status: 'loading' }
  );
  // Prevents a duplicate API call (and duplicate history entry) when React
  // re-runs effects in development Strict Mode.
  const startedRef = useRef(false);

  const runIdentification = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      const uploadUri = await prepareImageForUpload(photo.uri, photo.width, photo.height);
      const { matches } = await identifyPlant(uploadUri);

      const id = createScanId();
      const record = { id, imageUri: uploadUri, createdAt: new Date().toISOString(), matches };

      // Saving to history should never block showing the result.
      try {
        record.imageUri = await persistImage(uploadUri, id);
        await addToHistory(record);
      } catch (error) {
        console.warn('Failed to save scan to history', error);
      }

      setState({ status: 'success', record });
    } catch (error) {
      setState({ status: 'error', message: error.message ?? 'Something went wrong.' });
    }
  }, [photo]);

  useEffect(() => {
    if (savedRecord || startedRef.current) return;
    startedRef.current = true;
    runIdentification();
  }, [savedRecord, runIdentification]);

  if (state.status === 'loading') {
    return (
      <View style={styles.loadingContainer}>
        {photo?.uri && <Image source={{ uri: photo.uri }} style={StyleSheet.absoluteFill} blurRadius={8} />}
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingTitle}>Identifying your plant…</Text>
            <Text style={styles.loadingText}>{"Comparing your photo against Pl@ntNet's database."}</Text>
          </View>
        </View>
      </View>
    );
  }

  if (state.status === 'error') {
    return (
      <View style={[styles.errorContainer, { paddingBottom: insets.bottom }]}>
        <EmptyState icon="alert-circle-outline" title="Identification failed" message={state.message}>
          <PrimaryButton title="Try again" icon="refresh" onPress={runIdentification} style={styles.fullWidth} />
          <PrimaryButton
            title="Take a new photo"
            icon="camera-outline"
            variant="secondary"
            onPress={() => navigation.replace('Camera')}
            style={styles.fullWidth}
          />
        </EmptyState>
      </View>
    );
  }

  const { record } = state;
  const [best, ...alternatives] = record.matches;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.lg }]}
    >
      <Image source={{ uri: record.imageUri }} style={styles.photo} />

      <View style={styles.cards}>
        <ResultCard match={best} />
        <CareTipsCard match={best} />
        <AlternativeMatches matches={alternatives} />

        {best.gbifId && (
          <Pressable
            onPress={() => Linking.openURL(`https://www.gbif.org/species/${best.gbifId}`)}
            style={styles.linkRow}
            accessibilityRole="link"
          >
            <Ionicons name="open-outline" size={18} color={colors.primary} />
            <Text style={styles.link}>Learn more about {best.scientificName} on GBIF</Text>
          </Pressable>
        )}

        <Text style={styles.scannedAt}>
          Scanned {new Date(record.createdAt).toLocaleString()} · Identification by Pl@ntNet
        </Text>

        <PrimaryButton title="Scan another plant" icon="camera-outline" onPress={() => navigation.popToTop()} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: spacing.xl,
  },
  photo: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: colors.border,
  },
  cards: {
    padding: spacing.md,
    gap: spacing.md,
    marginTop: -spacing.xl,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  link: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  scannedAt: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(243, 247, 242, 0.6)',
    padding: spacing.lg,
  },
  loadingCard: {
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 340,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.sm,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
});
