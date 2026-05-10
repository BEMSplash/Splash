// Placeholder route — never rendered. The tab entry uses a custom tabBarButton
// that navigates to the /post modal instead.
import { Redirect } from 'expo-router';
export default function PostFabPlaceholder() {
  return <Redirect href="/(tabs)" />;
}
