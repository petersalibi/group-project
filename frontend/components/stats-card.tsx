import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "./theme-provider";
 
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

  const statusColor = color || theme.colors.frenchBlue;
  const secondaryColor = subColor || theme.colors.mutedForeground;

  const ValueNode = (
    <Text style={{ 
      fontSize: 25, 
      fontWeight: "700", 
      color: statusColor,
      marginVertical: 2,
    }}>
      {value}
    </Text>
  );

  const SubTextNode = subText ? (
    <Text style={{ 
      fontSize: 15, 
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
      padding: 12, 
      minHeight: 80,
      zIndex: 1,
      overflow: 'visible',
    }}>
      <Text style={{ 
        fontSize: 9, 
        fontWeight: "700", 
        color: theme.colors.mutedForeground, 
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginBottom: 8,
      }}>
        {label}
      </Text>

      <View style={{
        flex: 1, 
        flexDirection: 'row', 
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        alignContent: 'center',
        columnGap: 12,
        rowGap: 4,
      }}>
        <View style={{ flexShrink: 0 }}>
          {ValueNode}
        </View>

        <View style={{ flexShrink: 0 }}>
          {SubTextNode}
        </View>
      </View>
    </View>
  );
}