import * as React from "react";
import { View, ViewStyle, StyleProp } from "react-native";
import { useTheme } from "./theme-provider";
import { Text } from "./text";
 
type BaseProps = {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function Card({ children, style }: BaseProps) {
  const { theme } = useTheme();
  return (
    <View 
      style={[
        {
          backgroundColor: theme.colors.card, // Use card color instead of background
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          borderColor: theme.colors.border,
          flexDirection: "column",
          overflow: "hidden",
          ...theme.shadows.soft, // Optional: add that nice shadow we defined
        }, 
        style
      ]}
    >
      {children}
    </View>
  );
}

export function CardHeader({ children, style }: BaseProps) {
  return (
    <View 
      style={[
        {
          paddingHorizontal: 24,
          paddingTop: 24,
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 6,
        }, 
        style
      ]}
    >
      <View style={{ flex: 1, gap: 6 }}>
        {children}
      </View>
    </View>
  );
}

export function CardTitle({ children, style }: BaseProps) {
  const { theme } = useTheme();
  return (
    <Text 
      style={[
        {
          fontSize: 18,
          fontWeight: "600",
          color: theme.colors.foreground,
        }, 
        style
      ]}
    >
      {children}
    </Text>
  );
}

export function CardDescription({ children, style }: BaseProps) {
  const { theme } = useTheme();
  return (
    <Text 
      style={[
        {
          fontSize: 14,
          color: theme.colors.mutedForeground,
        }, 
        style
      ]}
    >
      {children}
    </Text>
  );
}

export function CardContent({ children, style }: BaseProps) {
  return (
    <View 
      style={[
        {
          paddingHorizontal: 24,
          paddingTop: 12, // Add a little space between header and content
          paddingBottom: 24,
        }, 
        style
      ]}
    >
      {children}
    </View>
  );
}

export function CardFooter({ children, style }: BaseProps) {
  return (
    <View 
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 24,
          paddingBottom: 24,
          gap: 12,
        }, 
        style
      ]}
    >
      {children}
    </View>
  );
}

// CardAction is usually just a wrapper for a Button or Icon
export function CardAction({ children, style }: BaseProps) {
  return (
    <View style={[{ alignSelf: "flex-start" }, style]}>
      {children}
    </View>
  );
}