import React from "react";
import { View } from "react-native";
import { Text } from "../components/text";
import { useTheme } from "../components/theme-provider";

export function Footer() {
  const { theme } = useTheme();

  return (
    <View style={{
      height: 28, // Slightly taller for better touch/visual clearance
      borderTopWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.muted,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 12,
    }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          {/* Status Indicator */}
          <View style={{ 
            width: 8, 
            height: 8, 
            borderRadius: 4, 
            backgroundColor: "#22c55e",
            shadowColor: "#22c55e",
            shadowOpacity: 0.5,
            shadowRadius: 4
          }} />
          <Text style={{ fontSize: 10, fontWeight: '600', color: theme.colors.mutedForeground }}>
            ENGINE READY
          </Text>
        </View>
        
        <Text style={{ fontSize: 10, color: theme.colors.mutedForeground, opacity: 0.7 }}>
          ID: BXSF-2026
        </Text>
      </View>

      <Text style={{ fontSize: 10, fontStyle: 'italic', color: theme.colors.mutedForeground }}>
        Discovering Dimensions
      </Text>
    </View>
  );
}