import React from "react";
import { View, Text, Pressable } from "react-native";
import { useTheme } from "./theme-provider"; 
import { CheckCircle2, Lock } from "lucide-react-native";

interface LessonCardProps {
  title: string;
  description: string;
  status: "completed" | "available" | "locked";
  onPress?: () => void;
}

export function LessonCard({ title, description, status, onPress }: LessonCardProps) {
  //  1. ADD THIS LINE BACK IN:
  const { theme } = useTheme(); 
  
  const isLocked = status === "locked";

  return (
    <Pressable 
      onPress={onPress}
      disabled={isLocked}
      style={({ pressed }) => ({
        backgroundColor: theme.colors.card,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: theme.spacing.sm,
        flexDirection: "row",
        gap: theme.spacing.sm,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View style={{ 
        width: 40, 
        height: 40, 
        borderRadius: 20, 
        backgroundColor: isLocked ? theme.colors.muted : theme.colors.primary, 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        {isLocked ? (
          <Lock size={16} color={theme.colors.mutedForeground} />
        ) : (
          <CheckCircle2 size={16} color="white" />
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: "600", color: theme.colors.foreground }}>{title}</Text>
        <Text style={{ fontSize: 12, color: theme.colors.mutedForeground }}>{description}</Text>
      </View>
    </Pressable>
  );
}