import React, { useEffect } from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Text } from './text';
import { useTheme } from './theme-provider';

type NodeStatus = 'completed' | 'available' | 'locked';

interface NeuralNodeProps {
  status: NodeStatus;
  label?: string;
}

export function NeuralNode({ status, label }: NeuralNodeProps) {
  const { theme } = useTheme();

  const isCompleted = status === 'completed';
  const isAvailable = status === 'available';
  const isLocked = status === 'locked';

  // Breathing animation for the active/available node
  const pulse = useSharedValue(1);
  
  useEffect(() => {
    if (isAvailable) {
      pulse.value = withRepeat(
        withTiming(1.3, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        -1, // Infinite
        true // Reverse
      );
    } else {
      pulse.value = 1;
    }
  }, [isAvailable]);

  const animatedGlowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: isAvailable ? 0.3 : 0,
  }));

  const activeColor = theme.colors.frenchBlue;
  const textColor = isLocked ? theme.colors.mutedForeground : theme.colors.foreground;

  return (
    <View style={{ alignItems: 'center', gap: theme.spacing.sm }}>
      <View
        style={{
          width: 64,
          height: 64,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {/* Animated Glow for Active Node */}
        {isAvailable && (
          <Animated.View
            style={[
              {
                position: 'absolute',
                width: 64,
                height: 64,
                borderRadius: theme.radius.full,
                backgroundColor: theme.colors.chart4, // A nice contrast color from your theme
              },
              animatedGlowStyle,
            ]}
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
            borderColor: isLocked
              ? theme.colors.border
              : 'rgba(255,255,255,0.3)',
            justifyContent: 'center',
            alignItems: 'center',
            ...theme.shadows.soft,
          }}
        >
          
          {/* Inner Dots replacing the Tick and Padlock */}
          {isCompleted && (
            <View
              style={{
                width: 14,
                height: 14,
                borderRadius: 7,
                backgroundColor: '#ffffff',
                shadowColor: '#ffffff',
                shadowOpacity: 0.8,
                shadowRadius: 4,
                shadowOffset: { width: 0, height: 0 },
              }}
            />
          )}

          {isAvailable && (
             <View
             style={{
               width: 18,
               height: 18,
               borderRadius: 9,
               backgroundColor: theme.colors.chart4, 
               borderWidth: 2,
               borderColor: 'white',
               shadowColor: theme.colors.chart4,
               shadowOpacity: 0.8,
               shadowRadius: 6,
               shadowOffset: { width: 0, height: 0 },
             }}
           />
          )}

          {isLocked && (
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: theme.colors.mutedForeground,
              }}
            />
          )}
        </LinearGradient>
      </View>

      {/* Label */}
      {label && (
        <Text
          style={{
            fontSize: 12,
            fontWeight: isAvailable ? 'bold' : theme.typography.weightMedium,
            color: textColor,
            textAlign: 'center',
            textShadowColor: isLocked ? 'transparent' : theme.colors.background,
            textShadowOffset: { width: 1, height: 1 },
            textShadowRadius: 2,
          }}
        >
          {label}
        </Text>
      )}
    </View>
  );
}