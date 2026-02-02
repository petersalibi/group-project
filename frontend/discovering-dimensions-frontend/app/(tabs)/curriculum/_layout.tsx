import { Slot, usePathname, useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedBackground } from '@/components/themed-background';
import { View, Platform, ScrollView } from 'react-native';
import { useEffect, useRef } from 'react';

export default function CurriculumScreen() {
  const pathname = usePathname();
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  // Scroll to top whenever route changes
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [pathname]);

  return (
    <ThemedBackground style={{ flex: 1, alignItems: 'center' }}>
      <View
        style={{
          // If desktop, row, else column
          flexDirection: Platform.OS === 'web' ? 'row' : 'column',
          flex: 1,
          width: '100%',
        }}
      >
        {/* Sidebar */}
        <View>
          <ThemedView
            style={{
              position: 'sticky',
              minWidth: 180,
              maxWidth: 230,
              top: 0,
              padding: 20,
              borderRadius: 10,
              margin: Platform.OS === 'web' ? 20 : 0,
            }}
          >
            <ThemedText
              style={{
                fontWeight: '700',
                fontSize: Platform.OS === 'web' ? 30 : 24,
                marginBottom: 10,
              }}
            >
              Roadmap
            </ThemedText>
            <ThemedView>
              <View
                style={{
                  marginLeft: 2,
                  paddingLeft: 10,
                  borderLeftWidth: 2,
                  borderLeftColor: '#ccc',
                }}
              >
                {[
                  { label: 'Overview', route: '/curriculum/overview' },
                  { label: 'Introducing loss', route: '/curriculum/stage-1' },
                  {
                    label: 'Features of loss landscapes',
                    route: '/curriculum/stage-2',
                  },
                  {
                    label: 'Advanced loss landscape techniques',
                    route: '/curriculum/stage-3',
                  },
                ].map((item) => (
                  <View
                    key={item.route}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginTop: 10,
                    }}
                  >
                    <View
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 8,
                        backgroundColor:
                          pathname === item.route ? '#007AFF' : '#ccc',
                        marginLeft: -18,
                        marginRight: 12,
                        outlineStyle: 'solid',
                        outlineWidth: 2,
                        outlineColor: pathname === item.route ? '#ccc' : '#999',
                      }}
                    />
                    <ThemedText
                      style={{
                        pointerEvents:
                          pathname === item.route ? 'none' : 'auto',
                        maxWidth: 180,
                      }}
                      type={
                        pathname === item.route ? 'text' : 'linknounderline'
                      }
                      onPress={() => router.push(item.route)}
                    >
                      {item.label}
                    </ThemedText>
                  </View>
                ))}
              </View>
            </ThemedView>
          </ThemedView>
        </View>
        {/* Content slot */}
        <ScrollView ref={scrollRef}>
          <ThemedView
            style={{
              marginTop: 20,
              marginBottom: 20,
              marginLeft: Platform.OS === 'web' ? 0 : 20,
              marginRight: 20,
              padding: 20,
              borderRadius: 10,
            }}
          >
            <Slot />
          </ThemedView>
        </ScrollView>
      </View>
    </ThemedBackground>
  );
}
