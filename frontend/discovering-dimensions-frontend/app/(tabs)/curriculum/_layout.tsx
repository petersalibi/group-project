import { Link, Slot } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedBackground } from '@/components/themed-background';
import { View, Platform, ScrollView } from 'react-native';
import { OrderedList } from '@/components/text-list';

export default function CurriculumScreen() {
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
              Chapters
            </ThemedText>
            <ThemedView>
              <Link href='/curriculum' style={{ marginTop: 10 }}>
                <ThemedText type='link'>Introduction</ThemedText>
              </Link>
              <OrderedList>
                <Link href='/curriculum/stage-1'>
                  <ThemedText type='link'>Introducing loss</ThemedText>
                </Link>
                <Link href='/curriculum/stage-2'>
                  <ThemedText type='link'>
                    Features of loss landscapes
                  </ThemedText>
                </Link>
                <Link href='/curriculum/stage-3'>
                  <ThemedText type='link'>
                    Advanced loss landscape techniques
                  </ThemedText>
                </Link>
              </OrderedList>
              <Link href='/curriculum/explanations' style={{ marginTop: 10 }}>
                <ThemedText type='link'>
                  Explanations of key concepts
                </ThemedText>
              </Link>
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
