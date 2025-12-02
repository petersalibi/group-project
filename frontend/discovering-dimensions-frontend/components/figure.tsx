import { View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Image, useImage } from 'expo-image';
import React from 'react';

interface FigureProps {
  img: string;
  thumbhash?: string; // Thumbhash for placeholder
  width?: number;
  capWidth?: number;
  aspectRatio?: number;
  caption?: string | React.ReactNode;
}

export default function Figure({
  img,
  width,
  capWidth,
  aspectRatio,
  caption,
}: FigureProps) {
  const image = useImage(img);

  return (
    <View
      style={{
        width: '100%',
        maxWidth: width ?? 600,
        flexDirection: 'column',
        alignItems: 'center',
        alignSelf: 'center',
        marginTop: 20,
        marginBottom: 20,
      }}
    >
      <Image
        style={{
          maxWidth: width ?? 600,
          width: '100%',
          aspectRatio:
            image?.width && image?.height
              ? image.width / image.height
              : aspectRatio,
          alignSelf: 'center',
          marginBottom: 10,
        }}
        source={img}
        contentFit='contain'
      />
      {caption && (
        <ThemedText type='caption' style={{ maxWidth: capWidth ?? 600 }}>
          {caption}
        </ThemedText>
      )}
    </View>
  );
}
