import React from "react";
import { View, ScrollView } from "react-native";
import { useTheme } from "../components/theme-provider";
import { Text } from "../components/text";

interface PageContainerProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  scrollable?: boolean;
}

export function PageContainer({ title, description, children, scrollable = true }: PageContainerProps) {
  const { theme } = useTheme();
  const ContentWrapper = scrollable ? ScrollView : View;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ padding: 24, paddingBottom: 0, gap: 4 }}>
        <Text style={{ fontSize: 28, fontWeight: "800", color: theme.colors.foreground }}>
          {title}
        </Text>
        {description && (
          <Text style={{ fontSize: 14, color: theme.colors.mutedForeground }}>
            {description}
          </Text>
        )}
      </View>
      
      <ContentWrapper 
        style={{ flex: 1 }} 
        contentContainerStyle={{ padding: 24 }}
      >
        {children}
      </ContentWrapper>
    </View>
  );
}