import React from 'react';
import { View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, runOnJS } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useLayout } from './docking-provider';
import { Text } from '../components/text';

export function DockPanel({ 
  id, 
  title, 
  headerRight,
  isMaximized = false,
  isDraggable = true,
  children 
}: { 
  id: string, 
  title?: string | React.ReactNode,
  headerRight?: React.ReactNode,
  isMaximized: boolean,
  isDraggable?: boolean, 
  children: React.ReactNode 
}) {
  // Extract the sizing variables from our context
  const { theme, registry, requestSwap, updateGhost, getSlotDims, isResizing, leftBarWidth, rightBarWidth, bottomBarHeight } = useLayout();
  
  const isDragging = useSharedValue(false);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);

  const pan = Gesture.Pan()
    .enabled(isDraggable)
    .onStart(() => { 
      isDragging.value = true;
      const slot = getSlotDims(registry[id], registry);
      startX.value = slot.x;
      startY.value = slot.y;
      dragX.value = slot.x;
      dragY.value = slot.y;
    })
    .onUpdate((e) => {
      dragX.value = startX.value + e.translationX;
      dragY.value = startY.value + e.translationY;
      runOnJS(updateGhost)(e.absoluteX, e.absoluteY, true);
    })
    .onEnd((e) => {
      isDragging.value = false;
      runOnJS(updateGhost)(0, 0, false);
      runOnJS(requestSwap)(id, e.absoluteX, e.absoluteY);
    });

  const animatedStyle = useAnimatedStyle(() => {
    // 1. DUMMY READS: This is the magic fix! By accessing these values, Reanimated 
    // knows it MUST re-run this style block every frame that a lozenge is dragged.
    leftBarWidth.value;
    rightBarWidth.value;
    bottomBarHeight.value;

    if (isMaximized) {
      return {
        width: '100%' as any, height: '100%' as any, top: 0, left: 0,
        transform: [{ translateX: 0 }, { translateY: 0 }] as any,
        zIndex: 9999, position: 'absolute' as any,
      };
    }

    const target = getSlotDims(registry[id], registry);
    const isCollapsed = target.w === 0 || target.h === 0;

    // 2. If grabbing the header to drag the panel across the screen
    if (isDragging.value) {
      return {
        width: target.w, height: target.h,
        transform: [{ translateX: dragX.value }, { translateY: dragY.value }] as any,
        zIndex: 1000, position: 'absolute' as any,
      };
    }

    // 3. Smooth Swap vs Instant Resize: 
    // If we are actively dragging a lozenge, jump instantly to the new value.
    // If we just swapped panels, smoothly animate the transition!
    const animConfig = { duration: 250 };
    const x = isResizing.value ? target.x : withTiming(target.x, animConfig);
    const y = isResizing.value ? target.y : withTiming(target.y, animConfig);
    const w = isResizing.value ? target.w : withTiming(target.w, animConfig);
    const h = isResizing.value ? target.h : withTiming(target.h, animConfig);

    return {
      width: w, height: h,
      transform: [{ translateX: x }, { translateY: y }] as any,
      zIndex: 1, position: 'absolute' as any,
      opacity: isCollapsed ? 0 : 1, // Completely hide if crushed to 0
      pointerEvents: isCollapsed ? 'none' : 'auto',
    };
  });

  const showHeader = typeof title === 'string' ? title.trim().length > 0 : Boolean(title);

  const headerContent = (
    <View style={{ flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center' }}>
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