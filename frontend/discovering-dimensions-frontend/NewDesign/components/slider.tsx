// ./components/ui/slider.tsx
import * as React from "react";
import RNSlider from "@react-native-community/slider";
import { useTheme } from "./theme-provider";
 
export function Slider({ value, defaultValue, min = 0, max = 100, onValueChange, ...props }: any) {
  const { theme } = useTheme();
    return (
    <RNSlider
      style={{ width: "100%", height: 40 }}
      minimumValue={min}
      maximumValue={max}
      value={value ?? defaultValue?.[0] ?? 0}
      onValueChange={onValueChange}
      minimumTrackTintColor={theme.colors.primary}
      maximumTrackTintColor={theme.colors.muted}
      thumbTintColor={theme.colors.primary}
      {...props}
    />
  );
}