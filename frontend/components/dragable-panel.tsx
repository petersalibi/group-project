import React, { useEffect } from 'react';
import { View, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, runOnJS } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useLayout } from './docking-provider';
import { Text } from '../components/text';

export function DockPanel({ id, title, children }: { id: string, title: string, children: React.ReactNode }) {
  const { theme, registry, requestSwap, updateGhost, getSlotDims } = useLayout();
  const isDragging = useSharedValue(false);
  
  const slot = getSlotDims(registry[id]);

  // Matching the names from your screenshot
  const x = useSharedValue(slot.x);
  const y = useSharedValue(slot.y);
  const width = useSharedValue(slot.w);
  const height = useSharedValue(slot.h);

  useEffect(() => {
    if (!isDragging.value) {
      const config = { duration: 250 };
      x.value = withTiming(slot.x, config);
      y.value = withTiming(slot.y, config);
      width.value = withTiming(slot.w, config);
      height.value = withTiming(slot.h, config);
    }
  }, [slot, isDragging.value]);

  const pan = Gesture.Pan()
    .onStart(() => { isDragging.value = true; })
    .onUpdate((e) => {
      x.value = e.translationX + slot.x;
      y.value = e.translationY + slot.y;
      runOnJS(updateGhost)(e.absoluteX, e.absoluteY, true);
    })
    .onEnd((e) => {
      isDragging.value = false;
      runOnJS(updateGhost)(0, 0, false);
      runOnJS(requestSwap)(id, e.absoluteX, e.absoluteY);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    width: width.value,
    height: height.value,
    transform: [
      { translateX: x.value }, // Used x.value to match your screenshot
      { translateY: y.value }  // Used y.value to match your screenshot
    ] as any, // Cast as any to fix the TS error from your screenshot
    zIndex: isDragging.value ? 1000 : 1,
    position: 'absolute',
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[
        { 
          backgroundColor: theme.colors.card, 
          borderWidth: 1, 
          borderColor: theme.colors.border, 
          borderRadius: theme.radius.md, 
          overflow: 'hidden',
          ...theme.shadows.soft 
        }, 
        animatedStyle
      ]}>
        <View style={{ 
          height: 32, 
          backgroundColor: theme.colors.muted, 
          paddingHorizontal: 12, 
          justifyContent: 'center', 
          borderBottomWidth: 1, 
          borderColor: theme.colors.border 
        }}>
          <Text style={{ fontSize: 9, fontWeight: 'bold', color: theme.colors.mutedForeground }}>
            {title.toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>{children}</View>
      </Animated.View>
    </GestureDetector>
  );
}