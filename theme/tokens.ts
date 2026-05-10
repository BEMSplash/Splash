export const colors = {
  bg: '#000000',
  bgInverse: '#FFFFFF',
  surface: '#181818',
  surfaceElevated: '#222222',
  border: '#2A2A2A',
  text: '#FFFFFF',
  textInverse: '#000000',
  textMuted: '#A3A3A3',
  textDim: '#6B6B6B',
  primary: '#FFFFFF',
  primaryText: '#000000',
  accent: '#3B82F6',
  illustration: '#1F1F1F',
  illustrationLight: '#E5E5E5',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const type = {
  display: { fontSize: 32, lineHeight: 38, fontWeight: '700' as const },
  title: { fontSize: 24, lineHeight: 30, fontWeight: '700' as const },
  body: { fontSize: 16, lineHeight: 22, fontWeight: '400' as const },
  bodyBold: { fontSize: 16, lineHeight: 22, fontWeight: '600' as const },
  caption: { fontSize: 14, lineHeight: 18, fontWeight: '400' as const },
  small: { fontSize: 12, lineHeight: 16, fontWeight: '400' as const },
} as const;
