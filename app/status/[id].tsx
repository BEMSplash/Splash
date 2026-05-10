import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { useEffect, useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Status, fetchStatus, toggleReaction } from '@/lib/statuses';
import { CloseIcon, DropIcon, StarIcon } from '@/components/icons';
import { useAuth, requireAuth } from '@/lib/auth';
import { colors, radii, spacing, type } from '@/theme/tokens';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function StatusDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    const s = await fetchStatus(id, user?.id ?? null);
    setStatus(s);
    setLoading(false);
  }, [id, user]);

  useEffect(() => {
    load();
  }, [load]);

  const onReact = async (kind: 'drop' | 'star') => {
    if (!status) return;
    if (!requireAuth(user, kind === 'drop' ? 'drop a 💧' : 'star a splash')) return;
    const active = kind === 'drop' ? !!status.reacted_drop : !!status.reacted_star;
    setStatus({
      ...status,
      reacted_drop: kind === 'drop' ? !active : !!status.reacted_drop,
      reacted_star: kind === 'star' ? !active : !!status.reacted_star,
      drop_count:
        kind === 'drop' ? (status.drop_count ?? 0) + (active ? -1 : 1) : status.drop_count,
      star_count:
        kind === 'star' ? (status.star_count ?? 0) + (active ? -1 : 1) : status.star_count,
    });
    try {
      await toggleReaction(status.id, kind, active);
    } catch {
      load();
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color={colors.text} style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }
  if (!status) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <CloseIcon color={colors.text} />
          </Pressable>
        </View>
        <View style={styles.center}>
          <Text style={styles.muted}>This splash is no longer available.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const initials = (status.username || '?').slice(0, 1).toUpperCase();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <CloseIcon color={colors.text} />
        </Pressable>
        <Pressable hitSlop={10}>
          <Text style={styles.dots}>•••</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.location}>
          {status.lat != null && status.lng != null
            ? `📍 within ${status.radius_km} km`
            : 'Location private'}
        </Text>

        <View style={styles.who}>
          {status.avatar_url ? (
            <Image source={{ uri: status.avatar_url }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.initial}>{initials}</Text>
            </View>
          )}
          <View>
            <Text style={styles.name}>{status.username || 'Anonymous'}</Text>
            <Text style={styles.meta}>{timeAgo(status.created_at)}</Text>
          </View>
        </View>

        <Text style={styles.body}>{status.body}</Text>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable onPress={() => onReact('drop')} style={styles.reactBtn} hitSlop={8}>
          <DropIcon size={28} color={colors.text} filled={status.reacted_drop} />
          <Text style={styles.count}>{status.drop_count ?? 0}</Text>
        </Pressable>
        <Pressable onPress={() => onReact('star')} style={styles.reactBtn} hitSlop={8}>
          <StarIcon size={28} color={colors.text} filled={status.reacted_star} />
          <Text style={styles.count}>{status.star_count ?? 0}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  dots: { color: colors.text, fontSize: 22, letterSpacing: 2 },
  scroll: { padding: spacing.lg, gap: spacing.md },
  location: { ...type.caption, color: colors.textMuted },
  who: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: { ...type.bodyBold, color: colors.text, fontSize: 18 },
  avatarImg: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.surface },
  name: { ...type.bodyBold, color: colors.text },
  meta: { ...type.small, color: colors.textMuted },
  body: { ...type.body, color: colors.text, fontSize: 22, lineHeight: 32, marginTop: spacing.lg },
  footer: {
    flexDirection: 'row',
    gap: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  reactBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  count: { ...type.bodyBold, color: colors.text, fontSize: 18 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { ...type.body, color: colors.textMuted },
});
