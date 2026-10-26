import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, shadow, spacing } from '../constants/theme';
import { getCareTips } from '../services/careTips';

export default function CareTipsCard({ match }) {
  const { tips, basis } = getCareTips(match);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Care tips</Text>
      <Text style={styles.subtitle}>
        {basis
          ? `General guidance for plants in ${basis}.`
          : 'General houseplant guidance. Check species-specific advice for best results.'}
      </Text>

      {tips.map((tip) => (
        <View key={tip.key} style={styles.tip}>
          <View style={styles.iconWrap}>
            <Ionicons name={tip.icon} size={20} color={colors.primary} />
          </View>
          <View style={styles.tipBody}>
            <Text style={styles.tipTitle}>{tip.title}</Text>
            <Text style={styles.tipText}>{tip.text}</Text>
          </View>
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
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: -spacing.sm,
  },
  tip: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipBody: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
  },
});
