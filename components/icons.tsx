import Svg, { Path, Circle } from 'react-native-svg';

type IconProps = { size?: number; color?: string; filled?: boolean };

export function DropIcon({ size = 24, color = '#FFFFFF', filled = false }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'}>
      <Path
        d="M12 2.5 C8 8 5 12 5 15 a7 7 0 0 0 14 0 c0 -3 -3 -7 -7 -12.5 Z"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function StarIcon({ size = 24, color = '#FFFFFF', filled = false }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'}>
      <Path
        d="M12 3l2.7 5.6 6.3.9-4.5 4.4 1.1 6.1L12 17.8 6.4 20l1.1-6.1L3 9.5l6.3-.9L12 3Z"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function GlobeIcon({ size = 24, color = '#FFFFFF' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.6} />
      <Path
        d="M3 12h18M12 3c3 3 4.5 6 4.5 9s-1.5 6-4.5 9M12 3c-3 3-4.5 6-4.5 9s1.5 6 4.5 9"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ListIcon({ size = 24, color = '#FFFFFF' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 7h16M4 12h16M4 17h10" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function PersonIcon({ size = 24, color = '#FFFFFF' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={8} r={4} stroke={color} strokeWidth={1.6} />
      <Path d="M4 21c0-4 4-6 8-6s8 2 8 6" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

export function CloseIcon({ size = 24, color = '#FFFFFF' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 6l12 12M18 6L6 18" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function CheckIcon({ size = 24, color = '#FFFFFF' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12l4 4 10-10" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
