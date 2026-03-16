import React, { createContext, useContext, useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, withTiming, useAnimatedStyle } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useTheme } from '../components/theme-provider';

const LayoutContext = createContext<any>(null);

export function LayoutManager({ 
  children, 
  width, 
  height,
  initialRegistry = {
    'CONFIG': 'LEFT', 
    'ENGINE': 'TOP_MAIN', 
    'STATS_GROUP': 'BOTTOM_MAIN'
  }
}: { 
  children: React.ReactNode; 
  width: number; 
  height: number;
  initialRegistry?: Record<string, string>;
}) {
  const { theme } = useTheme();

  const SCREEN_W = width;
  const SCREEN_H = height;
  const USABLE_H = SCREEN_H;
  
  const [registry, setRegistry] = useState<Record<string, string>>(initialRegistry);

  const leftBarWidth = useSharedValue(270);
  const rightBarWidth = useSharedValue(270);
  const bottomBarHeight = useSharedValue(USABLE_H * 0.35);
  const isResizing = useSharedValue(false);

  const startLeftWidth = useSharedValue(0);
  const panLeft = Gesture.Pan()
    .onStart(() => { 
      isResizing.value = true; 
      startLeftWidth.value = leftBarWidth.value;
    })
    .onUpdate((e) => {
      let newWidth = startLeftWidth.value + e.translationX;
      if (newWidth < 220) newWidth = 0; // Snap to hide
      else if (newWidth > SCREEN_W * 0.6) newWidth = SCREEN_W * 0.6;
      leftBarWidth.value = newWidth;
    })
    .onFinalize(() => { isResizing.value = false; });

  const startRightWidth = useSharedValue(0);
  const panRight = Gesture.Pan()
    .onStart(() => { 
      isResizing.value = true; 
      startRightWidth.value = rightBarWidth.value;
    })
    .onUpdate((e) => {
      let newWidth = startRightWidth.value - e.translationX;
      if (newWidth < 220) newWidth = 0; // Snap to hide
      else if (newWidth > SCREEN_W * 0.6) newWidth = SCREEN_W * 0.6;
      rightBarWidth.value = newWidth;
    })
    .onFinalize(() => { isResizing.value = false; });

  const startBottomHeight = useSharedValue(0);
  const panBottom = Gesture.Pan()
    .onStart(() => { 
      isResizing.value = true; 
      startBottomHeight.value = bottomBarHeight.value;
    })
    .onUpdate((e) => {
      let newHeight = startBottomHeight.value - e.translationY;
      if (newHeight < 120) newHeight = 0; // Snap to hide
      else if (newHeight > SCREEN_H * 0.8) newHeight = SCREEN_H * 0.8;
      bottomBarHeight.value = newHeight;
    })
    .onFinalize(() => { isResizing.value = false; });

  // --- 3. LAYOUT ENGINE ---
  const ghostOpacity = useSharedValue(0);
  const ghostMode = useSharedValue<'swap' | 'stack'>('swap');
  const ghostDim = useSharedValue({ x: 0, y: 0, w: 0, h: 0 });

  const getSlotDims = useCallback((slotId: string, currentRegistry: Record<string, string>) => {
    'worklet';
    const gap = 12;
    const isLeftVisible = Object.values(currentRegistry).includes('LEFT') && leftBarWidth.value > 0;
    const isRightVisible = Object.values(currentRegistry).includes('RIGHT') && rightBarWidth.value > 0;
    const isBottomVisible = Object.values(currentRegistry).includes('BOTTOM_MAIN') && bottomBarHeight.value > 0;
    
    const occupiedWidth = (isLeftVisible ? leftBarWidth.value + gap : 0) + (isRightVisible ? rightBarWidth.value + gap : 0);
    const mainW = SCREEN_W - occupiedWidth;
    const leftOffset = isLeftVisible ? leftBarWidth.value + gap : 0;
    
    switch (slotId) {
      case 'LEFT': 
        return { x: 0, y: 0, w: leftBarWidth.value, h: USABLE_H };
      case 'RIGHT': 
        return { x: SCREEN_W - rightBarWidth.value, y: 0, w: rightBarWidth.value, h: USABLE_H };
      case 'TOP_MAIN': 
        return { 
          x: leftOffset, 
          y: 0, 
          w: mainW, 
          h: isBottomVisible ? USABLE_H - bottomBarHeight.value - gap : USABLE_H 
        };
      case 'BOTTOM_MAIN':
        return { 
          x: leftOffset, 
          y: USABLE_H - bottomBarHeight.value, 
          w: mainW, 
          h: bottomBarHeight.value 
        };
      default: 
        return { x: 0, y: 0, w: 0, h: 0 };
    }
  }, [SCREEN_W, USABLE_H, leftBarWidth, rightBarWidth, bottomBarHeight]);

  const updateGhost = useCallback((absX: number, absY: number, isDragging: boolean) => {
    if (!isDragging) { ghostOpacity.value = withTiming(0); return; }

    const STACK_ZONE = 60; 
    if (absX < STACK_ZONE || absX > SCREEN_W - STACK_ZONE) {
      ghostMode.value = 'stack';
      ghostDim.value = { x: absX < STACK_ZONE ? 0 : SCREEN_W - 8, y: 0, w: 8, h: USABLE_H };
    } else {
      ghostMode.value = 'swap';
      let targetId = 'TOP_MAIN';
      if (absX < leftBarWidth.value + 40) {
        targetId = 'LEFT';
      } else if (absX > SCREEN_W - rightBarWidth.value - 40 && Object.values(registry).includes('RIGHT')) {
        targetId = 'RIGHT';
      } else if (absY > USABLE_H - bottomBarHeight.value - 40) {
        targetId = 'BOTTOM_MAIN';
      }
      ghostDim.value = getSlotDims(targetId, registry);
    }
    ghostOpacity.value = withTiming(1);
  }, [SCREEN_W, USABLE_H, registry, getSlotDims, leftBarWidth, rightBarWidth, bottomBarHeight]);

  const requestSwap = useCallback((id: string, absX: number, absY: number) => {
    if (absX < 60 || absX > SCREEN_W - 60) {
      setRegistry(prev => ({ ...prev, [id]: absX < 60 ? 'LEFT' : 'RIGHT' }));
      return;
    }
    setRegistry(prev => {
      const nextSlot = absX < leftBarWidth.value + 40 
        ? 'LEFT' 
        : (absX > SCREEN_W - rightBarWidth.value - 40 && Object.values(prev).includes('RIGHT') 
            ? 'RIGHT' 
            : (absY > USABLE_H - bottomBarHeight.value - 40 ? 'BOTTOM_MAIN' : 'TOP_MAIN'));
            
      const occupant = Object.keys(prev).find(k => prev[k] === nextSlot && k !== id);
      if (occupant) return { ...prev, [id]: nextSlot, [occupant]: prev[id] };
      return { ...prev, [id]: nextSlot };
    });
  }, [SCREEN_W, USABLE_H, leftBarWidth, rightBarWidth, bottomBarHeight]);

  const leftHandleStyle = useAnimatedStyle(() => ({ 
    left: leftBarWidth.value > 0 ? leftBarWidth.value - 10 : -10
  }));
  
  const rightHandleStyle = useAnimatedStyle(() => ({ 
    left: rightBarWidth.value > 0 ? SCREEN_W - rightBarWidth.value - 22 : SCREEN_W - 22
  }));
  
  const bottomHandleStyle = useAnimatedStyle(() => {
    const isLeftVisible = Object.values(registry).includes('LEFT') && leftBarWidth.value > 0;
    const isRightVisible = Object.values(registry).includes('RIGHT') && rightBarWidth.value > 0;
    
    const mainOffset = isLeftVisible ? leftBarWidth.value + 12 : 0;
    const mainWidth = SCREEN_W - (isLeftVisible ? leftBarWidth.value + 12 : 0) - (isRightVisible ? rightBarWidth.value + 12 : 0);
    
    return {
      top: bottomBarHeight.value > 0 ? USABLE_H - bottomBarHeight.value - 22 : USABLE_H - 22,
      left: mainOffset,
      width: mainWidth
    };
  });

  const ghostStyle = useAnimatedStyle(() => ({
    left: ghostDim.value.x,
    top: ghostDim.value.y,
    width: ghostDim.value.w,
    height: ghostDim.value.h,
    borderWidth: ghostMode.value === 'swap' ? 2 : 0,
    borderStyle: 'dashed' as any,
    borderColor: theme.colors.primary,
    backgroundColor: (ghostMode.value === 'swap' ? theme.colors.primary + '33' : theme.colors.primary),
    opacity: ghostOpacity.value,
  }));

  return (
    // WE ADDED THE THREE SIZE VARIABLES TO THE CONTEXT HERE
    <LayoutContext.Provider value={{ theme, registry, requestSwap, updateGhost, getSlotDims, isResizing, leftBarWidth, rightBarWidth, bottomBarHeight }}>
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        {children}
        
        {/* LEFT LOZENGE */}
        {Object.values(registry).includes('LEFT') && (
          <GestureDetector gesture={panLeft}>
            <Animated.View style={[styles.vHandleContainer, leftHandleStyle]}>
              <View style={[styles.vLozenge, { backgroundColor: theme.colors.border }]} />
            </Animated.View>
          </GestureDetector>
        )}

        {/* RIGHT LOZENGE */}
        {Object.values(registry).includes('RIGHT') && (
          <GestureDetector gesture={panRight}>
            <Animated.View style={[styles.vHandleContainer, rightHandleStyle]}>
              <View style={[styles.vLozenge, { backgroundColor: theme.colors.border }]} />
            </Animated.View>
          </GestureDetector>
        )}

        {/* BOTTOM LOZENGE */}
        {Object.values(registry).includes('BOTTOM_MAIN') && (
          <GestureDetector gesture={panBottom}>
            <Animated.View style={[styles.hHandleContainer, bottomHandleStyle]}>
              <View style={[styles.hLozenge, { backgroundColor: theme.colors.border }]} />
            </Animated.View>
          </GestureDetector>
        )}

        <Animated.View pointerEvents="none" style={[ghostStyle, { position: 'absolute', zIndex: 999 }]} />
      </View>
    </LayoutContext.Provider>
  );
}

const styles = StyleSheet.create({
  vHandleContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 32, // Large invisible hit-box
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'col-resize' as any
  },
  vLozenge: {
    width: 4,
    height: 32,
    borderRadius: 2,
  },
  hHandleContainer: {
    position: 'absolute',
    height: 32, // Large invisible hit-box
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'row-resize' as any
  },
  hLozenge: {
    width: 32,
    height: 4,
    borderRadius: 2,
  }
});

export const useLayout = () => useContext(LayoutContext);