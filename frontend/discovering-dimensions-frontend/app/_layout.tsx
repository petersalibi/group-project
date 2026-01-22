import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const path: string = usePathname();
  const titleMap: { [key: string]: string } = {
    '/': 'Home',
    '/curriculum': 'Introduction | Curriculum',
    '/curriculum/stage-1': 'Introducing loss | Curriculum',
    '/curriculum/stage-2': 'Features of loss landscapes | Curriculum',
    '/curriculum/stage-3': 'Advanced loss landscape techniques | Curriculum',
    '/landscape': 'Landscape Viewer',
    '/help': 'Help',
    '/about': 'About',
    '/settings': 'Settings',
  };

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name='(tabs)' options={{ headerShown: false }} />
      </Stack>
      <StatusBar style='dark' />
    </ThemeProvider>
  );
}
