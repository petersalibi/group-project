import React, { useState, useEffect, useMemo } from 'react';
import {
  Platform,
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Svg, { Line, Circle, Rect } from 'react-native-svg';
import { RefreshCw, BarChart3, Map } from 'lucide-react-native';

import { useTheme } from '../../components/theme-provider';
import { Switch } from '../../components/switch';
import { Text } from '../../components/text';
import { LossHeatmap } from '../../components/loss-heatmap';
import { Slider } from '../../components/slider';

interface LossLessonProps {
  onTaskUpdate?: (
    isComplete: boolean,
    error: string | null,
    forceHint?: boolean,
  ) => void;
}

export function LossLesson({ onTaskUpdate }: LossLessonProps) {
  const { theme, isDark } = useTheme();

  const successColor = isDark ? '#C6F382' : '#16a34a';
  const successBgColor = isDark
    ? 'rgba(198, 243, 130, 0.05)'
    : 'rgba(22, 163, 74, 0.05)';

  // Heatmap State
  const [weight, setWeight] = useState(-1);
  const [bias, setBias] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [isHeld, setIsHeld] = useState(false);
  const [is3D, setIs3D] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [coverage, setCoverage] = useState(0);

  // Success Box Animation
  const scale = useSharedValue(0);
  const successAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: scale.value,
  }));

  // Track mouse holding for the heatmap logic
  useEffect(() => {
    const handleMouseUp = () => setIsHeld(false);
    const handleMouseDown = () => setIsHeld(true);

    if (Platform.OS === 'web') {
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('mousedown', handleMouseDown);
    }

    return () => {
      if (Platform.OS === 'web') {
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('mousedown', handleMouseDown);
      }
    };
  }, []);

  // Animation Value for Icon
  const refreshAnim = useSharedValue(0);

  const onRefreshPress = () => {
    refreshAnim.value = withTiming(refreshAnim.value + 360, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
    // Reset state
    setWeight(-1);
    setBias(-1); // Resetting back to start bias
    setIsDone(false);
    scale.value = 0;
    setRefreshKey((prev) => prev + 1);
    if (onTaskUpdate) onTaskUpdate(false, null);
  };

  const refreshStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${refreshAnim.value}deg` }],
  }));

  const handleHeatmapResult = (isCorrect: boolean) => {
    if (isCorrect) {
      setIsDone(true);
      scale.value = withSpring(1, { damping: 20, stiffness: 500 });

      if (onTaskUpdate) onTaskUpdate(true, null);
    }
  };

  useEffect(() => {
    if (isDone) {
      if (onTaskUpdate) onTaskUpdate(true, null);
      return;
    }

    if (coverage >= 50) {
      if (onTaskUpdate)
        onTaskUpdate(
          false,
          "You've uncovered over half the map! Check the hint if you are stuck.",
          true,
        );
    } else if (coverage >= 30) {
      if (onTaskUpdate)
        onTaskUpdate(
          false,
          "You've explored over 30% of the map! Watch how the line on the graph reacts as you move the sliders.",
        );
    } else {
      if (onTaskUpdate) onTaskUpdate(false, null);
    }
  }, [coverage, isDone, onTaskUpdate]);

  const dataPoints = useMemo(
    () => [
      { x: -0.8, y: 0 },
      { x: -0.4, y: 0 },
      { x: 0.0, y: 0 },
      { x: 0.4, y: 0 },
      { x: 0.8, y: 0 },
    ],
    [],
  );

  const currentLoss = useMemo(() => {
    let sumSqErr = 0;
    for (const pt of dataPoints) {
      sumSqErr += Math.pow(pt.y - (weight * pt.x + bias), 2);
    }
    return sumSqErr / dataPoints.length;
  }, [weight, bias, dataPoints]);

  const mapX = (val: number) => `${50 + val * 45}%`;
  const mapY = (val: number) => `${50 - val * 45}%`;

  const LineGraphContent = (
    <View style={{ flex: 1, width: '100%' }}>
      <Svg width='100%' height='100%'>
        <Rect
          width='100%'
          height='100%'
          fill={theme.colors.background}
          rx={4}
        />
        {/* Y-Axis */}
        <Line
          x1='50%'
          y1='0%'
          x2='50%'
          y2='100%'
          stroke={theme.colors.border}
          strokeWidth={1}
        />

        {/* X-Axis */}
        <Line
          x1='0%'
          y1='50%'
          x2='100%'
          y2='50%'
          stroke={theme.colors.border}
          strokeWidth={1}
        />

        {dataPoints.map((p, i) => {
          const predictedY = weight * p.x + bias;
          return (
            <Line
              key={`residual-${i}`}
              x1={mapX(p.x)}
              y1={mapY(p.y)}
              x2={mapX(p.x)}
              y2={mapY(predictedY)}
              stroke='#ff4d4d'
              strokeWidth={1.5}
              strokeDasharray='3, 3'
              opacity={0.6}
            />
          );
        })}

        <Line
          x1={mapX(-1)}
          y1={mapY(weight * -1 + bias)}
          x2={mapX(1)}
          y2={mapY(weight * 1 + bias)}
          stroke={'#f59e0b'}
          strokeWidth={'3'}
        />

        {dataPoints.map((p, i) => (
          <Circle
            key={`point-${i}`}
            cx={mapX(p.x)}
            cy={mapY(p.y)}
            r={4}
            fill={theme.colors.foreground}
          />
        ))}
      </Svg>
    </View>
  );

  return (
    <GestureHandlerRootView style={styles.mainContainer}>
      <View style={styles.groupContainer}>
        {/* LEFT PANEL */}
        <View style={styles.subPanel}>
          <View
            style={[
              styles.subHeader,
              { borderBottomColor: theme.colors.border },
            ]}
          >
            <BarChart3 size={12} color={theme.colors.accent} />
            <Text style={styles.subTitle}>MODEL PERFORMANCE</Text>
          </View>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* LINE GRAPH */}
            <View style={styles.wideGraphBox}>{LineGraphContent}</View>

            {/* METRIC STRIP */}
            <View
              style={[
                styles.metricStrip,
                {
                  backgroundColor: isDark
                    ? 'rgba(0,0,0,0.2)'
                    : 'rgba(0,0,0,0.03)',
                },
              ]}
            >
              <View>
                <Text
                  style={[
                    styles.metricLabel,
                    { color: theme.colors.mutedForeground },
                  ]}
                >
                  MSE LOSS
                </Text>
                <Text style={styles.metricValue}>{currentLoss.toFixed(4)}</Text>
              </View>
            </View>

            {/* SUCCESS TEXT */}
            {isDone && (
              <Animated.View
                style={[
                  styles.successBox,
                  successAnimatedStyle,
                  {
                    borderColor: successColor,
                    backgroundColor: successBgColor,
                  },
                ]}
              >
                <Text style={[styles.successText, { color: successColor }]}>
                  You found the minimum!
                  {'\n\n'}
                  At this point, the line fits the dataset. The error (loss)
                  increases as you move the weight or bias away from this ideal
                  combination.
                </Text>
              </Animated.View>
            )}

            {/* CONTROLS */}
            <View style={styles.controlGroup}>
              <View style={styles.sliderGroup}>
                <Text
                  style={[
                    styles.controlLabel,
                    { color: theme.colors.mutedForeground },
                  ]}
                >
                  WEIGHT (w): {weight.toFixed(2)}
                </Text>
                <Slider
                  style={{ flex: 1, height: 40, marginTop: 4 }}
                  minimumValue={-1}
                  maximumValue={1}
                  value={weight}
                  onValueChange={setWeight}
                  minimumTrackTintColor={theme.colors.accent}
                  thumbTintColor={theme.colors.foreground}
                />
              </View>

              <View style={styles.sliderGroup}>
                <Text
                  style={[
                    styles.controlLabel,
                    { color: theme.colors.mutedForeground },
                  ]}
                >
                  BIAS (b): {bias.toFixed(2)}
                </Text>
                <Slider
                  style={{ flex: 1, height: 40, marginTop: 4 }}
                  minimumValue={-1}
                  maximumValue={1}
                  value={bias}
                  onValueChange={setBias}
                  minimumTrackTintColor={theme.colors.accent}
                  thumbTintColor={theme.colors.foreground}
                />
              </View>
            </View>
          </ScrollView>
        </View>

        {/* RIGHT PANEL (LANDSCAPE) */}
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
            <Map size={12} color={theme.colors.accent} />
            <Text style={styles.subTitle}>LOSS LANDSCAPE</Text>

            <View style={styles.headerControls}>
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
              >
                <Text
                  style={{
                    color: theme.colors.foreground,
                    fontSize: 10,
                    fontWeight: 'bold',
                    opacity: is3D ? 1 : 0.5,
                  }}
                >
                  3D
                </Text>
                <Switch checked={is3D} onCheckedChange={setIs3D} />
              </View>

              <TouchableOpacity onPress={onRefreshPress}>
                <Animated.View style={refreshStyle}>
                  <RefreshCw size={16} color={theme.colors.foreground} />
                </Animated.View>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.canvasCenter}>
            <LossHeatmap
              weight={weight}
              bias={bias}
              currentLoss={currentLoss}
              dataPoints={dataPoints}
              isHeld={isHeld}
              isDone={isDone}
              is3D={is3D}
              refreshKey={refreshKey}
              onResult={handleHeatmapResult}
              onCoverageUpdate={setCoverage}
            />
          </View>
        </View>
      </View>
    </GestureHandlerRootView>
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
  headerControls: {
    marginLeft: 'auto',
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  subTitle: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  scrollContent: { paddingHorizontal: 24, paddingVertical: 24 },
  wideGraphBox: { width: '100%', aspectRatio: 2.1, marginBottom: 20 },
  metricStrip: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    padding: 16,
    borderRadius: 6,
  },
  metricLabel: { fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  metricValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#f59e0b',
    marginTop: 4,
  },
  controlGroup: { width: '100%', gap: 16 },
  controlLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  sliderGroup: { marginBottom: 8 },
  canvasCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  successBox: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 20,
  },
  successText: {
    fontWeight: '600',
    fontSize: 13,
    lineHeight: 18,
  },
});
