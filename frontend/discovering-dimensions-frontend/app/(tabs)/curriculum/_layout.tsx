import { Slot, usePathname, useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedBackground } from '@/components/themed-background';
import { View, Platform, ScrollView } from 'react-native';
import { OrderedList } from '@/components/text-list';

export default function CurriculumScreen() {
  const pathname = usePathname();
  const router = useRouter();

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
              Contents
            </ThemedText>
            <ThemedView>
              <ThemedText
                style={{
                  marginTop: 10,
                  pointerEvents: pathname === '/curriculum' ? 'none' : 'auto',
                }}
                type={pathname === '/curriculum' ? 'text' : 'link'}
                onPress={() => router.navigate('/curriculum')}
              >
                Introduction
              </ThemedText>
              <OrderedList>
                <ThemedText
                  style={{
                    pointerEvents:
                      pathname === '/curriculum/stage-1' ? 'none' : 'auto',
                  }}
                  type={pathname === '/curriculum/stage-1' ? 'text' : 'link'}
                  onPress={() => router.navigate('/curriculum/stage-1')}
                >
                  Introducing loss
                </ThemedText>
                <ThemedText
                  style={{
                    pointerEvents:
                      pathname === '/curriculum/stage-2' ? 'none' : 'auto',
                  }}
                  type={pathname === '/curriculum/stage-2' ? 'text' : 'link'}
                  onPress={() => router.navigate('/curriculum/stage-2')}
                >
                  Features of loss landscapes
                </ThemedText>
                <ThemedText
                  style={{
                    pointerEvents:
                      pathname === '/curriculum/stage-3' ? 'none' : 'auto',
                  }}
                  type={pathname === '/curriculum/stage-3' ? 'text' : 'link'}
                  onPress={() => router.navigate('/curriculum/stage-3')}
                >
                  Advanced loss landscape techniques
                </ThemedText>
              </OrderedList>
            </ThemedView>
          </ThemedView>
        </View>
        {/* Content slot */}
        <ScrollView>
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
