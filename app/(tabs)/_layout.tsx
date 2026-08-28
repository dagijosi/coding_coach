import { Tabs } from 'expo-router';

import { FloatingDock } from '@/components/navigation';

export default function TabsLayout() {
  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' },
        }}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="learn" />
        <Tabs.Screen name="practice" />
        <Tabs.Screen name="profile" />
      </Tabs>

      <FloatingDock />
    </>
  );
}
