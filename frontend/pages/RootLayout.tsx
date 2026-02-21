import React from "react";
import { View } from "react-native";
import { Outlet } from "react-router-native";
import { Header } from "./header";
import { Footer } from "./footer";
import { useTheme } from "../components/theme-provider";
import { LoadingProvider } from '../components/loading-provider';

export function RootLayout() {
  const { theme } = useTheme();

  return (
    <LoadingProvider>
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <Header />
        
        {/* This container must grow to fill space, but stay ABOVE the footer */}
        <View style={{ flex: 1 }}>
          <Outlet />
        </View>

        <Footer /> 
      </View>
    </LoadingProvider>
  );
}