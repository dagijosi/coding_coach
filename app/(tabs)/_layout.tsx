import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ColorValue } from 'react-native';

import { useTheme } from '@/theme';

type IconName = keyof typeof Ionicons.glyphMap;

function tabIcon(focusedName: IconName, outlineName: IconName) {
  return function TabBarIcon({
    color,
    size,
    focused,
  }: {
    color: ColorValue;
    size: number;
    focused: boolean;
  }) {
    return (
      <Ionicons
        name={focused ? focusedName : outlineName}
        size={size}
        color={color}
      />
    );
  };
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarActiveTintColor: colors.accent.primary,
        tabBarInactiveTintColor: colors.text.muted,

        tabBarStyle: {
          backgroundColor: colors.background.secondary,
          borderTopColor: colors.border.default,
          height: 56 + insets.bottom,
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 8),
        },

        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: tabIcon('home', 'home-outline'),
        }}
      />

      <Tabs.Screen
        name="learn"
        options={{
          title: 'Learn',
          tabBarIcon: tabIcon('book', 'book-outline'),
        }}
      />

      <Tabs.Screen
        name="problems"
        options={{
          title: 'Problems',
          tabBarIcon: tabIcon('code-slash', 'code-slash-outline'),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Me',
          tabBarIcon: tabIcon('person', 'person-outline'),
        }}
      />
    </Tabs>
  );
}
