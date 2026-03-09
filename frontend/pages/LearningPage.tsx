import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, Animated as RNAnimated } from "react-native";
import { 
  BookOpen, CheckCircle2, Circle, ChevronLeft, ChevronRight, 
  AlertCircle, CheckCircle, XCircle, Lightbulb, Target
} from "lucide-react-native";
import { useTheme } from "../components/theme-provider";
import { Text } from "../components/text";
import { Button } from "../components/button";

// Lesson Registry remains the same...
// Lesson Imports
import { LossPage } from "./LossPage";
import { ComplexityLesson } from "./curriculum/ComplexityLesson";
import { LandscapeOriginLesson } from "./curriculum/LandscapeOriginLesson";

const LESSON_REGISTRY = [
  {
    id: 0,
    title: "1. What is loss?",
    module: "BASICS",
    instruction: "Loss landscapes visualise the 'error' of a model. The 2D landscape gives a 'birds-eye' view of the landscape (toggle the switch to see the 3D landscape).",
    taskGoal: "Adjust the sliders to find the 'minimum', where the loss is minimised.",
    hint: "Look at what happens to the graph as you adjust the sliders.",
    Component: LossPage
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
    title: "3. Origin of Landscape",
    module: "INTERACTIVE",
    instruction: "See how the landscape emerges from individual error points.",
    taskGoal: "Plot at least 5 points to build the 3D visualization.",
    hint: "Move the sliders and click 'Plot Point' repeatedly.",
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
    <View style={styles.container}>
      {/* SIDEBAR */}
      {isSidebarOpen && (
        <View style={[styles.sidebar, { borderRightColor: theme.colors.border }]}>
          <View style={styles.sidebarHeader}>
            <BookOpen size={14} color="#C6F382" />
            <Text style={styles.sidebarTitle}>CURRICULUM</Text>
          </View>
          {LESSON_REGISTRY.map((l, idx) => (
            <TouchableOpacity 
              key={l.id} 
              style={[styles.stepItem, idx === currentIdx && styles.activeStep]} 
              onPress={() => changeLesson(idx)}
            >
              {idx < currentIdx ? <CheckCircle2 size={14} color="#C6F382" /> : <Circle size={14} color="#444" />}
              <Text style={[styles.stepText, idx === currentIdx && { color: 'white', fontWeight: '600' }]}>{l.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={{ flex: 1 }}>
        {/* CLEAN HEADER - No Tabs */}
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <TouchableOpacity style={styles.collapseBtn} onPress={() => setIsSidebarOpen(!isSidebarOpen)}>
            {isSidebarOpen ? <ChevronLeft size={20} color="white" /> : <ChevronRight size={20} color="white" />}
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
             <Text style={styles.breadcrumbText}>{lesson.module} / LESSON {currentIdx + 1}</Text>
             <Text style={styles.lessonTitleText}>{lesson.title}</Text>
          </View>
        </View>

        <View style={styles.lessonSlot}>
          <lesson.Component 
            key={lesson.id} 
            onTaskUpdate={(comp: boolean, err: string | null) => {
                setIsTaskComplete(comp);
                setErrorFeedback(err);
            }} 
            theme={theme} 
          />
        </View>

        {/* RE-STYLED TASK DRAWER */}
        <View style={[styles.drawer, { borderTopColor: theme.colors.border }]}>
          <View style={styles.drawerLeft}>
             <Text style={styles.instructionText}>{lesson.instruction}</Text>
             
             <RNAnimated.View style={[
                styles.taskCard, 
                { 
                    borderColor: isTaskComplete ? '#C6F382' : errorFeedback ? '#ff4d4d' : '#f59e0b',
                    backgroundColor: isTaskComplete ? 'rgba(198, 243, 130, 0.05)' : errorFeedback ? 'rgba(255, 77, 77, 0.05)' : 'rgba(245, 158, 11, 0.05)',
                    transform: [{ scale: bounceAnim }]
                }
             ]}>
               {isTaskComplete ? (
                 <CheckCircle2 size={14} color="#C6F382" />
               ) : (
                 <Target size={14} color={errorFeedback ? '#ff4d4d' : '#f59e0b'} />
               )}
               <Text style={[styles.taskLabel, { color: isTaskComplete ? '#C6F382' : errorFeedback ? '#ff4d4d' : '#f59e0b' }]}>
                 {isTaskComplete ? "Task completed successfully!" : (errorFeedback || lesson.taskGoal)}
               </Text>
             </RNAnimated.View>
          </View>

          <View style={styles.drawerRight}>
            {showHint && !isTaskComplete && (
                <View style={styles.hintBubble}>
                    <Lightbulb size={12} color="#C6F382" />
                    <Text style={styles.hintText}>{lesson.hint}</Text>
                </View>
            )}

            <Button 
                disabled={!isTaskComplete} 
                variant={isTaskComplete ? "primary" : "secondary"}
                style={{ width: 140, height: 44 }}
                onPress={() => currentIdx < LESSON_REGISTRY.length - 1 && changeLesson(currentIdx + 1)}
            >
                <Text style={{ fontWeight: 'bold' }}>Continue</Text>
                <ChevronRight size={16} color={isTaskComplete ? "black" : "#666"} />
            </Button>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#06080b', flexDirection: 'row' },
  sidebar: { width: 240, borderRightWidth: 1, backgroundColor: '#0b0e14' },
  sidebarHeader: { padding: 24, flexDirection: 'row', gap: 10, alignItems: 'center' },
  sidebarTitle: { fontSize: 10, fontWeight: '900', color: '#666', letterSpacing: 1.5 },
  stepItem: { flexDirection: 'row', padding: 16, gap: 12, alignItems: 'center' },
  activeStep: { backgroundColor: 'rgba(255,255,255,0.03)' },
  stepText: { fontSize: 12, color: '#888' },
  
  header: { height: 60, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, borderBottomWidth: 1 },
  collapseBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerContent: { marginLeft: 12 },
  breadcrumbText: { fontSize: 9, color: '#C6F382', fontWeight: 'bold', letterSpacing: 1 },
  lessonTitleText: { fontSize: 16, fontWeight: 'bold', color: 'white', marginTop: 2 },
  
  lessonSlot: { flex: 1 },
  
  drawer: { height: 110, paddingHorizontal: 30, flexDirection: 'row', borderTopWidth: 1, backgroundColor: '#0b0e14', alignItems: 'center' },
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
    backgroundColor: 'rgba(198, 243, 130, 0.1)', 
    padding: 10, 
    borderRadius: 8,
    maxWidth: 250
  },
  hintText: { color: '#C6F382', fontSize: 11, fontStyle: 'italic' }
});