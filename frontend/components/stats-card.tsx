import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "./theme-provider";
import { Tooltip } from "./tooltip";
 
interface StatsCardProps {
  value: string;
  label: string;
  color?: string;
  subText?: string;
  subColor?: string;
  valueTooltip?: string;
  subTextTooltip?: string;
}

export function StatsCard({ value, label, color, subText, subColor, valueTooltip, subTextTooltip }: StatsCardProps) {
  const { theme } = useTheme();

  // Primary value color (defaults to theme French Blue)
  const statusColor = color || theme.colors.frenchBlue;
  // Subtext color (defaults to muted foreground if not provided)
  const secondaryColor = subColor || theme.colors.mutedForeground;

  const ValueNode = (
    <Text style={{ 
      fontSize: 20, 
      fontWeight: "700", 
      color: statusColor,
      marginVertical: 2,
    }}>
      {value}
    </Text>
  );

  const SubTextNode = subText ? (
    <Text style={{ 
      fontSize: 10, 
      fontWeight: "600", 
      color: secondaryColor,
    }}>
      {subText}
    </Text>
  ) : null;

  return (
    <View style={{
      flex: 1,
      backgroundColor: theme.colors.card,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: 12, // Fixed padding for consistency in small slots
      justifyContent: "space-between", // Pushes label to top and subtext to bottom
      minHeight: 80,
      zIndex: 1,
      overflow: 'visible',
    }}>
      {/* Top Label */}
      <Text style={{ 
        fontSize: 9, 
        fontWeight: "700", 
        color: theme.colors.mutedForeground, 
        textTransform: "uppercase",
        letterSpacing: 0.5,
      }}>
        {label}
      </Text>

      {/* Main Metric Value */}
      <View style={{ width: '100%' }}>
        {valueTooltip ? (
          <Tooltip tip={valueTooltip}>
            {ValueNode}
          </Tooltip>
        ) : (
          ValueNode
        )}
      </View>

      {/* Bottom Subtext (Trend/Status) */}
      <View style={{ width: '100%' }}>
        {subTextTooltip && subText ? (
          <Tooltip tip={subTextTooltip}>
            {SubTextNode}
          </Tooltip>
        ) : (
          SubTextNode
        )}
      </View>
    </View>
  );
}