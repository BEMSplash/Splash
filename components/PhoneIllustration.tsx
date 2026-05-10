import { View } from 'react-native';
import Svg, { Rect, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors } from '@/theme/tokens';

export function PhoneIllustration() {
  return (
    <View style={{ width: '100%', aspectRatio: 0.7, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width="100%" height="100%" viewBox="0 0 393 600" fill="none">
        <Defs>
          <LinearGradient id="phoneShadow" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#0A0A0A" />
            <Stop offset="1" stopColor="#1F1F1F" />
          </LinearGradient>
        </Defs>
        <Rect
          x="240"
          y="20"
          width="160"
          height="320"
          rx="22"
          fill={colors.illustrationLight}
          opacity="0.55"
          transform="rotate(18 320 180)"
        />
        <Rect
          x="220"
          y="220"
          width="160"
          height="320"
          rx="22"
          fill={colors.illustrationLight}
          opacity="0.4"
          transform="rotate(18 300 380)"
        />
        <Rect
          x="60"
          y="60"
          width="220"
          height="440"
          rx="32"
          fill="url(#phoneShadow)"
          transform="rotate(-15 170 280)"
        />
        <Rect
          x="78"
          y="78"
          width="184"
          height="404"
          rx="24"
          fill="#0A0A0A"
          transform="rotate(-15 170 280)"
        />
      </Svg>
    </View>
  );
}
