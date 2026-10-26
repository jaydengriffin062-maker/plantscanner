import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, shadow, spacing } from '../constants/theme';
import ConfidenceBar from './ConfidenceBar';

/** The headline card for the best match. */
export default function ResultCard({ match }) {
  const hasDistinctCommonName = match.commonName !== match.scientificName;

  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>Best match</Text>
      <Text style={styles.commonName}>{match.commonName}</Text>
      {hasDistinctCommonName && <Text style={styles.scientificName}>{match.scientificName}</Text>}

      {match.otherCommonNames?.length > 0 && (
        <Text style={styles.aka}>Also known as {match.otherCommonNames.join(', ')}</Text>
      )}

      <View style={styles.tags}>
        {match.family && <Tag label="Family" value={match.family} />}
        {match.genus && <Tag label="Genus" value={match.genus} />}
      </View>

      <ConfidenceBar confidence={match.confidence} />

      {match.confidence < 40 && (
        <Text style={styles.hint}>
          Low confidence. Try a sharper photo of a single leaf or flower against a plain background.
        </Text>
      )}
    </View>
  );
}

function Tag({ label, value }) {
  return (
    <View style={styles.tag}>
      <Text style={styles.tagLabel}>{label}</Text>
      <Text style={styles.tagValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadow,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.primary,
  },
  commonName: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  scientificName: {
    fontSize: 18,
    fontStyle: 'italic',
    color: colors.textMuted,
  },
  aka: {
    fontSize: 14,
    color: colors.textMuted,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginVertical: spacing.sm,
  },
  tag: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  tagLabel: {
    fontSize: 11,
    color: colors.primaryDark,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  tagValue: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '600',
  },
  hint: {
    marginTop: spacing.xs,
    fontSize: 13,
    color: colors.textMuted,
  },
});
