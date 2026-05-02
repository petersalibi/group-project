import React from "react";
import Svg, { Line, Defs, LinearGradient, Stop } from "react-native-svg";
import { View } from "react-native";
import { useTheme } from "./theme-provider";
 
export function NeuralConnections() {
  const { theme } = useTheme();

  return (
    <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
      <Svg width="100%" height="150">
        <Defs>
          <LinearGradient id="activeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop 
              offset="0%" 
              stopColor={theme.colors.oceanTwilight} 
              stopOpacity="0.6" 
            />
            <Stop 
              offset="100%" 
              stopColor={theme.colors.powderBlue} 
              stopOpacity="0.8" 
            />
          </LinearGradient>
        </Defs>
        
        <Line
          x1="20%" y1="75"
          x2="50%" y2="75"
          stroke="url(#activeGrad)"
          strokeWidth="3"
        />
        
        <Line
          x1="50%" y1="75"
          x2="80%" y2="75"
          stroke={theme.colors.border}
          strokeWidth="2"
          strokeDasharray="4, 4"
        />
      </Svg>
    </View>
  );
}