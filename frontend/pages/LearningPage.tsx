import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated as RNAnimated,
  DimensionValue,
} from 'react-native';
import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  Target,
} from 'lucide-react-native';
import { useTheme } from '../components/theme-provider';
import { Text } from '../components/text';
import { Button } from '../components/button';
import { ScrollView } from 'react-native-gesture-handler';
import Svg, { Line } from 'react-native-svg';
import { NeuralNode } from '../components/neural-node';
import { useLocation, useNavigate } from 'react-router-native';
import { LossLesson } from './curriculum/LossLesson';
import { ArchitectureComplexityLesson } from './curriculum/ArchitectureComplexityLesson';
import { LandscapeOriginLesson } from './curriculum/LandscapeOriginLesson';
import { ActivationLesson } from './curriculum/ActivationLesson';
import { OptimisersLesson } from './curriculum/OptimisersLesson';
import { ProjectionsLesson } from './curriculum/ProjectionsLesson';

const LESSON_REGISTRY = [
  // --- LAYER 1 ---
  {
    id: 0,
    slug: 'loss',
    title: 'What is loss?',
    module: 'BASICS',
    xPos: '28%' as DimensionValue,
    yPos: '15%' as DimensionValue,
    parents: [] as number[],
    instruction:
      "Loss landscapes visualise the 'error' of a model. The 2D landscape gives a 'birds-eye' view of the landscape (toggle the switch to see the 3D landscape).",
    taskGoal:
      "Adjust the sliders to find the 'minimum', where the loss is minimised.",
    hint: 'Observe how the colour on the landscape changes as the loss increases/decreases.',
    Component: LossLesson,
  },
  {
    id: 1,
    slug: 'landscapes',
    title: 'Landscapes',
    module: 'BASICS',
    xPos: '72%' as DimensionValue,
    yPos: '15%' as DimensionValue,
    parents: [] as number[],
    instruction:
      'A landscape is only meaningful if it covers a wide area. Plot varied models across the parameter space to reveal the true topography.',
    taskGoal: 'Achieve an Exploration Coverage of at least 70%.',
    hint: "Don't just plot in the center! Try plotting models with extreme high and low Weights/Biases.",
    Component: LandscapeOriginLesson,
  },

  // --- LAYER 2 ---
  {
    id: 2,
    slug: 'complexity',
    title: 'Complexity',
    module: 'DYNAMICS',
    xPos: '15%' as DimensionValue,
    yPos: '35%' as DimensionValue,
    parents: [0, 1], // Branches from Layer 1
    instruction: 'Understanding how model complexity affects the surface.',
    taskGoal: "Increase the network depth to see the landscape get 'messier'.",
    hint: 'Adjust the sliders to find a complex-looking landscape.',
    Component: ArchitectureComplexityLesson,
  },
  {
    id: 3,
    slug: 'activations',
    title: 'Activations',
    module: 'DYNAMICS',
    xPos: '50%' as DimensionValue,
    yPos: '35%' as DimensionValue,
    parents: [0, 1], // Branches from Layer 1
    instruction:
      'Without an activation function, a Neural Network is just doing basic linear math. Observe how adding non-linearity gives the network the power to fold the landscape.',
    taskGoal:
      'Observe how Linear, ReLU, and Tanh activations affect a deep network.',
    hint: 'First, make the network deep and wide while using Linear activation. Then switch to ReLU and Tanh to see the landscape transform.',
    Component: ActivationLesson,
  },
  {
    id: 4,
    slug: 'optimisers',
    title: 'Optimisers',
    module: 'DYNAMICS',
    xPos: '85%' as DimensionValue,
    yPos: '35%' as DimensionValue,
    parents: [0, 1], // Branches from Layer 1
    instruction:
      'Optimisers act as the "navigators" for the network, deciding how to move down the loss landscape based on the mathematical terrain.',
    taskGoal:
      "Select 'SGD' to observe noisy steps, then switch to 'Adam' and run the trajectory.",
    hint: "Try clicking the 'SGD' optimiser pill first. Then click 'Adam' and press 'Run Trajectory'.",
    Component: OptimisersLesson,
  },
  {
    id: 5,
    slug: 'projections',
    title: 'Projections',
    module: 'INTERACTIVE',
    xPos: '50%' as DimensionValue,
    yPos: '55%' as DimensionValue,
    parents: [2, 3, 4], // Branches from Layer 2
    instruction:
      'High-dimensional landscapes are hard to visualise. Projections are like shadows, giving us a glimpse of the landscape from different angles.',
    taskGoal:
      'Adjust the projection vectors and move the plane to slice through the landscape.',
    hint: 'Experiment with different projection configurations to produce a convex intersection curve.',
    Component: ProjectionsLesson,
  },
];

// --- LAYER 3 (Output Node) ---
const VISUALISATION_NODE = {
  title: 'Visualisation Tool',
  xPos: '50%' as DimensionValue,
  yPos: '78%' as DimensionValue,
  parents: [5],
};

