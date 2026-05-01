import * as React from "react";
import { View, Pressable, Platform, ViewStyle, StyleProp } from "react-native";
import { useTheme } from "./theme-provider";
import { Text } from "./text";

export type BadgeVariant = "default" | "secondary" | "destructive" | "outline";
 
export type BadgeProps = {
  variant?: BadgeVariant;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: any;
  leftIcon?: React.ReactNode;
  children: React.ReactNode;
};

export function Badge({
  variant = "default",
  onPress,
  style,
  textStyle,
  leftIcon,
  children,
}: BadgeProps) {
  const { theme } = useTheme();

  const isWeb = Platform.OS === "web";
  const [hovered, setHovered] = React.useState(false);
  const [focused, setFocused] = React.useState(false);

  const getColors = () => {
    switch (variant) {
      case "secondary":
        return {
          bg: theme.colors.secondary,
          text: theme.colors.secondaryForeground,
          border: "transparent",
          hoverBg: theme.colors.secondary,
        };
      case "destructive":
        return {
          bg: theme.colors.destructive,
          text: theme.colors.destructiveForeground,
          border: "transparent",
          hoverBg: theme.colors.destructive,
        };
      case "outline":
        return {
          bg: "transparent",
          text: theme.colors.foreground,
          border: theme.colors.border,
          hoverBg: theme.colors.accent,
        };
      case "default":
      default:
        return {
          bg: theme.colors.primary,
          text: theme.colors.primaryForeground,
          border: "transparent",
          hoverBg: theme.colors.primary,
        };
    }
  };

  const colors = getColors();
  const Container: any = onPress ? Pressable : View;

  return (
    <Container
      data-slot="badge"
      accessibilityRole={onPress ? "button" : undefined}
      onPress={onPress}
      onHoverIn={isWeb && onPress ? () => setHovered(true) : undefined}
      onHoverOut={isWeb && onPress ? () => setHovered(false) : undefined}
      onFocus={isWeb && onPress ? () => setFocused(true) : undefined}
      onBlur={isWeb && onPress ? () => setFocused(false) : undefined}
      style={[
        {
          alignSelf: "flex-start",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
          borderRadius: 6,
          borderWidth: variant === "outline" ? 1 : 0,
          borderColor: colors.border,
          backgroundColor: hovered && onPress ? colors.hoverBg : colors.bg,
          paddingHorizontal: 8,
          paddingVertical: 2,
          ...(isWeb && onPress
            ? ({ cursor: "pointer", outlineStyle: "none" } as any)
            : null),
        },
        focused && onPress
          ? ({
              boxShadow: `0 0 0 2px ${theme.colors.background}, 0 0 0 4px ${theme.colors.ring}`,
            } as any)
          : null,
        style,
      ]}
    >
      {leftIcon ? <View style={{ marginTop: 0 }}>{leftIcon}</View> : null}

      <Text
        style={[
          {
            fontSize: 12,
            fontWeight: "600",
            color: colors.text,
          },
          textStyle,
        ]}
        numberOfLines={1}
      >
        {children}
      </Text>
    </Container>
  );
}