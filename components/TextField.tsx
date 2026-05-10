import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { colors, radii, spacing, type } from '@/theme/tokens';

type Props = TextInputProps & {
  label: string;
  required?: boolean;
  hint?: string;
  prefix?: React.ReactNode;
};

export function TextField({ label, required, hint, prefix, style, ...rest }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>
        {label}
        {required ? '*' : ''}
      </Text>
      <View style={styles.field}>
        {prefix}
        <TextInput
          placeholderTextColor={colors.textDim}
          style={[styles.input, style]}
          {...rest}
        />
      </View>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { ...type.caption, color: colors.text, fontWeight: '600' },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    height: 56,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: { flex: 1, color: colors.text, ...type.body },
  hint: { ...type.small, color: colors.textMuted },
});
