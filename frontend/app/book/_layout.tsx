import { Stack } from 'expo-router';

import { useTheme } from '@/context/ThemeContext';

export default function BookLayout() {
  const { theme } = useTheme();
  const { colors } = theme;

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: {
          fontFamily: theme.fonts.bold,
          color: colors.text,
        },
        headerTintColor: colors.primary,
        headerShadowVisible: false,
      }}>
      <Stack.Screen name="[id]" options={{ headerShown: false }} />
    </Stack>
  );
}
