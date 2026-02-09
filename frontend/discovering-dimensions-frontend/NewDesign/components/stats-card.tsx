import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "./theme-provider";
 
interface StatsCardProps {
  value: string;
  label: string;
  color?: string; // Optional color override
}

export function StatsCard({ value, label, color }: StatsCardProps) {
  const { theme } = useTheme();

  //  Set the default color inside the body where 'theme' exists
  const statusColor = color || theme.colors.frenchBlue;

  return (
    <View style={{
      flex: 1,
      backgroundColor: theme.colors.card,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: theme.spacing.md,
      alignItems: "center",
      justifyContent: "center",
      // Add the soft shadow from your theme for depth
      ...theme.shadows.soft,
    }}>
      <Text style={{ 
        fontSize: 24, 
        fontWeight: "700", 
        color: statusColor //  Uses the resolved color
      }}>
        {value}
      </Text>
      <Text style={{ 
        fontSize: 10, 
        color: theme.colors.mutedForeground, 
        textTransform: "uppercase",
        letterSpacing: 1,
        marginTop: 4,
        textAlign: "center"
      }}>
        {label}
      </Text>
    </View>
  );
}