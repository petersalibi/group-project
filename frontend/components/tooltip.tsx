import React, { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useTheme } from './theme-provider';
import { Text } from './text';

export interface TooltipProps {
  children: React.ReactNode;
  tip: string;
}

export function Tooltip({ children, tip }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const { theme } = useTheme();

  const showTooltip = () => setIsVisible(true);
  const hideTooltip = () => setIsVisible(false);

  const tooltipBg = theme.colors.card;
  const tooltipTextColor = theme.colors.primaryForeground;
  const borderColor = theme.colors.border;

  return (
    <View style={styles.container}>
      <Pressable
        onHoverIn={showTooltip}
        onHoverOut={hideTooltip}
        onPressIn={showTooltip}
        onPressOut={hideTooltip}
        delayHoverIn={200}
      >
        {children}
      </Pressable>

      {isVisible && (
        <Animated.View
          entering={FadeIn.duration(150)}
          exiting={FadeOut.duration(150)}
          style={[
            styles.tooltipBox,
            {
              backgroundColor: tooltipBg,
              borderColor: borderColor,
            }
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
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99, 
  },
  tooltipBox: {
    position: 'absolute',
    bottom: '100%', 
    marginBottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 9999, 
    minWidth: 80, 
    alignItems: 'center',
  },
  tooltipText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.5,
  }
});