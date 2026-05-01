import * as React from "react";
import { View, ViewStyle, StyleProp } from "react-native";
import { useTheme } from "./theme-provider";
import { Text } from "./text";

type AlertVariant = "default" | "destructive";

export type AlertProps = {
  variant?: AlertVariant;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  icon?: React.ReactNode;
};

function Alert({ variant = "default", style, children, icon }: AlertProps) {
  const { theme } = useTheme();
  const isDestructive = variant === "destructive";

  return (
    <View
      accessibilityRole="alert"
      style={[
        {
          width: "100%",
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          borderColor: isDestructive ? theme.colors.destructive : theme.colors.border,
          backgroundColor: theme.colors.card,
          paddingHorizontal: 16,
          paddingVertical: 12,
          flexDirection: "row",
          alignItems: "flex-start",
          gap: 12,
        },
        style,
      ]}
    >
      {icon ? <View style={{ marginTop: 2 }}>{icon}</View> : null}
      <View style={{ flex: 1, gap: 4 }}>
        {children}
      </View>
    </View>
  );
}

function AlertTitle({ style, children }: { style?: any; children: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <Text
      style={[
        {
          fontSize: 14,
          fontWeight: theme.typography.weightMedium,
          letterSpacing: 0.1,
          color: theme.colors.foreground,
        },
        style,
      ]}
      numberOfLines={1}
    >
      {children}
    </Text>
  );
}

function AlertDescription({ style, children }: { style?: any; children: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <Text
      style={[
        {
          fontSize: 14,
          color: theme.colors.mutedForeground,
          lineHeight: 20,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export { Alert, AlertTitle, AlertDescription };