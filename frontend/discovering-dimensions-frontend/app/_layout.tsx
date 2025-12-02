import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import Head from 'expo-router/head';

import { ThemeProvider } from '@/components/theme-provider';

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
    '/curriculum/explanations': 'Explanations of key concepts | Curriculum',
    '/landscape': 'Landscape Viewer',
    '/help': 'Help',
    '/about': 'About',
    '/settings': 'Settings',
  };

  return (
    <ThemeProvider>
      {Platform.OS === 'web' && (
        <Head>
          <title>{titleMap[path] + ' | Discovering Dimensions'}</title>
        </Head>
      )}
      <Stack>
        <Stack.Screen name='(tabs)' options={{ headerShown: false }} />
      </Stack>
      <StatusBar style='dark' />
    </ThemeProvider>
  );
}
