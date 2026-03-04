import * as React from 'react';
import {
  Pressable,
  View,
  ViewStyle,
  TextStyle,
  StyleProp,
  ActivityIndicator,
  Platform,
  Text,
} from 'react-native';
import { useTheme } from './theme-provider';

export type ButtonVariant =
  | 'default'
  | 'destructive'
  | 'outline'
  | 'secondary'
  | 'ghost'
  | 'link';
export type ButtonSize = 'default' | 'sm' | 'ssm' | 'lg' | 'icon';

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  onPress?: (e: any) => void;
  asChild?: boolean;
  children:
    | React.ReactNode
    | ((args: {
        pressed: boolean;
        hovered: boolean;
        focused: boolean;
        disabled: boolean;
      }) => React.ReactNode);
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const sizeStyles = {
  default: { height: 40, px: 16, gap: 8 },
  ssm: { height: 24, px: 8, gap: 4 },
  sm: { height: 32, px: 12, gap: 6 },
  lg: { height: 48, px: 24, gap: 8 },
  icon: { height: 40, width: 40, px: 0, gap: 0 },
};

export function Button({
  variant = 'default',
  size = 'default',
  disabled,
  loading,
  style,
  textStyle,
  onPress,
  asChild,
  children,
  leftIcon,
  rightIcon,
}: ButtonProps) {
  const { theme } = useTheme(); //  Hook added inside
  const [hovered, setHovered] = React.useState(false);
  const [focused, setFocused] = React.useState(false);

  const isDisabled = disabled || loading;
  const sz = sizeStyles[size];

  //  Moved inside to access theme safely
  const getVariantColors = () => {
    switch (variant) {
      case 'destructive':
        return {
          bg: theme.colors.destructive,
          text: '#ffffff',
          hoverBg: theme.colors.destructive + 'D9',
        };
      case 'outline':
        return {
          bg: 'transparent',
          text: theme.colors.foreground,
          hoverBg: theme.colors.buttonHover,
          border: theme.colors.border,
        };
      case 'secondary':
        return {
          bg: theme.colors.secondary,
          text: theme.colors.secondaryForeground,
          hoverBg: theme.colors.secondary + 'CC',
        };
      case 'ghost':
        return {
          bg: 'transparent',
          text: theme.colors.foreground,
          hoverBg: theme.colors.buttonHover,
        };
      case 'link':
        return {
          bg: 'transparent',
          text: theme.colors.primary,
          hoverBg: 'transparent',
        };
      default:
        return {
          bg: theme.colors.primary,
          text: theme.colors.primaryForeground,
          hoverBg: theme.colors.primary + 'D9',
        };
    }
  };

  const colors = getVariantColors();

  return (
    <Pressable
      disabled={isDisabled}
      onPress={onPress}
      onHoverIn={() => Platform.OS === 'web' && setHovered(true)}
      onHoverOut={() => Platform.OS === 'web' && setHovered(false)}
      // onFocus={() => Platform.OS === "web" && setFocused(true)}
      // onBlur={() => Platform.OS === "web" && setFocused(false)}
      style={({ pressed }) => {
        // Fix: Hover should only show if not pressed.
        // Focus (the sticky highlight) is handled separately now.
        const isCurrentlyActive = (hovered || pressed) && !isDisabled;

        const base: any = {
          height: variant === 'link' ? undefined : sz.height,
          width: size === 'icon' ? sz.icon : undefined,
          paddingHorizontal: size === 'icon' || variant === 'link' ? 0 : sz.px,
          borderRadius: theme.radius.md,
          backgroundColor: isCurrentlyActive ? colors.hoverBg : colors.bg,
          borderWidth: variant === 'outline' ? 1 : 0,
          borderColor: (colors as any).border || 'transparent',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: isDisabled ? 0.5 : 1,
          gap: sz.gap,
          ...(Platform.OS === 'web' && {
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            transition: 'all 150ms ease',
            outlineStyle: 'none', // Prevents the default browser blue ring
          }),
        };

        // Focus Ring: Only shows when tabbed into or clicked on Web
        if (focused && !isDisabled && Platform.OS === 'web') {
          base.boxShadow = `0 0 0 2px ${theme.colors.background}, 0 0 0 4px ${theme.colors.ring}`;
        }

        return [base, style];
      }}
    >
      {({ pressed }) => {
        const state = { pressed, hovered, focused, disabled: isDisabled };
        if (asChild && typeof children === 'function')
          return <>{children(state)}</>;

        const label =
          typeof children === 'function' ? (
            children(state)
          ) : (
            <Text
              style={[
                {
                  color: colors.text,
                  fontWeight: '600',
                  fontSize: 14,
                  textDecorationLine:
                    variant === 'link' && (hovered || focused)
                      ? 'underline'
                      : 'none',
                  display: 'flex',
                  alignItems: 'center',
                },
                textStyle,
              ]}
            >
              {children}
            </Text>
          );

        return (
          <View
            style={{ flexDirection: 'row', alignItems: 'center', gap: sz.gap }}
          >
            {loading ? (
              <ActivityIndicator size='small' color={colors.text} />
            ) : (
              leftIcon
            )}
            {label}
            {rightIcon}
          </View>
        );
      }}
    </Pressable>
  );
}
