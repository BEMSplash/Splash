import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SplashLogo } from '@/components/SplashLogo';
import { StatusCard } from '@/components/StatusCard';
import { PersonIcon } from '@/components/icons';
import {
  Status,
  fetchTrending,
  fetchNearYou,
  fetchMyList,
  toggleReaction,
} from '@/lib/statuses';
import { getCurrentLocation } from '@/lib/permissions';
import { useAuth, requireAuth } from '@/lib/auth';
import { useRouter } from 'expo-router';
import { colors, spacing, type } from '@/theme/tokens';

type Tab = 'trending' | 'near' | 'list';

export default function Feed() {
  const router = useRouter();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('trending');
  const [items, setItems] = useState<Status[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      let rows: Status[] = [];
      if (tab === 'trending') {
        rows = await fetchTrending(user?.id ?? null);
      } else if (tab === 'near') {
        const loc = await getCurrentLocation();
        rows = await fetchNearYou(user?.id ?? null, loc);
      } else if (tab === 'list') {
        if (!user) {
          setItems([]);
          return;
        }
        rows = await fetchMyList(user.id);
      }
      setItems(rows);
    } catch (err) {
      console.warn('Feed load failed:', err);
      setItems([]);
    }
  }, [tab, user]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const onReact = async (status: Status, kind: 'drop' | 'star') => {
    if (!requireAuth(user, kind === 'drop' ? 'drop a 💧' : 'star a splash')) return;
    const active = kind === 'drop' ? !!status.reacted_drop : !!status.reacted_star;
    // optimistic update
    setItems((prev) =>
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
    } catch (err) {
      console.warn('Reaction failed:', err);
      load();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={{ width: 32 }} />
        <SplashLogo size={32} color={colors.text} />
        <Pressable
          onPress={() => {
            if (!user) {
              router.push('/auth/create-account');
              return;
            }
            router.push('/(tabs)/profile');
          }}
          hitSlop={10}
        >
          <View style={styles.avatar}>
            <PersonIcon size={20} color={colors.text} />
          </View>
        </Pressable>
      </View>

      <View style={styles.tabs}>
        {(['trending', 'near', 'list'] as Tab[]).map((t) => (
          <Pressable
            key={t}
            onPress={() => {
              if (t === 'list' && !requireAuth(user, 'see your list')) return;
              setTab(t);
            }}
            style={styles.tab}
          >
            <Text style={[styles.tabLabel, tab === t && styles.tabActive]}>
              {t === 'trending' ? 'Trending' : t === 'near' ? 'Near you' : 'My list'}
            </Text>
            {tab === t && <View style={styles.underline} />}
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.empty}>
          <ActivityIndicator color={colors.text} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No splashes yet</Text>
          <Text style={styles.emptyBody}>
            {tab === 'list'
              ? 'Star someone you like or sync your contacts to see splashes from people you know.'
              : tab === 'near'
              ? 'No splashes near you right now.'
              : 'Be the first to share a thought.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => it.id}
          renderItem={({ item }) => (
            <StatusCard
              status={item}
              onDrop={() => onReact(item, 'drop')}
              onStar={() => onReact(item, 'star')}
              onPress={() => router.push(`/status/${item.id}`)}
            />
          )}
          contentContainerStyle={{ paddingTop: spacing.md, paddingBottom: spacing.xxl }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.text}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
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
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: spacing.md, position: 'relative' },
  tabLabel: { ...type.bodyBold, color: colors.textMuted },
  tabActive: { color: colors.text },
  underline: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: -1,
    height: 2,
    backgroundColor: colors.text,
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.sm },
  emptyTitle: { ...type.title, color: colors.text },
  emptyBody: { ...type.body, color: colors.textMuted, textAlign: 'center' },
});
