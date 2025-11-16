// frontend/components/AnimationControls.tsx

import React from 'react';
import { View, Button } from 'react-native';
import Slider from '@react-native-community/slider';

interface AnimationControlsProps {
  isPathLoaded: boolean;
  isPlaying: boolean;
  animationProgress: number;
  onTogglePlayPause: () => void;
  onProgressChange: (value: number) => void;
}

export function AnimationControls(props: AnimationControlsProps) {
  const {
    isPathLoaded,
    isPlaying,
    animationProgress,
    onTogglePlayPause,
    onProgressChange,
  } = props;

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
        justifyContent: 'space-between',
        gap: 10,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 5,
          flex: 1,
        }}
      >
        <View style={{ width: 70 }}>
          <Button
            title={isPlaying ? 'Pause' : 'Play'}
            onPress={onTogglePlayPause}
          />
        </View>
        <Slider
          style={{ height: 40, width: 200 }}
          minimumValue={0}
          maximumValue={0.99} // Avoids looping to 0
          step={0.01}
          value={animationProgress}
          onValueChange={onProgressChange}
          minimumTrackTintColor={'#00aaffff'}
          maximumTrackTintColor={'#0083c4ff'}
          thumbTintColor={'#00b9e2ff'}
        />
      </View>
    </View>
  );
}