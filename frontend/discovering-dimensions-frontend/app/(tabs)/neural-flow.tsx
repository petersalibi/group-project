import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedBackground } from '@/components/themed-background';

export default function NeuralFlowScreen() {
  return (
    <ThemedBackground style={{ flex: 1, padding: 20, alignItems: 'center' }}>
      <ThemedView
        style={{ flex: 1, alignItems: 'center', padding: 20, borderRadius: 10 }}
      >
        <ThemedText>Neural flow visualization.</ThemedText>
      </ThemedView>
    </ThemedBackground>
  );
}
