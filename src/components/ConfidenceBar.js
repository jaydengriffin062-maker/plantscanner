import { StyleSheet, Text, View } from 'react-native';

import { colors, confidenceColor, radius, spacing } from '../constants/theme';

export default function ConfidenceBar({ confidence, compact = false }) {
  const percent = Math.max(0, Math.min(100, confidence ?? 0));
  const color = confidenceColor(percent);

  return (
    <View
      accessible
      accessibilityLabel={`Match confidence ${percent.toFixed(0)} percent`}
      style={styles.container}
    >
      {!compact && (
        <View style={styles.labelRow}>
          <Text style={styles.label}>Match confidence</Text>
          <Text style={[styles.value, { color }]}>{percent.toFixed(1)}%</Text>
        </View>
      )}
      <View style={[styles.track, compact && styles.trackCompact]}>
        <View style={[styles.fill, { width: `${percent}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '500',
  },
  value: {
    fontSize: 20,
    fontWeight: '700',
  },
  track: {
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  trackCompact: {
    height: 6,
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
  },
});
