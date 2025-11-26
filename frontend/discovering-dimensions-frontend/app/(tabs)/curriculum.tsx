import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedBackground } from '@/components/themed-background';
import Markdown from 'react-native-markdown-display';

const content = `
# Curriculum

Here you can find the curriculum content for Discovering Dimensions.

## Chapters

1. Beginner
2. Intermediate
3. Advanced

`;

export default function CurriculumScreen() {
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
        <ThemedText style={{ fontSize: 16, lineHeight: 24 }}>
          <Markdown>{content}</Markdown>
        </ThemedText>
      </ThemedView>
    </ThemedBackground>
  );
}
