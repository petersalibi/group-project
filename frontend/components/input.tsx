import * as React from 'react';
import { TextInput, Platform } from 'react-native';
import { useTheme } from './theme-provider';

export interface InputProps extends React.ComponentProps<typeof TextInput> {
  isInvalid?: boolean;
  disabled?: boolean;
}

export function Input({ style, isInvalid, disabled, ...props }: InputProps) {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = React.useState(false);

  return (
    <TextInput
      style={[
        {
          height: 40,
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
          ...(Platform.OS === 'web' &&
            ({
              outlineStyle: 'none',
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
