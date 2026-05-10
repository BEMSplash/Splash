import Svg, { Path } from 'react-native-svg';

type Props = { size?: number; color?: string };

export function SplashLogo({ size = 64, color = '#FFFFFF' }: Props) {
  return (
    <Svg width={size} height={size * 0.7} viewBox="0 0 100 70" fill="none">
      <Path
        d="M50 8 C46 18, 40 24, 32 26 C28 22, 22 22, 18 26 C14 32, 18 40, 26 40 C20 44, 18 52, 24 56 C30 58, 36 54, 38 48 C42 54, 50 56, 56 52 C58 58, 66 60, 72 56 C78 50, 76 42, 70 40 C78 38, 82 30, 78 24 C72 20, 64 22, 60 28 C56 22, 54 14, 50 8 Z"
        fill={color}
      />
      <Path d="M28 16 a3 3 0 1 1 0.1 0" fill={color} />
      <Path d="M70 22 a2.5 2.5 0 1 1 0.1 0" fill={color} />
      <Path d="M16 50 a2 2 0 1 1 0.1 0" fill={color} />
    </Svg>
  );
}
