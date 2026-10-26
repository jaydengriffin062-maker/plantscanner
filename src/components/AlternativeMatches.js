import { StyleSheet, Text, View } from 'react-native';

import { colors, confidenceColor, radius, shadow, spacing } from '../constants/theme';
import ConfidenceBar from './ConfidenceBar';

/** Lists the runner-up candidates returned by the API. */
export default function AlternativeMatches({ matches }) {
  if (!matches?.length) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Other possible matches</Text>
      {matches.map((match) => (
        <View key={match.scientificName} style={styles.row}>
          <View style={styles.rowHeader}>
            <View style={styles.names}>
              <Text style={styles.common} numberOfLines={1}>
                {match.commonName}
              </Text>
              <Text style={styles.scientific} numberOfLines={1}>
                {match.scientificName}
              </Text>
            </View>
            <Text style={[styles.percent, { color: confidenceColor(match.confidence) }]}>
              {match.confidence.toFixed(1)}%
            </Text>
          </View>
          <ConfidenceBar confidence={match.confidence} compact />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadow,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  row: {
    gap: spacing.sm,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  names: {
    flex: 1,
  },
  common: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  scientific: {
    fontSize: 14,
    fontStyle: 'italic',
    color: colors.textMuted,
  },
  percent: {
    fontSize: 16,
    fontWeight: '700',
  },
});
