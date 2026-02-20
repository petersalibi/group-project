import React, { useEffect } from 'react';
import { View, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, runOnJS } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useLayout } from './docking-provider';
import { Text } from '../components/text';

export function DockPanel({ id, title, isMaximized=false, children }: { id: string, title: string, isMaximized: boolean, children: React.ReactNode }) {
  const { theme, registry, requestSwap, updateGhost, getSlotDims } = useLayout();
  const isDragging = useSharedValue(false);
  
  const slot = getSlotDims(registry[id]);
  const tx = useSharedValue(slot.x);
  const ty = useSharedValue(slot.y);
  const tw = useSharedValue(slot.w);
  const th = useSharedValue(slot.h);

  // Lock coordinates during drag to prevent layout-jumps
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);

  useEffect(() => {
    if (!isDragging.value) {
      tx.value = withTiming(slot.x);
      ty.value = withTiming(slot.y);
      tw.value = withTiming(slot.w);
      th.value = withTiming(slot.h);
    }
  }, [slot, isDragging, tx, ty, tw, th]);

  const pan = Gesture.Pan()
    .onStart(() => { 
      isDragging.value = true;
      dragX.value = tx.value;
      dragY.value = ty.value;
    })
    .onUpdate((e) => {
      tx.value = dragX.value + e.translationX;
      ty.value = dragY.value + e.translationY;
      runOnJS(updateGhost)(e.absoluteX, e.absoluteY, true);
    })
    .onEnd((e) => {
      isDragging.value = false;
      runOnJS(updateGhost)(0, 0, false);
      runOnJS(requestSwap)(id, e.absoluteX, e.absoluteY);
    });

  const animStyle = useAnimatedStyle(() => {
    if (isMaximized) {
      return {
        width: '100%', 
        height: '100%',
        top: 0,
        left: 0,
        transform: [{ translateX: 0 }, { translateY: 0 }],
        zIndex: 9999,
      };
    }

    // Otherwise, return normal docking styles
    return {
      width: tw.value, height: th.value,
      transform: [{ translateX: tx.value }, { translateY: ty.value }] as any,
      zIndex: isDragging.value ? 1000 : 1,
      position: 'absolute',
    };
  });

  return (
    <Animated.View style={[{ backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, overflow: 'hidden' }, animStyle]}>
      <GestureDetector gesture={pan}>
        <View style={{ height: 32, backgroundColor: theme.colors.muted, paddingHorizontal: 12, justifyContent: 'center', borderBottomWidth: 1, borderColor: theme.colors.border }}>
          <Text style={{ fontSize: 9, fontWeight: 'bold', color: theme.colors.mutedForeground }}>{title.toUpperCase()}</Text>
        </View>
      </GestureDetector>
      <View style={{ flex: 1 }}>{children}</View>
    </Animated.View>
  );
}