// ./screens/curriculum-page.tsx
import React, { useState } from "react";
import { View , Text} from "react-native";
import { useTheme } from "../components/theme-provider";
import { LessonCard } from "../components/lesson-card";
import { PageContainer } from "./page-container";
import { BottomDrawer } from "../components/bottom-drawer";
import { Button } from "../components/button";


export default function CurriculumPage() {
  const { theme } = useTheme();
  const [selectedLesson, setSelectedLesson] = useState<{
    id: string;
    title: string;
    description: string;
  } | null>(null);

  // Example curriculum data
  const modules = [
    {
      id: "nn-1",
      title: "Neural Network Basics",
      description: "Understand weights, biases, and the magic of the perceptron.",
      status: "available" as const,
    },
    {
      id: "nn-2",
      title: "Backpropagation",
      description: "How machines learn from their own mistakes.",
      status: "locked" as const,
    },
    {
      id: "nn-3",
      title: "Optimizers",
      description: "Gradient Descent and the path to global minima.",
      status: "locked" as const,
    }
  ];

  return (
    <PageContainer 
      title="Path" 
      description="Select a module to continue your exploration of neural architectures."
    >
      <View style={{ gap: 12 }}>
        {modules.map((lesson) => (
          <LessonCard
            key={lesson.id}
            title={lesson.title}
            description={lesson.description}
            status={lesson.status}
            onPress={() => setSelectedLesson(lesson)}
          />
        ))}
      </View>

      {/* Detail Drawer */}
      <BottomDrawer
        isOpen={!!selectedLesson}
        onClose={() => setSelectedLesson(null)}
        title="Module Briefing"
      >
        <View style={{ gap: 20, paddingVertical: 10 }}>
          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: theme.colors.foreground }}>
              {selectedLesson?.title}
            </Text>
            <Text style={{ color: theme.colors.mutedForeground, lineHeight: 20 }}>
              {selectedLesson?.description}
            </Text>
          </View>

          <View style={{ 
            padding: 16, 
            backgroundColor: theme.colors.muted, 
            borderRadius: theme.radius.md,
            borderWidth: 1,
            borderColor: theme.colors.border 
          }}>
            <Text style={{ fontSize: 12, fontWeight: "600", color: theme.colors.primary }}>
              PREREQUISITES: Linear Algebra (Recommended)
            </Text>
          </View>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <Button style={{ flex: 1 }} onPress={() => console.log("Starting...")}>
              Enter Module
            </Button>
            <Button variant="outline" onPress={() => setSelectedLesson(null)}>
              Cancel
            </Button>
          </View>
        </View>
      </BottomDrawer>
    </PageContainer>
  );
}