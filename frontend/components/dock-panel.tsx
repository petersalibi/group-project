import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, runOnJS, interpolate } from 'react-native-reanimated';
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
  const { theme, registry, requestSwap, updateGhost, getSlotDims, isResizing, leftBarWidth, rightBarWidth, bottomBarHeight, screenW, screenH } = useLayout();
  
  const isDragging = useSharedValue(false);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const slotX = useSharedValue(0);
  const slotY = useSharedValue(0);
  const slotW = useSharedValue(screenW);
  const slotH = useSharedValue(screenH);
  const maximizedProgress = useSharedValue(isMaximized ? 1 : 0);

  useEffect(() => {
    maximizedProgress.value = withTiming(isMaximized ? 1 : 0, { duration: 250 });
  }, [isMaximized]);

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
    leftBarWidth.value;
    rightBarWidth.value;
    bottomBarHeight.value;

    const target = getSlotDims(registry[id], registry);
    const isCollapsed = target.w === 0 || target.h === 0;
    const animConfig = { duration: 250 };

    let x: number, y: number, w: number, h: number;

    if (isDragging.value) {
      slotX.value = dragX.value;
      slotY.value = dragY.value;
      slotW.value = target.w;
      slotH.value = target.h;
    } else {
      slotX.value = isResizing.value
        ? target.x
        : withTiming(target.x, animConfig);
      slotY.value = isResizing.value
        ? target.y
        : withTiming(target.y, animConfig);
      slotW.value = isResizing.value
        ? target.w
        : withTiming(target.w, animConfig);
      slotH.value = isResizing.value
        ? target.h
        : withTiming(target.h, animConfig);
    }

    const p = maximizedProgress.value;

    const finalX = interpolate(p, [0, 1], [slotX.value, 0]);
    const finalY = interpolate(p, [0, 1], [slotY.value, 0]);
    const finalW = interpolate(p, [0, 1], [slotW.value, screenW]);
    const finalH = interpolate(p, [0, 1], [slotH.value, screenH]);

    return {
      width: finalW,
      height: finalH,
      transform: [{ translateX: finalX }, { translateY: finalY }],
      zIndex: p > 0 ? 9999 : (isDragging.value ? 1000 : 1),
      position: 'absolute' as const,
      opacity: isCollapsed && p === 0 ? 0 : 1,
      pointerEvents: (isCollapsed && p === 0) ? 'none' : 'auto',
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