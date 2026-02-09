import * as React from "react";
import { Pressable, Animated, Platform } from "react-native";
import { useTheme } from "./theme-provider";
 
export function Switch({ checked, onCheckedChange }: { checked: boolean; onCheckedChange?: (val: boolean) => void }) {
  //  1. Plug into the theme
  const { theme } = useTheme();
  const thumbAnim = React.useRef(new Animated.Value(checked ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.spring(thumbAnim, {
      toValue: checked ? 1 : 0,
      useNativeDriver: false, // Colors and layout properties don't support native driver in standard Animated
      friction: 10,
      tension: 100,
    }).start();
  }, [checked]);

  const translateX = thumbAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 16], // Adjusted for 36px width
  });

  const backgroundColor = thumbAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.muted, theme.colors.primary],
  });

  return (
    <Pressable 
      onPress={() => onCheckedChange?.(!checked)}
      style={({ hovered }: any) => [
        { opacity: hovered ? 0.9 : 1 } // Web hover feedback
      ]}
    >
      <Animated.View style={[
        {
          width: 32,
          height: 18,
          borderRadius: 10,
          justifyContent: "center",
          borderWidth: 1,
          borderColor: checked ? theme.colors.primary : theme.colors.border,
          backgroundColor: backgroundColor,
        }, 
      ]}>
        <Animated.View style={[
          {
            width: 14,
            height: 14,
            borderRadius: 7,
            backgroundColor: "white",
            ...theme.shadows.soft, // Add your theme's soft shadow
            transform: [{ translateX }],
          }
        ]} />
      </Animated.View>
    </Pressable>
  );
}