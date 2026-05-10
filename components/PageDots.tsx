import { View, StyleSheet } from 'react-native';
import { colors } from '@/theme/tokens';

type Props = { total: number; current: number };

export function PageDots({ total, current }: Props) {
  return (
    <View style={styles.row}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[styles.dot, i === current && styles.dotActive]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.textDim },
  dotActive: { backgroundColor: colors.text, width: 8, height: 8, borderRadius: 4 },
});
