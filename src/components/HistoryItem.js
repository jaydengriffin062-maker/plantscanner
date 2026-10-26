import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, confidenceColor, radius, shadow, spacing } from '../constants/theme';

export default function HistoryItem({ record, onPress, onDelete }) {
  const best = record.matches[0];
  const date = new Date(record.createdAt).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${best.commonName}, scanned ${date}`}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <Image source={{ uri: record.imageUri }} style={styles.thumb} />
      <View style={styles.body}>
        <Text style={styles.common} numberOfLines={1}>
          {best.commonName}
        </Text>
        <Text style={styles.scientific} numberOfLines={1}>
          {best.scientificName}
        </Text>
        <View style={styles.meta}>
          <Text style={[styles.confidence, { color: confidenceColor(best.confidence) }]}>
            {best.confidence.toFixed(0)}% match
          </Text>
          <Text style={styles.date}>{date}</Text>
        </View>
      </View>
      {onDelete && (
        <Pressable
          onPress={onDelete}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={`Delete ${best.commonName} from history`}
          style={styles.delete}
        >
          <Ionicons name="trash-outline" size={20} color={colors.textMuted} />
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: spacing.md,
    ...shadow,
  },
  pressed: {
    opacity: 0.85,
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: radius.sm,
    backgroundColor: colors.border,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  common: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  scientific: {
    fontSize: 14,
    fontStyle: 'italic',
    color: colors.textMuted,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  confidence: {
    fontSize: 13,
    fontWeight: '600',
  },
  date: {
    fontSize: 12,
    color: colors.textMuted,
  },
  delete: {
    padding: spacing.sm,
  },
});
