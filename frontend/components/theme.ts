import { Platform } from "react-native";

export type Theme = {
  colors: {
    background: string; foreground: string; card: string; cardForeground: string;
    popover: string; popoverForeground: string; primary: string; primaryForeground: string;
    secondary: string; secondaryForeground: string; muted: string; mutedForeground: string;
    accent: string; accentForeground: string; destructive: string; destructiveForeground: string;
    border: string; ring: string; graphite: string; frenchBlue: string; oceanTwilight: string;
    powderBlue: string; limeCream: string; chart1: string; chart2: string; chart3: string;
    chart4: string; chart5: string; sidebar: string; sidebarForeground: string;
    sidebarPrimary: string; sidebarPrimaryForeground: string; sidebarAccent: string;
    sidebarAccentForeground: string; sidebarBorder: string; sidebarRing: string;
  };
  radius: { sm: number; md: number; lg: number; xl: number; full: number; };
  typography: { fontSizeBase: number; weightMedium: "500"; weightNormal: "400"; };
  spacing: { sm: number; md: number; lg: number; xl: number; };
  shadows: { soft: any; medium: any; };
  layout: { sectionGap: number; containerPadding: number; };
};

export const lightTheme: Theme = {
  colors: {
    background: "#ffffff", foreground: "#333432", card: "#ffffff", cardForeground: "#333432",
    popover: "#ffffff", popoverForeground: "#333432", primary: "#353F91", primaryForeground: "#ffffff",
    secondary: "#4F57A9", secondaryForeground: "#ffffff", muted: "#f5f5f5", mutedForeground: "#666666",
    accent: "#C6F382", accentForeground: "#333432", destructive: "#d4183d", destructiveForeground: "#ffffff",
    border: "#e0e0e0", ring: "#4F57A9", graphite: "#333432", frenchBlue: "#353F91",
    oceanTwilight: "#4F57A9", powderBlue: "#A1B5D8", limeCream: "#C6F382", chart1: "#353F91",
    chart2: "#4F57A9", chart3: "#A1B5D8", chart4: "#C6F382", chart5: "#333432",
    sidebar: "#f8f8f8", sidebarForeground: "#333432", sidebarPrimary: "#353F91",
    sidebarPrimaryForeground: "#ffffff", sidebarAccent: "#f0f0f0", sidebarAccentForeground: "#333432",
    sidebarBorder: "#e0e0e0", sidebarRing: "#4F57A9",
  },
  radius: { sm: 4, md: 6, lg: 8, xl: 12, full: 9999 },
  typography: { fontSizeBase: 16, weightMedium: "500", weightNormal: "400" },
  spacing: { sm: 8, md: 16, lg: 24, xl: 32 },
  shadows: {
    soft: Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 }, android: { elevation: 2 }, default: {} }) || {},
    medium: Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 }, android: { elevation: 4 }, default: {} }) || {},
  },
  layout: { sectionGap: 32, containerPadding: 20 },
};

export const darkTheme: Theme = {
  ...lightTheme,
  colors: {
    ...lightTheme.colors,
    background: "#1a1a1a", foreground: "#f5f5f5", card: "#1a1a1a", cardForeground: "#f5f5f5",
    popover: "#1a1a1a", popoverForeground: "#f5f5f5", primary: "#4F57A9", primaryForeground: "#ffffff",
    secondary: "#353F91", secondaryForeground: "#ffffff", muted: "#2a2a2a", mutedForeground: "#999999",
    accent: "#C6F382", accentForeground: "#1a1a1a", border: "#333333",
  },
  shadows: {
    soft: Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 8 }, android: { elevation: 3 }, default: {} }) || {},
    medium: Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 12 }, android: { elevation: 6 }, default: {} }) || {},
  },
};