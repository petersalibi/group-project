import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, type TextProps } from 'react-native';
import { useTheme } from '@/components/theme-provider';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({
  style,
  lightColor = '#000',
  darkColor = '#fff',
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const { theme } = useTheme();

  // Animated value for color interpolation
  const animation = useRef(
    new Animated.Value(theme === 'light' ? 0 : 1),
  ).current;

  // Animate whenever theme changes
  useEffect(() => {
    Animated.timing(animation, {
      toValue: theme === 'light' ? 0 : 1,
      duration: 400,
      useNativeDriver: false, // colors require false
    }).start();
  }, [theme, animation]);

  // Interpolate text color
  const animatedColor = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [lightColor, darkColor],
  });

  return (
    <Animated.Text
      style={[
        { color: animatedColor },
        type === 'default' && styles.default,
        type === 'title' && styles.title,
        type === 'defaultSemiBold' && styles.defaultSemiBold,
        type === 'subtitle' && styles.subtitle,
        type === 'link' && styles.link,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    color: '#0a7ea4',
  },
});
