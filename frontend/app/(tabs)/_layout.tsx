import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { ColorValue, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { font } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

type TabIconName = keyof typeof Ionicons.glyphMap;

function TabIcon({
  name,
  focused,
  color,
  activeBg,
}: {
  name: TabIconName;
  focused: boolean;
  color: ColorValue;
  activeBg: string;
}) {
  return (
    <View style={[styles.iconWrap, focused && { backgroundColor: activeBg }]}>
      <Ionicons name={name} size={22} color={color} />
    </View>
  );
}

export default function TabLayout() {
  const { logout } = useAuth();
  const { theme } = useTheme();
  const { colors, radius, shadow } = theme;
  const insets = useSafeAreaInsets();
  const tabBarHeight = 64 + (Platform.OS === 'ios' ? insets.bottom : 12);

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        headerTitleStyle: {
          fontFamily: theme.fonts.bold,
          fontSize: 18,
          color: colors.text,
        },
        headerShadowVisible: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarShowLabel: true,
        tabBarLabelStyle: [styles.tabLabel, font('semiBold')],
        tabBarStyle: {
          height: tabBarHeight,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : 12,
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          ...shadow.tabBar,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name="home"
              focused={focused}
              color={color}
              activeBg={colors.tabIconActiveBg}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'My Library',
          headerShown: false,
          tabBarLabel: 'Library',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name="library"
              focused={focused}
              color={color}
              activeBg={colors.tabIconActiveBg}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Add Book',
          tabBarLabel: 'Search',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name="search"
              focused={focused}
              color={color}
              activeBg={colors.tabIconActiveBg}
            />
          ),
          headerRight: () => (
            <Pressable
              onPress={logout}
              style={[styles.headerAction, { backgroundColor: colors.background }]}>
              <Text style={[styles.headerActionText, font('semiBold'), { color: colors.primary }]}>
                Log out
              </Text>
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Statistics',
          headerShown: false,
          tabBarLabel: 'Stats',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name="stats-chart"
              focused={focused}
              color={color}
              activeBg={colors.tabIconActiveBg}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  iconWrap: {
    width: 40,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  headerAction: {
    marginRight: 16,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  headerActionText: {
    fontSize: 14,
  },
});
