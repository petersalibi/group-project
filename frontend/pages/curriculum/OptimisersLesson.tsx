import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../../components/theme-provider';
import { Text } from '../../components/text';
import { Slider } from '../../components/slider';
import {
  Target,
  Layers,
  Database,
  Compass,
  Pause,
  Play,
  StepForward,
  RotateCcw,
} from 'lucide-react-native';
import Optimiser3DVisualiser, {
  OptimiserVisualiserHandle,
} from '../../components/optimiser-3d-visualiser';

const OPTIMISERS = {
  GD: {
    name: 'Gradient Descent',
    description:
      'Calculates the exact gradient. Takes smooth steps, but gets stuck in local minima easily.',
  },
  SGD: {
    name: 'Stochastic GD',
    description:
      'Simulates mini-batch noise. The erratic shaking helps it bounce out of shallow traps!',
  },
  RMSprop: {
    name: 'RMSprop',
    description:
      'Adapts to terrain. Shrinks steps on steep cliffs, accelerates on flat planes.',
  },
  Adam: {
    name: 'Adam',
    description:
      'The Gold Standard. Combines Momentum (rolling) and RMSprop (adaptive braking).',
  },
};

type OptimiserType = keyof typeof OPTIMISERS;

export function OptimisersLesson({ onTaskUpdate }: any) {
  const { theme, isDark } = useTheme();

  const [optimiser, setOptimiser] = useState<OptimiserType>('GD');
  const [learningRate, setLearningRate] = useState(0.01);
  const [isRunning, setIsRunning] = useState(false);

  // Task Progression States
  const [hasSelectedSGD, setHasSelectedSGD] = useState(false);
  const [hasSelectedAdam, setHasSelectedAdam] = useState(false);
  const [hasRunAdam, setHasRunAdam] = useState(false);

  // Refs to connect the Left Panel canvases to the Right Panel 3D Engine
  const curveRef = useRef<HTMLCanvasElement>(null);
  const forcesRef = useRef<HTMLCanvasElement>(null);
  const visRef = useRef<OptimiserVisualiserHandle>(null);

  const handleRunToggle = () => {
    if (visRef.current) {
      const running = visRef.current.toggleRun();
      setIsRunning(running);
      
      // Check if they are fulfilling the final step of the task!
      if (running && optimiser === 'Adam') {
          setHasRunAdam(true);
      }
    }
  };

  const handleReset = () => {
    if (visRef.current) {
      visRef.current.reset();
      setIsRunning(false);
    }
  };

  // --- DYNAMIC TASK VALIDATION ---
  useEffect(() => {
    if (onTaskUpdate) {
      if (hasSelectedSGD && hasRunAdam) {
        onTaskUpdate(true, null); // Task Complete!
      } else if (!hasSelectedSGD) {
        onTaskUpdate(false, "Step 1: Select 'SGD' to see how noisy, random batches affect the trajectory.");
      } else if (!hasSelectedAdam) {
        onTaskUpdate(false, "Step 2: Now select 'Adam', the gold standard for modern networks.");
      } else if (!hasRunAdam) {
        onTaskUpdate(false, "Step 3: Click 'Run Trajectory' to watch Adam smoothly navigate the terrain!");
      }
    }
  }, [hasSelectedSGD, hasSelectedAdam, hasRunAdam, onTaskUpdate]);

  return (
    <View style={styles.mainContainer}>
      <View style={styles.groupContainer}>
        {/* LEFT PANEL */}
        <View style={styles.subPanel}>
          <View
            style={[
              styles.subHeader,
              { borderBottomColor: theme.colors.border },
            ]}
          >
            <Compass size={12} color={theme.colors.accent} />
            <Text style={styles.subTitle}>OPTIMISATION ALGORITHMS</Text>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* CONTEXT BOX */}
            <View
              style={[
                styles.infoBox,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.card,
                },
              ]}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 6,
                }}
              >
                <Database size={12} color={theme.colors.mutedForeground} />
                <Text
                  style={{
                    fontSize: 9,
                    fontWeight: '900',
                    color: theme.colors.mutedForeground,
                  }}
                >
                  CURRENT DATASET
                </Text>
              </View>
              <Text style={{ fontSize: 13, fontWeight: 'bold' }}>
                Sine Regression
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  color: theme.colors.mutedForeground,
                  marginTop: 4,
                }}
              >
                This 3D landscape is generated from a 4&times;4 Tanh
                network trained on the Sine Regression dataset, using Random Direction Projection. The goal is to reach
                the lowest MSE loss. Watch how different algorithms use Gradient
                (Red) and Momentum (Blue) to decide their next step.
              </Text>
            </View>

            {/* OPTIMISER SELECTOR (PILLS) */}
            <View style={styles.controlGroup}>
              <Text
                style={[
                  styles.controlLabel,
                  { color: theme.colors.mutedForeground, marginBottom: 8 },
                ]}
              >
                SELECT OPTIMISER
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {(Object.keys(OPTIMISERS) as OptimiserType[]).map((opt) => {
                  const isActive = optimiser === opt;
                  return (
                    <TouchableOpacity
                      key={opt}
                      style={[
                        styles.pillButton,
                        {
                          backgroundColor: isActive
                            ? theme.colors.accent
                            : 'transparent',
                          borderColor: isActive
                            ? theme.colors.accent
                            : theme.colors.border,
                        },
                      ]}
                      onPress={() => {
                        setOptimiser(opt);
                        // Track task progression!
                        if (opt === 'SGD') setHasSelectedSGD(true);
                        if (opt === 'Adam') setHasSelectedAdam(true);
                        handleReset();
                      }}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          {
                            color: isActive
                              ? theme.colors.background
                              : theme.colors.foreground,
                          },
                        ]}
                      >
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text
                style={{
                  fontSize: 11,
                  color: theme.colors.mutedForeground,
                  marginTop: 8,
                }}
              >
                {OPTIMISERS[optimiser].description}
              </Text>
            </View>

            {/* HYPERPARAMETERS */}
            <View style={styles.controlGroup}>
              <View style={styles.sliderGroup}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                  }}
                >
                  <Text
                    style={[
                      styles.controlLabel,
                      { color: theme.colors.mutedForeground },
                    ]}
                  >
                    LEARNING RATE
                  </Text>
                  <Text
                    style={[
                      styles.controlLabel,
                      { color: theme.colors.foreground },
                    ]}
                  >
                    {learningRate.toFixed(4)}
                  </Text>
                </View>
                <Slider
                  style={{ flex: 1, height: 40, marginTop: 4 }}
                  value={learningRate}
                  min={0.0005}
                  max={0.05}
                  step={0.0005}
                  onValueChange={setLearningRate}
                  minimumTrackTintColor={theme.colors.accent}
                  thumbTintColor={theme.colors.foreground}
                />
              </View>
            </View>

            {/* VISUALIZATION CANVASES */}
            <View
              style={{
                flexDirection: 'row',
                gap: 12,
                height: 160,
                marginBottom: 20,
              }}
            >
              {/* 1D Learning Curve */}
              <View
                style={{
                  flex: 1,
                  backgroundColor: theme.colors.background,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  overflow: 'hidden',
                  padding: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 9,
                    fontWeight: '900',
                    color: theme.colors.mutedForeground,
                    marginBottom: 4,
                  }}
                >
                  LOSS HISTORY (LEARNING CURVE)
                </Text>
                <canvas
                  ref={curveRef}
                  width={250}
                  height={120}
                  style={{ width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.05)' }}
                />
              </View>

              {/* 2D Force Compass */}
              <View
                style={{
                  width: 140,
                  backgroundColor: theme.colors.background,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  overflow: 'hidden',
                  padding: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 9,
                    fontWeight: '900',
                    color: theme.colors.mutedForeground,
                    marginBottom: 4,
                  }}
                >
                  FORCE COMPASS
                </Text>
                <canvas
                  ref={forcesRef}
                  width={120}
                  height={120}
                  style={{ width: '100%', height: '100%' }}
                />
              </View>
            </View>

            {/* EXECUTION CONTROLS */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={handleRunToggle}
                style={[
                  styles.actionBtn,
                  {
                    flex: 2,
                    backgroundColor: isRunning
                      ? theme.colors.muted
                      : theme.colors.primary,
                    borderColor: isRunning
                      ? theme.colors.border
                      : theme.colors.primary,
                  },
                ]}
              >
                {isRunning ? (
                  <Pause size={16} color={theme.colors.foreground} />
                ) : (
                  <Play size={16} color={theme.colors.primaryForeground} />
                )}
                <Text
                  style={{
                    color: isRunning
                      ? theme.colors.foreground
                      : theme.colors.primaryForeground,
                    fontWeight: 'bold',
                  }}
                >
                  {isRunning ? 'Pause' : 'Run Trajectory'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => visRef.current?.step()}
                style={[
                  styles.actionBtn,
                  { flex: 1, backgroundColor: 'transparent', borderColor: theme.colors.border },
                ]}
              >
                <StepForward size={16} color={theme.colors.foreground} />
                <Text
                  style={{ color: theme.colors.foreground, fontWeight: 'bold' }}
                >
                  Step
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleReset}
                style={[styles.actionBtn, { flex: 1, borderColor: '#ef4444' }]}
              >
                <RotateCcw size={16} color='#ef4444' />
                <Text style={{ color: '#ef4444', fontWeight: 'bold' }}>
                  Reset
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>

        {/* RIGHT PANEL (3D VISUALIZER) */}
        <View
          style={[
            styles.subPanel,
            { flex: 1.4, backgroundColor: 'rgba(0,0,0,0.05)' },
          ]}
        >
          <View
            style={[
              styles.subHeader,
              { borderBottomColor: theme.colors.border, zIndex: 10 },
            ]}
          >
            <Layers size={12} color={theme.colors.accent} />
            <Text style={styles.subTitle}>3D LOSS TOPOGRAPHY</Text>
          </View>

          <View style={{ flex: 1, width: '100%' }}>
            <Optimiser3DVisualiser
              ref={visRef}
              curveRef={curveRef}
              forcesRef={forcesRef}
              optimiser={optimiser}
              learningRate={learningRate}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  groupContainer: { flex: 1, flexDirection: 'row', gap: 1 },
  subPanel: { flex: 1 },
  subHeader: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    gap: 8,
  },
  subTitle: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  scrollContent: { paddingHorizontal: 24, paddingVertical: 24 },

  infoBox: { padding: 12, borderWidth: 1, borderRadius: 8, marginBottom: 24 },
  controlGroup: { width: '100%', marginBottom: 20 },
  controlLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  sliderGroup: { marginBottom: 8 },

  pillButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: { fontSize: 11, fontWeight: 'bold' },

  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1
  },
});