import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import HistoryItem from '../components/HistoryItem';
import PrimaryButton from '../components/PrimaryButton';
import { colors, radius, spacing } from '../constants/theme';
import { pickImageFromGallery } from '../services/galleryPicker';
import { getHistory } from '../services/historyStorage';

const RECENT_COUNT = 3;

export default function HomeScreen({ navigation }) {
  const [recent, setRecent] = useState([]);
  const [isPicking, setIsPicking] = useState(false);

  // Reload recent scans whenever the screen comes back into view.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      getHistory().then((history) => {
        if (active) setRecent(history.slice(0, RECENT_COUNT));
      });
      return () => {
        active = false;
      };
    }, [])
  );

  const handleGallery = async () => {
    setIsPicking(true);
    try {
      const photo = await pickImageFromGallery();
      if (photo) navigation.navigate('Results', { photo });
    } catch (error) {
      Alert.alert('Could not open gallery', error.message);
    } finally {
      setIsPicking(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name="leaf" size={40} color={colors.white} />
          </View>
          <Text style={styles.title}>Plant Scanner</Text>
          <Text style={styles.subtitle}>
            Snap or upload a photo of any plant to find out what it is and how to care for it.
          </Text>
        </View>

        <View style={styles.actions}>
          <PrimaryButton
            title="Take a photo"
            icon="camera-outline"
            onPress={() => navigation.navigate('Camera')}
          />
          <PrimaryButton
            title="Upload from gallery"
            icon="images-outline"
            variant="secondary"
            loading={isPicking}
            onPress={handleGallery}
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent scans</Text>
          {recent.length > 0 && (
            <Pressable onPress={() => navigation.navigate('History')} hitSlop={8}>
              <Text style={styles.link}>See all</Text>
            </Pressable>
          )}
        </View>

        {recent.length === 0 ? (
          <View style={styles.emptyRecent}>
            <Ionicons name="time-outline" size={22} color={colors.textMuted} />
            <Text style={styles.emptyText}>Your identified plants will appear here.</Text>
          </View>
        ) : (
          <View style={styles.recentList}>
            {recent.map((record) => (
              <HistoryItem
                key={record.id}
                record={record}
                onPress={() => navigation.navigate('Results', { record })}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  hero: {
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 23,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 320,
  },
  actions: {
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  link: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  recentList: {
    gap: spacing.md,
  },
  emptyRecent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
  emptyText: {
    flex: 1,
    fontSize: 15,
    color: colors.textMuted,
  },
});