export function LearningPage() {
  const { theme, isDark } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const pathSegments = location.pathname.split('/').filter(Boolean);
  const currentSlug = pathSegments[pathSegments.length - 1];
  const matchedIndex = LESSON_REGISTRY.findIndex((l) => l.slug === currentSlug);
  const currentIdx = matchedIndex !== -1 ? matchedIndex : 0;

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

  const statusColor = isTaskComplete
    ? successColor
    : errorFeedback
      ? errorColor
      : warningColor;

  const statusBgColor = isTaskComplete
    ? isDark
      ? 'rgba(198, 243, 130, 0.05)'
      : 'rgba(22, 163, 74, 0.05)'
    : errorFeedback
      ? isDark
        ? 'rgba(255, 77, 77, 0.05)'
        : 'rgba(220, 38, 38, 0.05)'
      : isDark
        ? 'rgba(245, 158, 11, 0.05)'
        : 'rgba(217, 119, 6, 0.05)';

  const changeLesson = (idx: number) => {
    navigate(`/curriculum/${LESSON_REGISTRY[idx].slug}`);
  };

  useEffect(() => {
    setIsTaskComplete(false);
    setErrorFeedback(null);
    setShowHint(false);
  }, [currentIdx]);

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
        }),
      ]).start();
    }
  }, [isTaskComplete, bounceAnim]);

  return (
    <View style={[styles.container]}>
      {/* SIDEBAR */}
      {isSidebarOpen && (
        <View
          style={[
            styles.sidebar,
            {
              borderRightColor: theme.colors.border,
              backgroundColor: theme.colors.card,
            },
          ]}
        >
          <View style={styles.sidebarHeader}>
            <BookOpen size={14} color={theme.colors.accent} />
            <Text
              style={[styles.sidebarTitle, { color: theme.colors.foreground }]}
            >
              CURRICULUM
            </Text>
          </View>

          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            <View style={styles.networkContainer}>
              {/* SVG BRANCHING LINES */}
              <View style={StyleSheet.absoluteFill}>
                <Svg width='100%' height='100%'>
                  {LESSON_REGISTRY.map((node, idx) => {
                    return node.parents.map((parentId) => {
                      const parent = LESSON_REGISTRY.find(
                        (l) => l.id === parentId,
                      );
                      if (!parent) return null;

                      const isCompleted = idx <= currentIdx;

                      return (
                        <Line
                          key={`line-${parentId}-${idx}`}
                          x1={String(parent.xPos)}
                          y1={String(parent.yPos)}
                          x2={String(node.xPos)}
                          y2={String(node.yPos)}
                          stroke={isCompleted ? successColor : inactiveColor}
                          strokeWidth='2'
                          opacity={isCompleted ? '0.5' : '0.3'}
                        />
                      );
                    });
                  })}

                  {/* Lines mapping down to the final Visualisation Sandbox */}
                  {VISUALISATION_NODE.parents.map((parentId) => {
                    const parent = LESSON_REGISTRY.find(
                      (l) => l.id === parentId,
                    );
                    if (!parent) return null;

                    const isCompleted =
                      currentIdx === LESSON_REGISTRY.length - 1 &&
                      isTaskComplete;

                    return (
                      <Line
                        key={`line-${parentId}-vis`}
                        x1={String(parent.xPos)}
                        y1={String(parent.yPos)}
                        x2={String(VISUALISATION_NODE.xPos)}
                        y2={String(VISUALISATION_NODE.yPos)}
                        stroke={isCompleted ? successColor : inactiveColor}
                        strokeWidth='2'
                        opacity={isCompleted ? '0.8' : '0.3'}
                      />
                    );
                  })}
                </Svg>
              </View>

              {/* DYNAMIC NEURAL NODES */}
              {LESSON_REGISTRY.map((l, idx) => {
                let status: 'available' | 'completed' | 'locked' = 'locked';
                if (idx < currentIdx) status = 'completed';
                else if (idx === currentIdx) status = 'available';

                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.absoluteNode, { left: l.xPos, top: l.yPos }]}
                    onPress={() => changeLesson(idx)}
                    activeOpacity={0.6}
                  >
                    <NeuralNode status={status} label={l.title} />
                  </TouchableOpacity>
                );
              })}

              {/* FINAL VISUALISATION NODE */}
              <TouchableOpacity
                style={[
                  styles.absoluteNode,
                  {
                    left: VISUALISATION_NODE.xPos,
                    top: VISUALISATION_NODE.yPos,
                    transform: [
                      { translateX: -40 },
                      { translateY: -30 },
                      { scale: 1.25 },
                    ],
                  },
                ]}
                onPress={() => navigate('/')}
                activeOpacity={0.6}
              >
                <NeuralNode
                  status={
                    currentIdx === LESSON_REGISTRY.length - 1 && isTaskComplete
                      ? 'available'
                      : 'locked'
                  }
                  label={VISUALISATION_NODE.title}
                />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      )}

      <View style={{ flex: 1 }}>
        {/* HEADER */}
        <View
          style={[
            styles.header,
            { borderBottomColor: theme.colors.border, paddingRight: 50 },
          ]}
        >
          <TouchableOpacity
            style={styles.collapseBtn}
            onPress={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? (
              <ChevronLeft size={20} color={theme.colors.foreground} />
            ) : (
              <ChevronRight size={20} color={theme.colors.foreground} />
            )}
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <Text
              style={[styles.breadcrumbText, { color: theme.colors.accent }]}
            >
              {lesson.module} / LESSON {currentIdx + 1}
            </Text>
            <Text
              style={[
                styles.lessonTitleText,
                { color: theme.colors.foreground },
              ]}
            >
              {lesson.title}
            </Text>
          </View>
        </View>

        <View style={styles.lessonSlot}>
          <lesson.Component
            key={lesson.id}
            onTaskUpdate={(
              comp: boolean,
              err: string | null,
              forceHint?: boolean,
            ) => {
              setIsTaskComplete(comp);
              setErrorFeedback(err);
              if (forceHint) setShowHint(true);
            }}
            theme={theme}
          />
        </View>

        {/* TASK DRAWER */}
        <View
          style={[
            styles.drawer,
            {
              borderTopColor: theme.colors.border,
              backgroundColor: theme.colors.card,
            },
          ]}
        >
          <View style={styles.drawerLeft}>
            <Text style={styles.instructionText}>{lesson.instruction}</Text>

            <RNAnimated.View
              style={[
                styles.taskCard,
                {
                  borderColor: statusColor,
                  backgroundColor: statusBgColor,
                  transform: [{ scale: bounceAnim }],
                },
              ]}
            >
              {isTaskComplete ? (
                <CheckCircle2 size={14} color={statusColor} />
              ) : (
                <Target size={14} color={statusColor} />
              )}
              <Text style={[styles.taskLabel, { color: statusColor }]}>
                {isTaskComplete
                  ? 'Task completed successfully!'
                  : errorFeedback || lesson.taskGoal}
              </Text>
            </RNAnimated.View>
          </View>

          <View style={styles.drawerRight}>
            {showHint && !isTaskComplete && (
              <View
                style={[
                  styles.hintBubble,
                  {
                    backgroundColor: isDark
                      ? 'rgba(198, 243, 130, 0.1)'
                      : 'rgba(22, 163, 74, 0.1)',
                  },
                ]}
              >
                <Lightbulb size={50} color={successColor} />
                <Text style={[styles.hintText, { color: successColor }]}>
                  {lesson.hint}
                </Text>
              </View>
            )}

            <Button
              disabled={!isTaskComplete}
              variant={isTaskComplete ? 'default' : 'secondary'}
              style={{
                width: 140,
                height: 44,
                alignContent: 'center',
                justifyContent: 'center',
                backgroundColor: theme.colors.accent,
              }}
              onPress={() => {
                if (currentIdx < LESSON_REGISTRY.length - 1) {
                  changeLesson(currentIdx + 1);
                } else {
                  navigate('/');
                }
              }}
            >
              <Text
                style={{
                  fontWeight: 'bold',
                  color: isTaskComplete
                    ? theme.colors.background
                    : theme.colors.popover,
                }}
              >
                {currentIdx === LESSON_REGISTRY.length - 1
                  ? 'Finish >'
                  : 'Continue >'}
              </Text>
            </Button>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row' },
  sidebar: { width: 240, borderRightWidth: 1 },
  sidebarHeader: {
    padding: 24,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  sidebarTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#666',
    letterSpacing: 1.5,
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  collapseBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: { marginLeft: 12 },
  breadcrumbText: { fontSize: 9, fontWeight: 'bold', letterSpacing: 1 },
  lessonTitleText: { fontSize: 16, fontWeight: 'bold', marginTop: 2 },

  lessonSlot: { flex: 1 },

  drawer: {
    height: 110,
    paddingHorizontal: 30,
    flexDirection: 'row',
    borderTopWidth: 1,
    alignItems: 'center',
  },
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
    alignSelf: 'flex-start',
  },
  taskLabel: { fontSize: 12, fontWeight: 'bold' },

  drawerRight: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  hintBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 8,
    maxWidth: 250,
  },
  hintText: { color: '#C6F382', fontSize: 11, fontStyle: 'italic' },
  networkContainer: {
    width: '100%',
    height: '100%',
    minHeight: 550, // Ensures it doesn't get squashed on shorter screens
    position: 'relative',
  },
  absoluteNode: {
    position: 'absolute',
    transform: [{ translateX: -40 }, { translateY: -30 }], // Centers the 80x60 node on its xPos/yPos
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
  },
});
