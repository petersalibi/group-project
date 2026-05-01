import * as React from 'react';
import { View, Animated, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from './theme-provider';

export type ProgressProps = {
  value?: number;
  style?: StyleProp<ViewStyle>;
  indicatorStyle?: StyleProp<ViewStyle>;
};

export function Progress({ value = 0, style, indicatorStyle }: ProgressProps) {
  const { theme } = useTheme();

  const progressAnim = React.useRef(new Animated.Value(value)).current;

  React.useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: value,
      useNativeDriver: false,
      friction: 8,
      tension: 40,
    }).start();
  }, [value]);

  const width = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <View
      data-slot='progress'
      style={[
        {
          height: 8,
          width: '100%',
          backgroundColor: theme.colors.muted,
          borderRadius: theme.radius.full,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        data-slot='progress-indicator'
        style={[
          {
            height: '100%',
            backgroundColor: theme.colors.primary,
            width: width,
          },
          indicatorStyle,
        ]}
      />
    </View>
  );
}
