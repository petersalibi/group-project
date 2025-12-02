import { View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Image } from 'expo-image';

interface FigureProps {
  img: string;
  thumbhash?: string; // Thumbhash for placeholder
  width?: number;
  height?: number;
  aspectRatio?: number;
  caption?: string;
}

export default function Figure({
  img,
  width,
  height,
  aspectRatio,
  caption,
}: FigureProps) {
  return (
    <View
      style={{
        flexDirection: 'column',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 20,
      }}
    >
      <Image
        style={{
          maxWidth: width ?? 600,
          width: '100%',
          aspectRatio: width && height ? width / height : aspectRatio,
          height: height ?? undefined,
          alignSelf: 'center',
          marginBottom: 10,
        }}
        source={img}
        contentFit='contain'
      />
      {caption && <ThemedText type='caption'>{caption}</ThemedText>}
    </View>
  );
}
