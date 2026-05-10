import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { colors, radii } from '@/theme/tokens';
import { ReactNode } from 'react';

type Props = {
  onPress?: () => void;
  variant?: 'dark' | 'light';
  children: ReactNode;
  style?: ViewStyle;
  accessibilityLabel?: string;
};

export function IconButton({ onPress, variant = 'dark', children, style, accessibilityLabel }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.base,
        variant === 'light' ? styles.light : styles.dark,
        pressed && { opacity: 0.7 },
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: 56,
    height: 56,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dark: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  light: { backgroundColor: colors.bgInverse },
});
