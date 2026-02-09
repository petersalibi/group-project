import React from "react";
import { View, Text, ScrollView, SafeAreaView, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../components/theme-provider";
import { Button } from "../components/button";
import { Progress } from "../components/progress";

export default function LessonPage({ onExit }: { onExit: () => void }) {
  const { theme } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 20, gap: 15, borderBottomWidth: 1, borderBottomColor: theme.colors.border }}>
        <Pressable onPress={onExit} hitSlop={20}>
          <Feather name="arrow-left" size={24} color={theme.colors.foreground} />
        </Pressable>
        <View style={{ flex: 1 }}><Progress value={30} /></View>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ fontSize: 28, fontWeight: "800", color: theme.colors.foreground, marginBottom: 16 }}>The Neuron</Text>
        <Text style={{ fontSize: 16, lineHeight: 24, color: theme.colors.foreground }}>A neuron takes inputs, weights them, and applies an activation function...</Text>
      </ScrollView>
      <View style={{ padding: 20, borderTopWidth: 1, borderTopColor: theme.colors.border }}>
        <Button style={{ width: "100%" }} onPress={onExit}>Complete Lesson</Button>
      </View>
    </SafeAreaView>
  );
}