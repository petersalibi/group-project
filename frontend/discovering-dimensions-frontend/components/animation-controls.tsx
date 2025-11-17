import React from 'react';
import { View, Button } from 'react-native';

interface AnimationControlsProps {
  isPathLoaded: boolean;
  isPlaying: boolean;
  onTogglePlayPause: () => void;
}

export function AnimationControls(props: AnimationControlsProps) {
  const { isPathLoaded, isPlaying, onTogglePlayPause } = props;

  if (!isPathLoaded) {
    return null;
  }

  return (
    <View
      style={{
        backgroundColor: '#2a74874d',
        padding: 10,
        borderRadius: 5,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <View style={{ width: 70 }}>
        <Button
          title={isPlaying ? 'Pause' : 'Play'}
          onPress={onTogglePlayPause}
        />
      </View>
    </View>
  );
}