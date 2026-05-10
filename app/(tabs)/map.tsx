import {
  View,
  Text,
  StyleSheet,
  Platform,
  Pressable,
  ActivityIndicator,
  FlatList,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useEffect, useState, useCallback, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth, requireAuth } from '@/lib/auth';
import { Status, fetchTrending, toggleReaction } from '@/lib/statuses';
import { getCurrentLocation } from '@/lib/permissions';
import { SplashLogo } from '@/components/SplashLogo';
import { DropIcon, StarIcon, PersonIcon } from '@/components/icons';
import Svg, { Circle as SvgCircle, Line } from 'react-native-svg';
import { colors, radii, spacing, type } from '@/theme/tokens';

let MapView: any, Marker: any, Circle: any, PROVIDER_DEFAULT: any;
if (Platform.OS !== 'web') {
  const mod = require('react-native-maps');
  MapView = mod.default;
  Marker = mod.Marker;
  Circle = mod.Circle;
  PROVIDER_DEFAULT = mod.PROVIDER_DEFAULT;
}

const PARIS = { latitude: 48.8566, longitude: 2.3522 };
const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = SCREEN_WIDTH - 2 * 16; // matches CARD_MARGIN below
const CARD_MARGIN = 16;
const SNAP = CARD_WIDTH + spacing.sm;

export default function MapTab() {
  const router = useRouter();
  const { user } = useAuth();
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [loc, setLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const mapRef = useRef<any>(null);
  const listRef = useRef<FlatList<Status>>(null);

  const recenter = useCallback(async () => {
    const l = await getCurrentLocation();
    if (!l || !mapRef.current) return;
    setLoc(l);
    mapRef.current.animateToRegion(
      {
        latitude: l.lat,
        longitude: l.lng,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      },
      500
    );
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [l, rows] = await Promise.all([
        getCurrentLocation(),
        fetchTrending(user?.id ?? null, 200),
      ]);
      setLoc(l);
      setStatuses(rows.filter((s) => s.lat != null && s.lng != null));
    } catch (e) {
      console.warn('map load failed', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  // When activeIndex changes, pan the map to that post
  useEffect(() => {
    const s = statuses[activeIndex];
    if (!s || !mapRef.current) return;
    mapRef.current.animateToRegion(
      {
        latitude: s.lat!,
        longitude: s.lng!,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      },
      350
    );
  }, [activeIndex, statuses]);

  const onCarouselScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.round(x / SNAP);
    if (idx !== activeIndex && idx >= 0 && idx < statuses.length) {
      setActiveIndex(idx);
    }
  };

  const focusStatus = (id: string) => {
    const idx = statuses.findIndex((s) => s.id === id);
    if (idx === -1) return;
    listRef.current?.scrollToIndex({ index: idx, animated: true });
    setActiveIndex(idx);
  };

  const onReact = async (status: Status, kind: 'drop' | 'star') => {
    if (!requireAuth(user, kind === 'drop' ? 'drop a 💧' : 'star a splash')) return;
    const active = kind === 'drop' ? !!status.reacted_drop : !!status.reacted_star;
    setStatuses((prev) =>
      prev.map((s) =>
        s.id === status.id
          ? {
              ...s,
              reacted_drop: kind === 'drop' ? !active : !!s.reacted_drop,
              reacted_star: kind === 'star' ? !active : !!s.reacted_star,
              drop_count:
                kind === 'drop' ? (s.drop_count ?? 0) + (active ? -1 : 1) : s.drop_count,
              star_count:
                kind === 'star' ? (s.star_count ?? 0) + (active ? -1 : 1) : s.star_count,
            }
          : s
      )
    );
    try {
      await toggleReaction(status.id, kind, active, status.user_id);
    } catch {
      load();
    }
  };

  const center = loc
    ? { latitude: loc.lat, longitude: loc.lng }
    : statuses[0]
    ? { latitude: statuses[0].lat!, longitude: statuses[0].lng! }
    : PARIS;

  const active = statuses[activeIndex];

  if (Platform.OS === 'web') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.headerOverlay}>
          <View style={{ width: 32 }} />
          <SplashLogo size={28} color={colors.text} />
          <Pressable
            onPress={() => {
              if (!user) {
                router.push('/auth/create-account');
                return;
              }
              router.push('/(tabs)/profile');
            }}
          >
            <View style={styles.avatar}>
              <PersonIcon size={20} color={colors.text} />
            </View>
          </Pressable>
        </View>
        <View style={styles.webEmpty}>
          <Text style={styles.title}>Map view</Text>
          <Text style={styles.muted}>
            The interactive map is only available in the iOS / Android apps.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_DEFAULT}
        initialRegion={{
          latitude: center.latitude,
          longitude: center.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation
        showsMyLocationButton={false}
        userInterfaceStyle="dark"
      >
        {statuses.map((s, i) => (
          <Marker
            key={s.id}
            coordinate={{ latitude: s.lat!, longitude: s.lng! }}
            onPress={() => focusStatus(s.id)}
            tracksViewChanges={false}
          >
            <View style={[styles.pin, i === activeIndex && styles.pinActive]}>
              <View style={styles.pinInner} />
            </View>
          </Marker>
        ))}
        {active && (
          <Circle
            center={{ latitude: active.lat!, longitude: active.lng! }}
            radius={(active.radius_km || 1) * 1000}
            strokeColor="rgba(255,255,255,0.6)"
            fillColor="rgba(255,255,255,0.08)"
            strokeWidth={1}
          />
        )}
      </MapView>

      <SafeAreaView style={styles.headerOverlay} edges={['top']} pointerEvents="box-none">
        <View style={{ width: 32 }} />
        <SplashLogo size={28} color={colors.text} />
        <Pressable
          onPress={() => {
            if (!user) {
              router.push('/auth/create-account');
              return;
            }
            router.push('/(tabs)/profile');
          }}
        >
          <View style={styles.avatar}>
            <PersonIcon size={20} color={colors.text} />
          </View>
        </Pressable>
      </SafeAreaView>

      {loading && (
        <View style={styles.loading} pointerEvents="none">
          <ActivityIndicator color={colors.text} />
        </View>
      )}

      <Pressable onPress={recenter} style={styles.locateBtn} hitSlop={10}>
        <LocateIcon />
      </Pressable>

      {statuses.length > 0 && (
        <View style={styles.carouselWrap} pointerEvents="box-none">
          <View style={styles.dotsRow} pointerEvents="none">
            {statuses.slice(0, 12).map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === activeIndex && styles.dotActive]}
              />
            ))}
            {statuses.length > 12 && <Text style={styles.dotsMore}>+{statuses.length - 12}</Text>}
          </View>
          <FlatList
            ref={listRef}
            data={statuses}
            keyExtractor={(s) => s.id}
            horizontal
            pagingEnabled={false}
            decelerationRate="fast"
            snapToInterval={SNAP}
            snapToAlignment="start"
            disableIntervalMomentum
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: CARD_MARGIN / 2 }}
            onMomentumScrollEnd={onCarouselScrollEnd}
            getItemLayout={(_, index) => ({
              length: SNAP,
              offset: SNAP * index,
              index,
            })}
            renderItem={({ item }) => (
              <Pressable
                style={styles.card}
                onPress={() => router.push(`/status/${item.id}`)}
              >
                <View style={styles.cardHead}>
                  <Text style={styles.cardName}>{item.username || 'Anonymous'}</Text>
                  <Text style={styles.cardRadius}>within {item.radius_km} km</Text>
                </View>
                <Text numberOfLines={4} style={styles.cardBody}>
                  {item.body || '📷 Photo'}
                </Text>
                <View style={styles.cardActions}>
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      onReact(item, 'drop');
                    }}
                    style={styles.reactBtn}
                    hitSlop={8}
                  >
                    <DropIcon size={18} color={colors.text} filled={item.reacted_drop} />
                    <Text style={styles.reactCount}>{item.drop_count ?? 0}</Text>
                  </Pressable>
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      onReact(item, 'star');
                    }}
                    style={styles.reactBtn}
                    hitSlop={8}
                  >
                    <StarIcon size={18} color={colors.text} filled={item.reacted_star} />
                    <Text style={styles.reactCount}>{item.star_count ?? 0}</Text>
                  </Pressable>
                  <Text style={styles.swipeHint}>Swipe →</Text>
                </View>
              </Pressable>
            )}
          />
        </View>
      )}
    </View>
  );
}

function LocateIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <SvgCircle cx={12} cy={12} r={3} fill={colors.text} />
      <SvgCircle cx={12} cy={12} r={8} stroke={colors.text} strokeWidth={1.5} />
      <Line x1={12} y1={1} x2={12} y2={4} stroke={colors.text} strokeWidth={1.5} />
      <Line x1={12} y1={20} x2={12} y2={23} stroke={colors.text} strokeWidth={1.5} />
      <Line x1={1} y1={12} x2={4} y2={12} stroke={colors.text} strokeWidth={1.5} />
      <Line x1={20} y1={12} x2={23} y2={12} stroke={colors.text} strokeWidth={1.5} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loading: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  locateBtn: {
    position: 'absolute',
    right: spacing.md,
    bottom: 280,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  pin: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.bg,
  },
  pinActive: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 3,
  },
  pinInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.bg,
  },
  carouselWrap: {
    position: 'absolute',
    bottom: 100, // above tab bar
    left: 0,
    right: 0,
    gap: spacing.sm,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  dotActive: {
    backgroundColor: colors.text,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotsMore: { ...type.small, color: colors.textMuted, marginLeft: spacing.xs },
  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  cardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardName: { ...type.bodyBold, color: colors.text },
  cardRadius: { ...type.small, color: colors.textMuted },
  cardBody: { ...type.body, color: colors.text, minHeight: 48 },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginTop: spacing.xs,
  },
  reactBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  reactCount: { ...type.caption, color: colors.text },
  swipeHint: { ...type.small, color: colors.textMuted, marginLeft: 'auto' },
  webEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
  title: { ...type.title, color: colors.text },
  muted: { ...type.body, color: colors.textMuted, textAlign: 'center' },
});
