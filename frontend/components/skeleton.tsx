// ./components/skeleton.tsx
import React from "react";
import { View, ViewStyle } from "react-native";
import { useTheme } from "./theme-provider";
 
interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  variant?: "circle" | "rect";
  style?: ViewStyle;
}

export function Skeleton({ width, height, variant = "rect", style }: SkeletonProps) {
    const { theme } = useTheme();
    return (
    <View
      style={{
        width: width || "100%",
        height: height || 20,
        backgroundColor: theme.colors.muted,
        borderRadius: variant === "circle" ? theme.radius.full : theme.radius.sm,
        opacity: 0.6,
        ...style,
      }}
    />
  );
}