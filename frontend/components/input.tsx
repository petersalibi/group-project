import * as React from 'react';
import { TextInput, Platform } from 'react-native';
import { useTheme } from './theme-provider'; // Adjust path if needed

export interface InputProps extends React.ComponentProps<typeof TextInput> {
  isInvalid?: boolean;
  disabled?: boolean;
}

export function Input({ style, isInvalid, disabled, ...props }: InputProps) {
  //  1. Call the hook inside the component
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = React.useState(false);

  return (
    <TextInput
      style={[
        {
          height: 40, // Increased slightly for better mobile touch targets
          width: '100%',
          borderRadius: theme.radius.md,
          borderWidth: 1,
          borderColor: isInvalid
            ? theme.colors.destructive
            : isFocused
              ? theme.colors.ring
              : theme.colors.border,
          backgroundColor: theme.colors.background,
          paddingHorizontal: 12,
          color: theme.colors.foreground,
          fontSize: 14,
          // Handle web-specific focus rings
          ...(Platform.OS === 'web' &&
            ({
              outlineStyle: 'none',
              //transition: "all 0.15s ease-in-out",
              boxShadow:
                isFocused && !isInvalid
                  ? `0 0 0 2px ${theme.colors.background}, 0 0 0 4px ${theme.colors.ring}40`
                  : 'none',
            } as any)),
        },
        style,
      ]}
      placeholderTextColor={theme.colors.mutedForeground}
      onFocus={(e) => {
        setIsFocused(true);
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        setIsFocused(false);
        props.onBlur?.(e);
      }}
      editable={!disabled}
      {...props}
    />
  );
}
