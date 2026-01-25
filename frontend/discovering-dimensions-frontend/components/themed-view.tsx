import React, { useEffect, useRef } from 'react';
import { Animated, ViewProps } from 'react-native';
import { useTheme } from '@/components/theme-provider';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({
  style,
  lightColor = '#FFFFFF',
  darkColor = '#000000',
  ...otherProps
}: ThemedViewProps) {
  const { theme } = useTheme();

  // Animated value that drives color interpolation
  const animation = useRef(
    new Animated.Value(theme === 'light' ? 0 : 1),
  ).current;

  // Animate whenever theme changes
  useEffect(() => {
    Animated.timing(animation, {
      toValue: theme === 'light' ? 0 : 1,
      duration: 400, // adjust duration for faster/slower fade
      useNativeDriver: false, // color interpolation requires false
    }).start();
  }, [theme, animation]);

  // Interpolate background color between light and dark
  const backgroundColor = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [lightColor, darkColor],
  });

  return <Animated.View style={[{ backgroundColor }, style]} {...otherProps} />;
}
