import React from "react";
import { View, Text } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useTheme } from "./theme-provider";
 
interface CircularProgressProps {
  size?: number;
  strokeWidth?: number;
  progress: number; // 0 to 100
  label: string;
}

export function CircularProgress({ 
  size = 100, 
  strokeWidth = 10, 
  progress, 
  label 
}: CircularProgressProps) {
  //  1. Call the hook inside the function
  const { theme } = useTheme();

  // SVG Calculations
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <View style={{ alignItems: "center", justifyContent: "center", width: size, height: size }}>
      <Svg width={size} height={size}>
        {/* Background Circle (Track) */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.colors.muted} //  Uses theme safely
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress Circle (Indicator) */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.colors.frenchBlue} //  Uses theme safely
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {/* Inner Text Overlay */}
      <View style={{ position: "absolute", alignItems: "center" }}>
        <Text style={{ fontSize: 18, fontWeight: "700", color: theme.colors.foreground }}>
          {progress}%
        </Text>
        <Text style={{ fontSize: 8, color: theme.colors.mutedForeground, textTransform: "uppercase" }}>
          {label}
        </Text>
      </View>
    </View>
  );
}