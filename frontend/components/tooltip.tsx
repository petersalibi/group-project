import React, { useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useTheme } from './theme-provider';
import { Text } from './text';

export interface TooltipProps {
  children: React.ReactNode;
  tip: string;
  position?: 'top' | 'bottom';
}

export function Tooltip({ children, tip, position = 'top' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const { theme, isDark } = useTheme();
  const brandAccent = isDark ? theme.colors.accent : theme.colors.secondary;
  const brandForeground = isDark
    ? theme.colors.accentForeground
    : theme.colors.secondaryForeground;

  const showTooltip = () => setIsVisible(true);
  const hideTooltip = () => setIsVisible(false);

  const tooltipBg = brandAccent;
  const tooltipTextColor = brandForeground;
  const borderColor = theme.colors.border;

  const hoverProps = Platform.select({
    web: {
      onMouseEnter: showTooltip,
      onMouseLeave: hideTooltip,
    },
    default: {
      onTouchStart: showTooltip,
      onTouchEnd: hideTooltip,
    },
  });

  const positionStyles =
    position === 'top'
      ? { bottom: '100%' as const, marginBottom: 8 }
      : { top: '100%' as const, marginTop: 8 };

  return (
    <View style={styles.container} {...hoverProps}>
      {children}

      {isVisible && (
        <Animated.View
          pointerEvents='none'
          entering={FadeIn.duration(150)}
          exiting={FadeOut.duration(150)}
          style={[
            styles.tooltipBox,
            positionStyles,
            {
              backgroundColor: tooltipBg,
              borderColor: borderColor,
            },
          ]}
        >
          <Text style={[styles.tooltipText, { color: tooltipTextColor }]}>
            {tip}
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 99,
  },
  tooltipBox: {
    position: 'absolute',
    alignSelf: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    boxShadow: '0 2px 3.84px rgba(0, 0, 0, 0.25)',
    elevation: 5,
    zIndex: 9999,
    minWidth: 80,
    alignItems: 'center',
  },
  tooltipText: {
    fontSize: 11,
    fontWeight: '400',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});
