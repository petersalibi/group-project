import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, Animated as RNAnimated } from "react-native";
import { 
  BookOpen, CheckCircle2, Circle, ChevronLeft, ChevronRight, 
  AlertCircle, CheckCircle, XCircle, Lightbulb, Target
} from "lucide-react-native";
import { useTheme } from "../components/theme-provider";
import { Text } from "../components/text";
import { Button } from "../components/button";
import { ScrollView } from "react-native-gesture-handler";
import Svg, { Line } from "react-native-svg";
import { NeuralNode } from "../components/neural-node";
import { InitialSurfaceLesson } from "./curriculum/InitialSurfaceLesson1";
import { LossLesson } from "./curriculum/LossLesson";
import { ComplexityLesson } from "./curriculum/ComplexityLesson";
import { LandscapeOriginLesson } from "./curriculum/LandscapeOriginLesson";

const LESSON_REGISTRY = [
  {
    id: 0,
    title: "1. The surface",
    module: "BASICS",
    instruction: "Loss landscapes visualise the 'error' of a model. The 2D landscape gives a 'birds-eye' view of the landscape (toggle the switch to see the 3D landscape).",
    taskGoal: "Adjust the sliders to find the 'minimum', where the loss is minimised.",
    hint: "Observe how the colour on the landscape changes as the loss increases/decreases.",
    Component: InitialSurfaceLesson
  },
  {
    id: 1,
    title: "2. The Complexity",
    module: "BASICS",
    instruction: "Understanding how model complexity affects the surface.",
    taskGoal: "Increase the network depth to see the landscape get 'messier'.",
    hint: "Adjust the depth slider to 5 and hit generate.",
    Component: ComplexityLesson
  },
  {
    id: 2,
    title: "3. What is loss?",
    module: "BASICS",
    instruction: "Loss landscapes visualise the 'error' of a model. The 2D landscape gives a 'birds-eye' view of the landscape (toggle the switch to see the 3D landscape).",
    taskGoal: "Adjust the sliders to find the 'minimum', where the loss is minimised.",
    hint: "Observe how the colour on the landscape changes as the loss increases/decreases.",
    Component: LossLesson
  },
  {
    id: 3,
    title: "4. Origin of Landscape",
    module: "INTERACTIVE",
    instruction: "A landscape is only meaningful if it covers a wide area. Plot varied models across the parameter space to reveal the true topography.",
    taskGoal: "Achieve an Exploration Coverage of at least 70%.",
    hint: "Don't just plot in the center! Try plotting models with extreme high and low Weights/Biases.",
    Component: LandscapeOriginLesson
  }
];

