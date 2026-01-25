import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedBackground } from '@/components/themed-background';
import { Platform } from 'react-native';

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
        <ThemedView style={{ marginBottom: 20 }}>
          <ThemedText
            style={{
              fontWeight: '700',
              fontSize: Platform.OS === 'web' ? 40 : 25,
              textAlign: 'center',
            }}
          >
            Help
          </ThemedText>
        </ThemedView>
        <ThemedText type='text'>How to use this app.</ThemedText>
      </ThemedView>
    </ThemedBackground>
  );
}
