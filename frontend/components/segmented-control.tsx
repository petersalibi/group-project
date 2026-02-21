import React from "react";
import { View, Text, Pressable } from "react-native";
import { useTheme } from "./theme-provider";
 
interface SegmentedControlProps {
  options: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
}

export function SegmentedControl({ options, selectedIndex, onChange }: SegmentedControlProps) {
  //  1. Plug into the theme
  const { theme } = useTheme();

  return (
    <View style={{
      flexDirection: "row",
      backgroundColor: theme.colors.muted,
      borderRadius: theme.radius.md,
      padding: 2,
      marginVertical: theme.spacing.sm,
    }}>
      {options.map((option, index) => {
        const isActive = selectedIndex === index;
        return (
          <Pressable
            key={option}
            onPress={() => onChange(index)}
            style={{
              flex: 1,
              paddingVertical: 8,
              backgroundColor: isActive ? theme.colors.card : "transparent",
              borderRadius: theme.radius.sm,
              // Apply soft shadow only to the active "sliding" part
              ...(isActive ? theme.shadows.soft : {}),
              alignItems: "center",
            }}
          >
            <Text style={{
              fontSize: 12,
              fontWeight: theme.typography.weightMedium,
              color: isActive ? theme.colors.foreground : theme.colors.mutedForeground,
            }}>
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}