export function LearningPage() {
  const { theme, isDark } = useTheme();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isTaskComplete, setIsTaskComplete] = useState(false);
  const [errorFeedback, setErrorFeedback] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const bounceAnim = useState(new RNAnimated.Value(1))[0];

  const lesson = LESSON_REGISTRY[currentIdx];

  const successColor = isDark ? '#C6F382' : '#16a34a';
  const errorColor = isDark ? '#ff4d4d' : '#dc2626';
  const warningColor = isDark ? '#f59e0b' : '#d97706';
  const inactiveColor = isDark ? '#444444' : '#d4d4d8';

  // Resolve the current status color & background
  const statusColor = isTaskComplete ? successColor : errorFeedback ? errorColor : warningColor;
  const statusBgColor = isTaskComplete 
      ? (isDark ? 'rgba(198, 243, 130, 0.05)' : 'rgba(22, 163, 74, 0.05)') 
      : errorFeedback 
          ? (isDark ? 'rgba(255, 77, 77, 0.05)' : 'rgba(220, 38, 38, 0.05)') 
          : (isDark ? 'rgba(245, 158, 11, 0.05)' : 'rgba(217, 119, 6, 0.05)');

  const changeLesson = (idx: number) => {
    setCurrentIdx(idx);
    setIsTaskComplete(false);
    setErrorFeedback(null);
    setShowHint(false);
  };

  useEffect(() => {
    let timer: any;
    if (errorFeedback) {
      timer = setTimeout(() => setShowHint(true), 7000);
    } else {
      setShowHint(false);
    }
    return () => clearTimeout(timer);
  }, [errorFeedback]);

  useEffect(() => {
    if (isTaskComplete) {
      RNAnimated.sequence([
        RNAnimated.timing(bounceAnim, {
          toValue: 1.05,
          duration: 150,
          useNativeDriver: true,
        }),
        RNAnimated.spring(bounceAnim, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [isTaskComplete, bounceAnim]);

  return (
    <View style={[styles.container]}>
      
      {/* SIDEBAR */}
      {isSidebarOpen && (
        <View style={[styles.sidebar, { borderRightColor: theme.colors.border, backgroundColor: theme.colors.card }]}>
          <View style={styles.sidebarHeader}>
            <BookOpen size={14} color={theme.colors.accent} />
            <Text style={styles.sidebarTitle}>CURRICULUM</Text>
          </View>

          <ScrollView contentContainerStyle={{ flexGrow: 1, paddingVertical: 20 }}>
            <View style={styles.networkContainer}>
              
              {/* SVG Connecting Lines (Rendered BEHIND the nodes) */}
              <View style={StyleSheet.absoluteFill}>
                <Svg width="100%" height="100%">
                  {LESSON_REGISTRY.map((_, idx) => {
                    // Don't draw a line after the last node
                    if (idx === LESSON_REGISTRY.length - 1) return null;
                    
                    const isCompleted = idx < currentIdx;
                    const spacing = 100 / LESSON_REGISTRY.length;
                    
                    // Creates a straight vertical spine down the middle (50%)
                    const xPos = "50%"; 
                    const y1 = `${(idx + 0.5) * spacing}%`;
                    const y2 = `${(idx + 1.5) * spacing}%`;

                    return (
                      <Line
                        key={`line-${idx}`}
                        x1={xPos} y1={y1} x2={xPos} y2={y2}
                        stroke={isCompleted ? successColor : inactiveColor}
                        strokeWidth="2"
                        opacity={isCompleted ? "0.8" : "0.3"}
                      />
                    );
                  })}
                </Svg>
              </View>

              {/* INTERACTIVE NEURAL NODES */}
              {LESSON_REGISTRY.map((l, idx) => {
                let status: 'available' | 'completed' | 'locked' = 'locked';
                if (idx < currentIdx) status = 'completed';
                else if (idx === currentIdx) status = 'available';

                const spacing = 100 / LESSON_REGISTRY.length;
                const yPos = `${(idx + 0.5) * spacing}%`;

                return (
                  <TouchableOpacity 
                    key={l.id} 
                    style={[
                      styles.absoluteNode,
                      { left: "50%", top: yPos }
                    ]} 
                    onPress={() => changeLesson(idx)}
                  >
                    <NeuralNode status={status} label={l.title} />
                  </TouchableOpacity>
                );
              })}

            </View>
          </ScrollView>
        </View>
      )}

      <View style={{ flex: 1 }}>
        {/* HEADER */}
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <TouchableOpacity style={styles.collapseBtn} onPress={() => setIsSidebarOpen(!isSidebarOpen)}>
            {isSidebarOpen ? <ChevronLeft size={20} color={theme.colors.foreground} /> : <ChevronRight size={20} color={theme.colors.foreground} />}
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
             <Text style={[styles.breadcrumbText, {color: theme.colors.accent}]}>{lesson.module} / LESSON {currentIdx + 1}</Text>
             <Text style={[styles.lessonTitleText, {color: theme.colors.foreground}]}>{lesson.title}</Text>
          </View>
        </View>

        <View style={styles.lessonSlot}>
          <lesson.Component 
            key={lesson.id} 
            onTaskUpdate={(comp: boolean, err: string | null, forceHint?: boolean) => {
                setIsTaskComplete(comp);
                setErrorFeedback(err);
                if (forceHint) setShowHint(true);
            }}
            theme={theme} 
          />
        </View>

        {/* TASK DRAWER */}
        <View style={[styles.drawer, { borderTopColor: theme.colors.border, backgroundColor: theme.colors.card }]}>
          <View style={styles.drawerLeft}>
             <Text style={styles.instructionText}>{lesson.instruction}</Text>
             
             <RNAnimated.View style={[
                styles.taskCard, 
                { 
                    borderColor: statusColor,
                    backgroundColor: statusBgColor,
                    transform: [{ scale: bounceAnim }]
                }
             ]}>
               {isTaskComplete ? (
                 <CheckCircle2 size={14} color={statusColor} />
               ) : (
                 <Target size={14} color={statusColor} />
               )}
               <Text style={[styles.taskLabel, { color: statusColor }]}>
                 {isTaskComplete ? "Task completed successfully!" : (errorFeedback || lesson.taskGoal)}
               </Text>
             </RNAnimated.View>
          </View>

          <View style={styles.drawerRight}>
            {showHint && !isTaskComplete && (
                <View style={[styles.hintBubble, { backgroundColor: isDark ? 'rgba(198, 243, 130, 0.1)' : 'rgba(22, 163, 74, 0.1)' }]}>
                    <Lightbulb size={12} color={successColor} />
                    <Text style={[styles.hintText, { color: successColor }]}>{lesson.hint}</Text>
                </View>
            )}

            <Button 
                disabled={!isTaskComplete} 
                variant={isTaskComplete ? "primary" : "secondary"}
                style={{ width: 140, height: 44, alignContent: 'center', justifyContent: 'center', backgroundColor: theme.colors.accent }}
                onPress={() => currentIdx < LESSON_REGISTRY.length - 1 && changeLesson(currentIdx + 1)}
            >
                <Text style={{ fontWeight: 'bold', color: isTaskComplete ? theme.colors.background : theme.colors.foreground }}>Continue ></Text>
            </Button>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row' },
  sidebar: { width: 240, borderRightWidth: 1, },
  sidebarHeader: { padding: 24, flexDirection: 'row', gap: 10, alignItems: 'center' },
  sidebarTitle: { fontSize: 10, fontWeight: '900', color: '#666', letterSpacing: 1.5 },
  stepItem: { flexDirection: 'row', padding: 16, gap: 12, alignItems: 'center' },
  stepText: { fontSize: 12, color: '#888' },
  
  header: { height: 60, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, borderBottomWidth: 1 },
  collapseBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerContent: { marginLeft: 12 },
  breadcrumbText: { fontSize: 9, fontWeight: 'bold', letterSpacing: 1 },
  lessonTitleText: { fontSize: 16, fontWeight: 'bold', marginTop: 2 },
  
  lessonSlot: { flex: 1 },
  
  drawer: { height: 110, paddingHorizontal: 30, flexDirection: 'row', borderTopWidth: 1, alignItems: 'center' },
  drawerLeft: { flex: 1, gap: 8 },
  instructionText: { color: '#888', fontSize: 12, lineHeight: 18 },
  taskCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 10, 
    paddingVertical: 8, 
    paddingHorizontal: 12, 
    borderRadius: 6, 
    borderWidth: 1,
    alignSelf: 'flex-start' 
  },
  taskLabel: { fontSize: 12, fontWeight: 'bold' },
  
  drawerRight: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  hintBubble: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8,
    padding: 10, 
    borderRadius: 8,
    maxWidth: 250
  },
  hintText: { color: '#C6F382', fontSize: 11, fontStyle: 'italic' },
  networkContainer: {
    width: '100%',
    height: 350,
    position: 'relative',
  },
  absoluteNode: {
    position: 'absolute',
    transform: [{ translateX: -40 }, { translateY: -30 }], 
    alignItems: 'center',
    justifyContent: 'center',
    width: 80, 
  },
});