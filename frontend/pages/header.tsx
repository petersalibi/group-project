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

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

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
      
      <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 30 }}>
        <Pressable onPress={() => navigate("/")}>
          <Text style={{ 
            fontSize: 11, 
            fontWeight: '900', 
            color: isActive("/") ? activeAccent : theme.colors.mutedForeground 
          }}>
            VISUALISATION
          </Text>
        </Pressable>
        <Pressable onPress={() => navigate("/curriculum")}>
          <Text style={{ 
            fontSize: 11, 
            fontWeight: '900', 
            color: isActive("/curriculum") ? activeAccent : theme.colors.mutedForeground 
          }}>
            CURRICULUM
          </Text>
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
        <Pressable onPress={toggleTheme}>
          {isDark ? 
            <Sun size={18} color={theme.colors.foreground} /> : 
            <Moon size={18} color={theme.colors.foreground} />
          }
        </Pressable>
      </View>
    </View>
  );
}