import React, { useEffect } from 'react';
import { View, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, runOnJS } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useLayout } from './docking-provider';
import { Text } from '../components/text';

export function DockPanel({ 
  id, 
  title, 
  headerRight,
  isMaximized = false,
  isDraggable = true, // Default to true so other lessons don't break
  children 
}: { 
  id: string, 
  title?: string | React.ReactNode,
  headerRight?: React.ReactNode,
  isMaximized: boolean,
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

  const animatedStyle = useAnimatedStyle(() => {
    if (isMaximized) {
      return {
        width: '100%' as any, 
        height: '100%' as any,
        top: 0,
        left: 0,
        transform: [{ translateX: 0 }, { translateY: 0 }] as any,
        zIndex: 9999,
      };
    }

    // Otherwise, return normal docking styles
    return {
      width: width.value, height: height.value,
      transform: [{ translateX: x.value }, { translateY: y.value }] as any,
      zIndex: isDragging.value ? 1000 : 1,
      position: 'absolute' as any,
    };
  });

  const showHeader = typeof title === 'string' ? title.trim().length > 0 : Boolean(title);

  // Helper to render the title and optional right-aligned icon
  const headerContent = (
    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {typeof title === 'string' ? (
          <Text style={{ fontSize: 9, fontWeight: 'bold', color: theme.colors.mutedForeground }}>
            {title.toUpperCase()}
          </Text>
        ) : (
          title
        )}
      {headerRight && <View>{headerRight}</View>}
    </View>
  );

  return (
    <Animated.View style={[
      { backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, overflow: 'hidden' }, 
      animatedStyle
    ]}>
      {showHeader ? (
        isDraggable ? (
          <GestureDetector gesture={pan}>
            <View style={{ height: 32, backgroundColor: theme.colors.muted, paddingHorizontal: 12, justifyContent: 'center', borderBottomWidth: 1, borderColor: theme.colors.border }}>
              {headerContent}
            </View>
          </GestureDetector>
        ) : (
          <View style={{ height: 32, backgroundColor: theme.colors.muted, paddingHorizontal: 12, justifyContent: 'center', borderBottomWidth: 1, borderColor: theme.colors.border }}>
            {headerContent}
          </View>
        )
      ) : null}
      <View style={{ flex: 1 }}>{children}</View>
    </Animated.View>
  );
}