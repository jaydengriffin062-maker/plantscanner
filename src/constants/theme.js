export const colors = {
  primary: '#2E7D4F',
  primaryDark: '#1B5E36',
  primaryLight: '#E6F4EA',
  background: '#F3F7F2',
  surface: '#FFFFFF',
  text: '#1C2B22',
  textMuted: '#5F6F65',
  border: '#DDE6DF',
  danger: '#C62828',
  warning: '#E09B1A',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0, 0, 0, 0.45)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 8,
  md: 14,
  lg: 22,
  pill: 999,
};

export const shadow = {
  shadowColor: '#000',
  shadowOpacity: 0.08,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
};

// Green for confident matches, amber for "probably", red for weak guesses.
export function confidenceColor(percent) {
  if (percent >= 70) return colors.primary;
  if (percent >= 40) return colors.warning;
  return colors.danger;
}
