import { ThemedBackground } from '@/components/themed-background';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function SettingsScreen() {
  return (
    <ThemedBackground style={{ flex: 1, padding: 20, alignItems: 'center' }}>
      <ThemedView
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: 10,
          padding: 20,
        }}
      >
        <ThemedText type='title' style={{ marginBottom: 20 }}>
          Settings
        </ThemedText>
        <ThemedText style={{ marginBottom: 10 }}>
          Here you can adjust your application settings.
        </ThemedText>
        {/* Close button */}
        <ThemedText style={{ marginTop: 20 }} onPress={() => {}}>
          Save changes
        </ThemedText>
      </ThemedView>
    </ThemedBackground>
  );
}
