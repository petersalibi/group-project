import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  Pressable,
  Platform,
  type TextProps,
  Easing,
} from 'react-native';
import { useTheme } from '@/components/theme-provider';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?:
    | 'default'
    | 'text'
    | 'textBold'
    | 'textItalic'
    | 'title'
    | 'defaultSemiBold'
    | 'subheading'
    | 'subsubheading'
    | 'subsubsubheading'
    | 'link'
    | 'caption';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
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

  // Hover animation value (0 = normal, 1 = hovered)
  const hoverAnim = useRef(new Animated.Value(0)).current;

  // Reset hover animation and colour if link turns to text
  useEffect(() => {
    if (type !== 'link') {
      hoverAnim.stopAnimation();
      hoverAnim.setValue(0);
    }
  }, [hoverAnim, type]);

  // Animate underline + color on hover
  const animateHover = (toValue: number) => {
    Animated.timing(hoverAnim, {
      toValue,
      duration: 180,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  };

  const linkHoverEvents =
    type === 'link' && Platform.OS === 'web'
      ? {
          onHoverIn: () => {
            animateHover(1);
          },
          onHoverOut: () => {
            animateHover(0);
          },
        }
      : {};

  const hoverColor = hoverAnim.interpolate({
    inputRange: [0, 1],
    outputRange:
      theme === 'light'
        ? ['#005ef6ff', '#003e7dff'] // Slightly darker when hovered
        : ['#46d1ff', '#0095f1ff'],
  });

  // Special wrapper for links
  if (type === 'link') {
    return (
      <Pressable {...linkHoverEvents}>
        <Animated.Text
          style={[
            {
              color: animatedColor, // theme color base
              cursor: Platform.OS === 'web' ? 'pointer' : 'none',
              textDecorationLine: 'underline',
              textDecorationColor: hoverColor,
            },
            styles.link,
            style,
          ]}
          {...rest}
        >
          {/* Actual text with hover color applied */}
          <Animated.Text
            style={{
              color: hoverColor,
            }}
          >
            {rest.children}
          </Animated.Text>
        </Animated.Text>
      </Pressable>
    );
  }

  return (
    <Text
      style={[
        { color: animatedColor },
        type === 'default' && styles.default,
        type === 'text' && styles.text,
        type === 'textBold' && styles.textBold,
        type === 'textItalic' && styles.textItalic,
        type === 'title' && styles.title,
        type === 'defaultSemiBold' && styles.defaultSemiBold,
        type === 'subheading' && styles.subheading,
        type === 'subsubheading' && styles.subsubheading,
        type === 'subsubsubheading' && styles.subsubsubheading,
        type === 'caption' && styles.caption,
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
  text: {
    fontSize: 16,
    lineHeight: 26,
  },
  textBold: {
    fontSize: 16,
    lineHeight: 26,
    fontWeight: 'bold',
  },
  textItalic: {
    fontSize: 16,
    lineHeight: 26,
    fontStyle: 'italic',
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    lineHeight: 48,
  },
  subheading: {
    fontSize: 22,
    fontWeight: 'bold',
    lineHeight: 30,
    marginTop: 20,
  },
  subsubheading: {
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 28,
    marginTop: 18,
    marginBottom: 9,
  },
  subsubsubheading: {
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 24,
    marginTop: 16,
    marginBottom: 8,
  },
  link: {
    fontSize: 16,
    lineHeight: 26,
    color: '#46d1ffff',
  },
  caption: {
    fontSize: 14,
    lineHeight: 18,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
