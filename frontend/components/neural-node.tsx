import React from "react";
import { View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Check, Lock } from "lucide-react-native";
import { useTheme } from "./theme-provider";
 
type NodeStatus = "completed" | "available" | "locked";

interface NeuralNodeProps {
  status: NodeStatus;
  label: string;
}

export function NeuralNode({ status, label }: NeuralNodeProps) {
  //  1. Call the hook inside the function
  const { theme } = useTheme();

  const isCompleted = status === "completed";
  const isAvailable = status === "available";
  const isLocked = status === "locked";

  // Dynamic colors based on your theme.ts
  const activeColor = theme.colors.frenchBlue;
  const textColor = isLocked ? theme.colors.mutedForeground : theme.colors.foreground;

  return (
    <View style={{ alignItems: "center", gap: theme.spacing.sm }}>
      <View style={{ width: 64, height: 64, justifyContent: "center", alignItems: "center" }}>
        
        {/* Glow / Halo Effect for Active/Completed nodes */}
        {!isLocked && (
          <View
            style={{
              position: "absolute",
              width: 74,
              height: 74,
              borderRadius: theme.radius.full,
              backgroundColor: activeColor,
              opacity: 0.15,
            }}
          />
        )}

        {/* Main Node Circle */}
        <LinearGradient
          colors={
            isCompleted
              ? [theme.colors.frenchBlue, theme.colors.oceanTwilight]
              : isAvailable
              ? [theme.colors.oceanTwilight, theme.colors.powderBlue]
              : [theme.colors.muted, theme.colors.border]
          }
          style={{
            width: 56,
            height: 56,
            borderRadius: theme.radius.full,
            borderWidth: 1,
            borderColor: isLocked ? theme.colors.border : "rgba(255,255,255,0.3)",
            justifyContent: "center",
            alignItems: "center",
            // Use your theme's soft shadow logic
            ...theme.shadows.soft,
          }}
        >
          {isCompleted && <Check size={24} color="white" strokeWidth={3} />}
          {isLocked && <Lock size={20} color={theme.colors.mutedForeground} />}
          {isAvailable && (
            <View 
              style={{ 
                width: 14, 
                height: 14, 
                borderRadius: 7, 
                backgroundColor: theme.colors.accent, // Changed to accent for a "Current" indicator
                borderWidth: 2,
                borderColor: "white"
              }} 
            />
          )}
        </LinearGradient>
      </View>

      {/* Label */}
      <Text
        style={{
          fontSize: 12,
          fontWeight: theme.typography.weightMedium,
          color: textColor,
          textAlign: "center",
        }}
      >
        {label}
      </Text>
    </View>
  );
}