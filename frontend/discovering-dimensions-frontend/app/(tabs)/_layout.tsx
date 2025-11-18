import { Link, Tabs, usePathname } from 'expo-router';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/components/theme-provider';
import { StyleSheet, Platform, Image, Pressable, View } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import type { ComponentProps } from 'react';
import { useState } from 'react';

export default function TabLayout() {
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();

  const styles = StyleSheet.create({
    tab: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: 'transparent',
      cursor: 'pointer',
      backgroundColor: Colors[theme].button,
    },
  });
  // Shared hoverable tab component
  const HoverableTab = ({
    href,
    label,
    disabled = false,
  }: {
    href: ComponentProps<typeof Link>['href'];
    label: string;
    disabled?: boolean;
  }) => {
    const [hovered, setHovered] = useState(false);

    const hoverGesture = Gesture.Hover()
      .onBegin(() => !disabled && setHovered(true))
      .onEnd(() => !disabled && setHovered(false));

    const isActive = disabled;

    return (
      <Link
        href={disabled ? '/' : href} // Disable navigation
        style={{
          textDecorationLine: 'none',
          pointerEvents: disabled ? 'none' : 'auto', // Prevent clicks
        }}
      >
        <GestureDetector gesture={hoverGesture}>
          <ThemedView
            style={[
              styles.tab,
              {
                opacity: disabled ? 0.6 : 1,
                borderColor: isActive
                  ? Colors[theme].tint
                  : hovered
                    ? Colors[theme].tint
                    : 'transparent',
                backgroundColor: isActive
                  ? theme === 'light'
                    ? 'rgba(0,0,0,0.1)'
                    : 'rgba(255,255,255,0.15)'
                  : hovered
                    ? theme === 'light'
                      ? 'rgba(0,0,0,0.05)'
                      : 'rgba(255,255,255,0.1)'
                    : 'transparent',
              },
            ]}
          >
            <ThemedText>{label}</ThemedText>
          </ThemedView>
        </GestureDetector>
      </Link>
    );
  };
  // Default to a top nav bar on web
  if (Platform.OS === 'web') {
    return (
      <>
        <ThemedView
          style={{
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 20,
            width: '100%',
            flexDirection: 'row',
            borderBottomWidth: 1,
            gap: 16,
            maxHeight: 56,
            position: 'sticky',
            top: 0,
            zIndex: 1000,
          }}
        >
          {/* Logo and app name */}
          <Link href='/' style={{ textDecorationLine: 'none' }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Image
                style={{
                  width: 30,
                  height: 30,
                  marginRight: 8,
                }}
                source={require('@/assets/images/logo.svg')}
                resizeMode='contain'
              />
              <ThemedText
                style={{
                  fontSize: 25,
                  fontWeight: '700',
                }}
              >
                Discovering Dimensions
              </ThemedText>
            </View>
          </Link>
          {/* Navigation links */}
          <header style={{ display: 'flex', gap: 20 }}>
            <HoverableTab
              href='/landscape'
              label='Loss landscape'
              disabled={pathname === '/landscape'}
            />
            <HoverableTab
              href='/how-to'
              label='How-to'
              disabled={pathname === '/how-to'}
            />
            <HoverableTab
              href='/about'
              label='About'
              disabled={pathname === '/about'}
            />
          </header>
          {/* Theme toggle button */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <Pressable onPress={toggleTheme}>
              <IconSymbol
                name={theme === 'light' ? 'moon.fill' : 'sun.max.fill'}
                size={24}
                color={Colors[theme].text}
              />
            </Pressable>
            {/* Settings button */}
            <Link href='/settings'>
              <IconSymbol
                name='gearshape.fill'
                size={24}
                color={Colors[theme].text}
              />
            </Link>
          </View>
        </ThemedView>

        <Tabs
          screenOptions={{
            tabBarActiveTintColor: Colors[theme].tint,
            headerShown: false,
            // hide the native tab bar on web since we have a top nav
            tabBarStyle: { display: 'none' },
          }}
        >
          <Tabs.Screen name='index' options={{ title: 'Home' }} />
          <Tabs.Screen name='landscape' options={{ title: 'Loss landscape' }} />
          <Tabs.Screen name='neural-flow' options={{ title: 'Neural flow' }} />
          <Tabs.Screen name='about' options={{ title: 'About' }} />
        </Tabs>
      </>
    );
  } else {
    return (
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[theme].tint,
          headerShown: false,
          tabBarButton: HapticTab,
        }}
      >
        <Tabs.Screen
          name='index'
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name='house.fill' color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name='landscape'
          options={{
            title: 'Landscape',
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name='mountain.2.fill' color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name='about'
          options={{
            title: 'About',
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name='info.circle.fill' color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name='settings'
          options={{
            title: 'Settings',
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name='gearshape.fill' color={color} />
            ),
          }}
        />
      </Tabs>
    );
  }
}
