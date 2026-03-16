import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from 'react-native';
import { useTheme } from './theme-provider';

interface GradientBoxProps {
  /**
   * Array of color strings.
   * Example: [theme.colors.frenchBlue, theme.colors.oceanTwilight]
   */
  colors: string[];
  label: string;
  textColor?: string;
}

export function GradientBox({
  colors,
  label,
  textColor = 'white',
}: GradientBoxProps) {
  //  1. Call the hook inside the function to access theme.radius
  const { theme } = useTheme();

  return (
    <LinearGradient
      colors={colors as [string, string, ...string[]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        height: 80,
        borderRadius: theme.radius.md, //  Now theme is defined!
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
      }}
    >
      <Text
        style={{
          color: textColor,
          fontWeight: '600',
          fontSize: 12,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        {label}
      </Text>
    </LinearGradient>
  );
}
