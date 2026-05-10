import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, radii, type } from '@/theme/tokens';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: 'light' | 'dark';
  disabled?: boolean;
  style?: ViewStyle;
};

export function PrimaryButton({ label, onPress, variant = 'light', disabled, style }: Props) {
  const isLight = variant === 'light';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.base,
        isLight ? styles.light : styles.dark,
        disabled && { opacity: 0.5 },
        pressed && !disabled && { opacity: 0.8 },
        style,
      ]}
    >
      <Text style={[type.bodyBold, { color: isLight ? colors.primaryText : colors.text }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 56,
    borderRadius: radii.md,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  light: { backgroundColor: colors.bgInverse },
  dark: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
});
