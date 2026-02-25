import React from "react";
import { View, Pressable, Image } from "react-native";
import { useNavigate, useLocation } from "react-router-native";
import { Settings, Sun, Moon } from "lucide-react-native";
import { useTheme } from "../components/theme-provider";
import { Text } from "../components/text";

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, toggleTheme, theme } = useTheme();

  // Helper to check if a route is active
  const isActive = (path: string) => location.pathname === path;

  // DYNAMIC COLOR LOGIC: Lime in Dark (#C6F382), Blue in Light (#353F91)
  const activeAccent = isDark ? '#C6F382' : '#353F91';

  return (
    <View style={{ 
      height: 60, 
      flexDirection: 'row', 
      alignItems: 'center', 
      paddingHorizontal: 20, 
      backgroundColor: theme.colors.card,
      borderBottomWidth: 1,
      borderColor: theme.colors.border 
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Image 
          source={require('../assets/images/logo.svg')} 
          style={{ width: 28, height: 28 }}
          resizeMode="contain"
        />
        <Text style={{ fontWeight: '900', color: theme.colors.foreground, letterSpacing: 1 }}>
          DISCOVERING DIMENSIONS
        </Text>
      </View>
      
      {/* Navigation Tabs */}
      <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 30 }}>
        <Pressable onPress={() => navigate("/")}>
          <Text style={{ 
            fontSize: 11, 
            fontWeight: '900', 
            // Apply the dynamic accent here
            color: isActive("/") ? activeAccent : theme.colors.mutedForeground 
          }}>
            VISUALISATION
          </Text>
        </Pressable>
        <Pressable onPress={() => navigate("/curriculum")}>
          <Text style={{ 
            fontSize: 11, 
            fontWeight: '900', 
            // Apply the dynamic accent here
            color: isActive("/curriculum") ? activeAccent : theme.colors.mutedForeground 
          }}>
            CURRICULUM
          </Text>
        </Pressable>
      </View>

      {/* Action Icons */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
        <Pressable onPress={toggleTheme}>
          {isDark ? 
            <Sun size={18} color={theme.colors.foreground} /> : 
            <Moon size={18} color={theme.colors.foreground} />
          }
        </Pressable>
        
        <Pressable onPress={() => navigate("/components")}>
          <Settings 
            size={18} 
            // Apply the dynamic accent to the icon too
            color={isActive("/components") ? activeAccent : theme.colors.foreground} 
          />
        </Pressable>
      </View>
    </View>
  );
}