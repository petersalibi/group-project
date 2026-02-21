import * as React from "react";
import {
  View,
  Pressable,
  Platform,
  ViewStyle,
  StyleProp,
  TextStyle,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "./theme-provider";
import { Text } from "./text";
 
export type BreadcrumbProps = {
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

export function Breadcrumb({ style, children }: BreadcrumbProps) {
  return (
    <View data-slot="breadcrumb" style={style}>
      {children}
    </View>
  );
}

export type BreadcrumbListProps = {
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

export function BreadcrumbList({ style, children }: BreadcrumbListProps) {
  return (
    <View
      data-slot="breadcrumb-list"
      style={[
        {
          flexDirection: "row",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 6,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export type BreadcrumbItemProps = {
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

export function BreadcrumbItem({ style, children }: BreadcrumbItemProps) {
  return (
    <View
      data-slot="breadcrumb-item"
      style={[{ flexDirection: "row", alignItems: "center", gap: 6 }, style]}
    >
      {children}
    </View>
  );
}

export type BreadcrumbLinkProps = {
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  children:
    | React.ReactNode
    | ((args: { hovered: boolean; focused: boolean }) => React.ReactNode);
};

export function BreadcrumbLink({
  onPress,
  disabled,
  style,
  textStyle,
  children,
}: BreadcrumbLinkProps) {
  const { theme } = useTheme(); //  Hook added
  const isWeb = Platform.OS === "web";
  const [hovered, setHovered] = React.useState(false);
  const [focused, setFocused] = React.useState(false);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      onHoverIn={() => isWeb && setHovered(true)}
      onHoverOut={() => isWeb && setHovered(false)}
      onFocus={() => isWeb && setFocused(true)}
      onBlur={() => isWeb && setFocused(false)}
      style={[
        {
          ...(isWeb && {
            cursor: disabled ? "not-allowed" : "pointer",
            outlineStyle: "none",
          } as any),
        },
        style,
      ]}
    >
      {typeof children === "function" ? (
        children({ hovered, focused })
      ) : (
        <Text
          style={[
            {
              fontSize: 14,
              color: hovered || focused 
                ? theme.colors.foreground 
                : theme.colors.mutedForeground,
              fontWeight: "500",
            },
            textStyle,
          ]}
        >
          {children}
        </Text>
      )}
    </Pressable>
  );
}

export type BreadcrumbPageProps = {
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  children: React.ReactNode;
};

export function BreadcrumbPage({ style, textStyle, children }: BreadcrumbPageProps) {
  const { theme } = useTheme(); //  Hook added
  return (
    <View data-slot="breadcrumb-page" style={style}>
      <Text
        style={[
          {
            color: theme.colors.foreground,
            fontWeight: "400",
            fontSize: 14,
          },
          textStyle,
        ]}
        numberOfLines={1}
      >
        {children}
      </Text>
    </View>
  );
}

export type BreadcrumbSeparatorProps = {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

export function BreadcrumbSeparator({ style, children }: BreadcrumbSeparatorProps) {
  const { theme } = useTheme(); //  Hook added
  return (
    <View
      style={[{ alignItems: "center", justifyContent: "center", paddingHorizontal: 4 }, style]}
    >
      {children ?? (
        <Text style={{ color: theme.colors.mutedForeground, fontSize: 14, opacity: 0.7 }}>
          |
        </Text>
      )}
    </View>
  );
}

export type BreadcrumbEllipsisProps = {
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  onPress?: () => void;
};

export function BreadcrumbEllipsis({ style, onPress }: BreadcrumbEllipsisProps) {
  const { theme } = useTheme(); //  Hook added
  const isWeb = Platform.OS === "web";
  const [hovered, setHovered] = React.useState(false);

  const Container = onPress ? (Pressable as any) : View;

  return (
    <Container
      onPress={onPress}
      onHoverIn={() => isWeb && onPress && setHovered(true)}
      onHoverOut={() => isWeb && onPress && setHovered(false)}
      style={[
        {
          width: 32,
          height: 32,
          borderRadius: 6,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: hovered ? theme.colors.muted : "transparent",
        },
        isWeb && onPress ? ({ cursor: "pointer" } as any) : null,
        style,
      ]}
    >
      <Feather name="more-horizontal" size={16} color={theme.colors.mutedForeground} />
    </Container>
  );
}