import React, { useEffect } from 'react';
import { View, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, runOnJS } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useLayout } from './docking-provider';
import { Text } from '../components/text';

export function DockPanel({ 
  id, 
  title, 
  isDraggable = true, // Default to true so other lessons don't break
  children 
}: { 
  id: string, 
  title: string, 
  isDraggable?: boolean, 
  children: React.ReactNode 
}) {
  const { theme, registry, requestSwap, updateGhost, getSlotDims } = useLayout();
  const isDragging = useSharedValue(false);
  const slot = getSlotDims(registry[id]);

  const x = useSharedValue(slot.x);
  const y = useSharedValue(slot.y);
  const width = useSharedValue(slot.w);
  const height = useSharedValue(slot.h);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

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
    .enabled(isDraggable) // THIS IS THE KEY: If false, dragging stops working
    .onStart(() => { 
      isDragging.value = true;
      startX.value = x.value;
      startY.value = y.value;
    })
    .onUpdate((e) => {
      x.value = startX.value + e.translationX;
      y.value = startY.value + e.translationY;
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
    transform: [{ translateX: x.value }, { translateY: y.value }] as any,
    zIndex: isDragging.value ? 1000 : 1,
    position: 'absolute',
  }));

  return (
    <Animated.View style={[
      { backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, overflow: 'hidden' }, 
      animatedStyle
    ]}>
      {/* If not draggable, we don't even wrap it in the detector */}
      {isDraggable ? (
        <GestureDetector gesture={pan}>
          <View style={{ height: 32, backgroundColor: theme.colors.muted, paddingHorizontal: 12, justifyContent: 'center', borderBottomWidth: 1, borderColor: theme.colors.border }}>
            <Text style={{ fontSize: 9, fontWeight: 'bold', color: theme.colors.mutedForeground }}>{title.toUpperCase()}</Text>
          </View>
        </GestureDetector>
      ) : (
        <View style={{ height: 32, backgroundColor: theme.colors.muted, paddingHorizontal: 12, justifyContent: 'center', borderBottomWidth: 1, borderColor: theme.colors.border }}>
          <Text style={{ fontSize: 9, fontWeight: 'bold', color: theme.colors.mutedForeground }}>{title.toUpperCase()}</Text>
        </View>
      )}
      <View style={{ flex: 1 }}>{children}</View>
    </Animated.View>
  );
}