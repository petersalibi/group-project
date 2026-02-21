import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "./theme-provider";
 
interface StatsCardProps {
  value: string;
  label: string;
  color?: string;
  subText?: string;  // New: For the "↓ 12%" or status labels
  subColor?: string; // New: To color the subtext (e.g., green for positive change)
}

export function StatsCard({ value, label, color, subText, subColor }: StatsCardProps) {
  const { theme } = useTheme();

  // Primary value color (defaults to theme French Blue)
  const statusColor = color || theme.colors.frenchBlue;
  // Subtext color (defaults to muted foreground if not provided)
  const secondaryColor = subColor || theme.colors.mutedForeground;

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
      <Text style={{ 
        fontSize: 28, 
        fontWeight: "700", 
        color: statusColor,
        marginVertical: 2,
      }}>
        {value}
      </Text>

      {/* Bottom Subtext (Trend/Status) */}
      {subText && (
        <Text style={{ 
          fontSize: 10, 
          fontWeight: "600", 
          color: secondaryColor,
        }}>
          {subText}
        </Text>
      )}
    </View>
  );
}