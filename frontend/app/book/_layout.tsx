import { Stack } from 'expo-router';

import { Colors } from '@/constants/Colors';

export default function BookLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: Colors.surface },
        headerTitleStyle: { fontWeight: '700', color: Colors.text },
        headerTintColor: Colors.primary,
        headerShadowVisible: false,
      }}>
      <Stack.Screen name="[id]" options={{ headerShown: false }} />
    </Stack>
  );
}
