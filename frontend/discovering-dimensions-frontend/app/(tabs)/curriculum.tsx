import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedBackground } from '@/components/themed-background';

export default function HelpScreen() {
  return (
    <ThemedBackground style={{ flex: 1, alignItems: 'center' }}>
      <ThemedView
        style={{
          marginTop: 20,
          marginBottom: 20,
          padding: 20,
          borderRadius: 10,
        }}
      >
        <ThemedView style={{ marginBottom: 10 }}>
          <ThemedText
            style={{ fontWeight: '700', fontSize: 40, textAlign: 'center' }}
          >
            Curriculum
          </ThemedText>
        </ThemedView>
        <ThemedView style={{ marginTop: 10 }}>
          <ThemedText>
            Here you can find the curriculum content for Discovering Dimensions.
          </ThemedText>
        </ThemedView>
      </ThemedView>
    </ThemedBackground>
  );
}
