import { Pressable, Text, StyleSheet, View } from 'react-native';
import { colors, radii, spacing, type } from '@/theme/tokens';

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

export function RadioOption({ label, selected, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={styles.row} accessibilityRole="radio" accessibilityState={{ selected }}>
      <View style={[styles.outer, selected && styles.outerSelected]}>
        {selected && <View style={styles.inner} />}
      </View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    height: 56,
    borderWidth: 1,
    borderColor: colors.border,
  },
  outer: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerSelected: { borderColor: colors.text },
  inner: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.text },
  label: { ...type.body, color: colors.text },
});
