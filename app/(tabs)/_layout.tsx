import { Tabs, useRouter } from 'expo-router';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { useAuth, requireAuth } from '@/lib/auth';
import { DropIcon, ListIcon, GlobeIcon } from '@/components/icons';
import { colors, type } from '@/theme/tokens';

function PostButton() {
  const router = useRouter();
  const { user } = useAuth();
  return (
    <Pressable
      onPress={() => {
        if (!requireAuth(user, 'post a splash')) return;
        router.push('/post');
      }}
      accessibilityLabel="New splash"
      accessibilityRole="button"
      style={styles.postWrap}
    >
      <View style={styles.postBtn}>
        <DropIcon size={28} color={colors.text} />
      </View>
    </Pressable>
  );
}

function TabLabel({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text style={[styles.label, focused ? styles.labelActive : null]}>{label}</Text>
  );
}

export default function TabsLayout() {
  const { loading } = useAuth();
  if (loading) return null;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.bar,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textDim,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color }) => <ListIcon size={24} color={color} />,
          tabBarLabel: ({ focused }) => <TabLabel label="Feed" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="post-fab"
        options={{
          tabBarButton: () => <PostButton />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          tabBarIcon: ({ color }) => <GlobeIcon size={24} color={color} />,
          tabBarLabel: ({ focused }) => <TabLabel label="Map" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.surface,
    borderTopWidth: 0,
    height: 88,
    paddingTop: 12,
    paddingBottom: 24,
  },
  postWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  postBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1.5,
    borderColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -16,
  },
  label: { ...type.small, color: colors.textDim, marginTop: 2 },
  labelActive: { color: colors.text, fontWeight: '600' },
});
