import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Status } from '@/lib/statuses';
import { DropIcon, StarIcon } from './icons';
import { colors, radii, spacing, type } from '@/theme/tokens';

type Props = {
  status: Status;
  onDrop?: () => void;
  onStar?: () => void;
  onPress?: () => void;
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function StatusCard({ status, onDrop, onStar, onPress }: Props) {
  const initials = (status.username || '?').slice(0, 1).toUpperCase();

  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.header}>
        {status.avatar_url ? (
          <Image source={{ uri: status.avatar_url }} style={styles.avatarImg} />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.initial}>{initials}</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{status.username || 'Anonymous'}</Text>
          <Text style={styles.meta}>
            {timeAgo(status.created_at)}
            {status.lat != null && status.lng != null
              ? ` · within ${status.radius_km} km`
              : ''}
          </Text>
        </View>
      </View>

      {status.body ? <Text style={styles.body}>{status.body}</Text> : null}

      {status.photo_url ? (
        <Image source={{ uri: status.photo_url }} style={styles.photo} resizeMode="cover" />
      ) : null}

      <View style={styles.reactions}>
        <Pressable
          onPress={(e) => {
            e.stopPropagation?.();
            onDrop?.();
          }}
          style={styles.reactBtn}
          hitSlop={8}
        >
          <DropIcon size={20} color={colors.text} filled={status.reacted_drop} />
          <Text style={styles.count}>{status.drop_count ?? 0}</Text>
        </Pressable>
        <Pressable
          onPress={(e) => {
            e.stopPropagation?.();
            onStar?.();
          }}
          style={styles.reactBtn}
          hitSlop={8}
        >
          <StarIcon size={20} color={colors.text} filled={status.reacted_star} />
          <Text style={styles.count}>{status.star_count ?? 0}</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceElevated,
  },
  initial: { ...type.bodyBold, color: colors.text },
  name: { ...type.bodyBold, color: colors.text },
  meta: { ...type.small, color: colors.textMuted },
  body: { ...type.body, color: colors.text, fontSize: 18, lineHeight: 26 },
  photo: {
    width: '100%',
    aspectRatio: 1.5,
    borderRadius: radii.md,
    backgroundColor: colors.bg,
  },
  reactions: { flexDirection: 'row', gap: spacing.lg },
  reactBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  count: { ...type.caption, color: colors.text },
});
