import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { View, useWindowDimensions } from 'react-native';
import Animated, { useSharedValue, withTiming, useAnimatedStyle } from 'react-native-reanimated';
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

  // REACTIVE DIMENSIONS
  const SCREEN_W = width;
  const SCREEN_H = height;
  
  const [registry, setRegistry] = useState<Record<string, string>>(initialRegistry);

  const USABLE_H = SCREEN_H;

  const ghostOpacity = useSharedValue(0);
  const ghostMode = useSharedValue<'swap' | 'stack'>('swap');
  const ghostDim = useSharedValue({ x: 0, y: 0, w: 0, h: 0 });

  const getSlotDims = useCallback((slotId: string) => {
    const sideW = 270;
    const gap = 12;
    
    const hasRightSidebar = Object.values(registry).includes('RIGHT');
    const hasLeftSidebar = Object.values(registry).includes('LEFT');
    
    const occupiedWidth = (hasLeftSidebar ? sideW + gap : 0) + (hasRightSidebar ? sideW + gap : 0);
    const mainW = SCREEN_W - occupiedWidth;
    const leftOffset = hasLeftSidebar ? sideW + gap : 0;
    
    const bottomH = USABLE_H * 0.35;

    switch (slotId) {
      case 'LEFT': 
        return { x: 0, y: 0, w: sideW, h: USABLE_H };
      case 'RIGHT': 
        return { x: SCREEN_W - sideW, y: 0, w: sideW, h: USABLE_H };
      case 'TOP_MAIN': 
        const isFullH = !Object.values(registry).includes('BOTTOM_MAIN');
        return { 
          x: leftOffset, 
          y: 0, 
          w: mainW, 
          h: isFullH ? USABLE_H : USABLE_H - bottomH - gap 
        };
      case 'BOTTOM_MAIN':
        return { 
          x: leftOffset, 
          y: USABLE_H - bottomH, 
          w: mainW, 
          h: bottomH 
        };
      default: 
        return { x: 0, y: 0, w: 0, h: 0 };
    }
  }, [SCREEN_W, USABLE_H, registry]);

  const updateGhost = useCallback((absX: number, absY: number, isDragging: boolean) => {
    'worklet';
    if (!isDragging) { ghostOpacity.value = withTiming(0); return; }

    const STACK_ZONE = 60; 
    const relativeY = absY;

    if (absX < STACK_ZONE || absX > SCREEN_W - STACK_ZONE) {
      ghostMode.value = 'stack';
      ghostDim.value = { x: absX < STACK_ZONE ? 0 : SCREEN_W - 8, y: 0, w: 8, h: USABLE_H };
    } else {
      ghostMode.value = 'swap';
      
      let targetId = 'TOP_MAIN';
      if (absX < 300) {
        targetId = 'LEFT';
      } else if (absX > SCREEN_W - 300 && Object.values(registry).includes('RIGHT')) {
        targetId = 'RIGHT';
      } else if (relativeY > USABLE_H * 0.6) {
        targetId = 'BOTTOM_MAIN';
      }
      
      ghostDim.value = getSlotDims(targetId);
    }
    ghostOpacity.value = withTiming(1);
  }, [SCREEN_W, USABLE_H, registry, getSlotDims]);

  const requestSwap = useCallback((id: string, absX: number, absY: number) => {
    const relativeY = absY;

    if (absX < 60 || absX > SCREEN_W - 60) {
      setRegistry(prev => ({ ...prev, [id]: absX < 60 ? 'LEFT' : 'RIGHT' }));
      return;
    }
    setRegistry(prev => {
      const nextSlot = absX < 300 
        ? 'LEFT' 
        : (absX > SCREEN_W - 300 && Object.values(prev).includes('RIGHT') 
            ? 'RIGHT' 
            : (relativeY > USABLE_H * 0.6 ? 'BOTTOM_MAIN' : 'TOP_MAIN'));
            
      const occupant = Object.keys(prev).find(k => prev[k] === nextSlot && k !== id);
      if (occupant) return { ...prev, [id]: nextSlot, [occupant]: prev[id] };
      return { ...prev, [id]: nextSlot };
    });
  }, [SCREEN_W, USABLE_H]);

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
    <LayoutContext.Provider value={{ theme, registry, requestSwap, updateGhost, getSlotDims }}>
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        {children}
        <Animated.View pointerEvents="none" style={[ghostStyle, { position: 'absolute', zIndex: 999 }]} />
      </View>
    </LayoutContext.Provider>
  );
}

export const useLayout = () => useContext(LayoutContext);