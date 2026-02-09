import * as React from "react";
import Svg, { Rect, Circle, Path, G } from "react-native-svg";
import { useTheme } from "../theme-provider"

type IconProps = {
  size?: number;
  color?: string;
  opacity?: number;
};
const { theme } = useTheme();


export function DataIcon({ size = 24, color = theme.colors.primary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="8" width="6" height="12" rx="1" fill={color} opacity="0.3" />
      <Rect x="9" y="4" width="6" height="16" rx="1" fill={color} opacity="0.6" />
      <Rect x="15" y="10" width="6" height="10" rx="1" fill={color} />
    </Svg>
  );
}

export function NetworkIcon({ size = 24, color = theme.colors.primary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="6" cy="12" r="2" fill={color} />
      <Circle cx="12" cy="6" r="2" fill={color} />
      <Circle cx="12" cy="18" r="2" fill={color} />
      <Circle cx="18" cy="12" r="2" fill={color} />
      <Path
        d="M8 12L10 6M8 12L10 18M14 6L16 12M14 18L16 12"
        stroke={color}
        strokeWidth="1.5"
        opacity="0.3"
      />
    </Svg>
  );
}

export function OptimizationIcon({ size = 24, color = theme.colors.primary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 20C3 20 6 16 12 16C18 16 21 20 21 20" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M12 16V4" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="12" cy="4" r="2" fill={color} />
    </Svg>
  );
}

export function VisualizationIcon({ size = 24, color = theme.colors.primary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="8" height="8" rx="1" fill={color} opacity="0.2" />
      <Rect x="13" y="3" width="8" height="8" rx="1" fill={color} opacity="0.4" />
      <Rect x="3" y="13" width="8" height="8" rx="1" fill={color} opacity="0.6" />
      <Rect x="13" y="13" width="8" height="8" rx="1" fill={color} />
    </Svg>
  );
}

export function LossIcon({ size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 18L8 13L12 17L21 8"
        stroke={theme.colors.primary}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="21" cy="8" r="2" fill="#C6F382" />
      <Circle cx="3" cy="18" r="2" fill={theme.colors.primary} />
    </Svg>
  );
}

export function ModelIcon({ size = 24, color = theme.colors.primary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3L20 7.5V16.5L12 21L4 16.5V7.5L12 3Z" fill={color} opacity="0.2" />
      <Path
        d="M12 3L20 7.5M12 3L4 7.5M12 3V12M20 7.5V16.5L12 21M20 7.5L12 12M4 7.5V16.5L12 21M4 7.5L12 12M12 12L12 21"
        stroke={color}
        strokeWidth="1.5"
      />
    </Svg>
  );
}