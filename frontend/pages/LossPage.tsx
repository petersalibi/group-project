import React, { useState, useEffect, useMemo } from 'react';
import {
  Platform,
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  LayoutChangeEvent,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Svg, { Line, Circle } from 'react-native-svg';
import {
  Maximize2,
  Minimize2,
  RefreshCw,
} from 'lucide-react-native';
import { TrainingMetrics } from '../components/training_metrics';
import { NetworkArchitecture } from '../components/network_architecture';

import { useTheme } from '../components/theme-provider';
import { useLoading } from '../components/loading-provider';
import { LayoutManager } from '../components/docking-provider';
import { DockPanel } from '../components/dock-panel';
import { StatsGroupPanel } from '../components/stats-group-panel';
import { Switch } from '../components/switch';
import { Text } from '../components/text';
import { NumberInput } from '../components/number-input';
import { Tooltip } from '../components/tooltip';
import { LossHeatmap } from '../components/loss-heatmap';
import { Slider } from '../components/slider';

import {
  DropdownMenu,
  DropdownMenuTrigger,
} from '../components/dropdown-menu';

export function LossPage() {
  const { theme, isDark } = useTheme();
  const { setIsLoading } = useLoading();
  const brandAccent = isDark ? '#C6F382' : '#353F91';

  const [activation, setActivation] = useState<string>('Tanh');
  const [depth, setDepth] = useState<number>(1);
  const [width, setWidth] = useState<number>(1);
  const [inputs] = useState(['x']);
  const [outputs] = useState(1);
  const [isMaximized, setIsMaximized] = useState(false);

  // Heatmap State
  const [weight, setWeight] = useState(-1);
  const [bias, setBias] = useState(-1);
  const [isDone, setIsDone] = useState(false);
  const [isHeld, setIsHeld] = useState(false);
  const [is3D, setIs3D] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

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
    setBias(-1);
    setIsDone(false);
    scale.value = 0;
    setRefreshKey(prev => prev + 1);
  };

  const refreshStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${refreshAnim.value}deg` }],
  }));

  const [localDims, setLocalDims] = useState({ width: 0, height: 0 });

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setLocalDims({ width, height });
  };

  const handleHeatmapResult = (isCorrect: boolean) => {
    if (isCorrect) {
      setIsDone(true);
      scale.value = withSpring(1, { damping: 20, stiffness: 500 });
    }
  };

  const dataPoints = useMemo(() => [
    { x: -0.8, y: 0 },
    { x: -0.4, y: 0 },
    { x:  0.0, y:  0 },
    { x:  0.4, y:  0 },
    { x:  0.8, y:  0 },
  ], []);

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
    <View style={{ flex: 1, width: '100%', minHeight: 60, marginTop: 4 }}>
      <Svg width="100%" height="100%">
        
        {/* Y-Axis */}
        <Line x1="50%" y1="0%" x2="50%" y2="100%" stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
        
        {/* X-Axis */}
        <Line x1="0%" y1="50%" x2="100%" y2="50%" stroke="rgba(255,255,255,0.2)" strokeWidth={1} />

        {/* Draw the dataset points */}
        {dataPoints.map((p, i) => (
          <Circle 
            key={i} 
            cx={mapX(p.x)} 
            cy={mapY(p.y)} 
            r={3.5} 
            fill="#22f3ff" 
          />
        ))}

        <Line
          x1={mapX(-1)}
          y1={mapY(weight * -1 + bias)} 
          x2={mapX(1)}
          y2={mapY(weight * 1 + bias)} 
          stroke={brandAccent}
          strokeWidth={2}
        />
      </Svg>
    </View>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={handleLayout}>
      {localDims.width > 0 && localDims.height > 0 && (
        <LayoutManager width={localDims.width} height={localDims.height}>
          <DockPanel
            id='CONFIG'
            title='MODEL CONFIGURATION'
            isMaximized={false}
          >
            <ScrollView contentContainerStyle={styles.sidebarContent}>

              {/* INSTRUCTIONS */}
              <View style={styles.controlGroup}>
                <Text style={styles.label}>INSTRUCTIONS</Text>
                <Text style={styles.subText}>
                  Adjust the sliders to find the optimal Weight and Bias that 
                  minimises the network's error on the dataset.
                  {'\n\n'}
                  The map is hidden until you explore it. (Hint: warm colors = high loss,
                  dark/cool colors = low loss)
                </Text>
              </View>
              {/* SUCCESS TEXT */}
              {isDone && (
                <Animated.View style={[styles.successBox, successAnimatedStyle]}>
                  <Text style={styles.successText}>
                    You found the minimum!
                    {'\n'}
                    At this point, the network's line perfectly fits the dataset.
                    {'\n'}
                    The error (loss) increases as you move the weight or bias away from this ideal combination.
                  </Text>
                </Animated.View>
              )}
              {/* DATASET DROPDOWN */}
              <View style={styles.controlGroup}>
                <Text style={styles.label}>DATASET</Text>
                <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
                  <View style={{ flex: 1 }}>
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <View style={[styles.dropdownTrigger, { borderColor: theme.colors.border }]}>
                          <Text style={styles.dropdownValue}>Simple Linear Data</Text>
                        </View>
                      </DropdownMenuTrigger>
                    </DropdownMenu>
                  </View>
                </View>
              </View>

              {/* ARCHITECTURE */}
              <View style={styles.controlGroup}>
                <Text style={styles.label}>ARCHITECTURE</Text>
                <View style={styles.rowGap}>
                  <View style={{ flex: 1 }}>
                    <Tooltip tip='The number of hidden layers in the network.'>
                      <Text style={styles.subLabel}>Depth</Text>
                    </Tooltip>
                    <NumberInput
                      defaultValue={1}
                      disabled={true}
                      value={1}
                      step={1}
                      min={1}
                      max={100}
                    />
                  </View>
                </View>
              </View>

              {/* LIVE PARAMETERS / SLIDERS */}
              <View style={styles.controlGroup}>
                <Text style={styles.label}>NETWORK PARAMETERS</Text>
                
                <View style={styles.sliderGroup}>
                  <Text style={styles.subLabel}>Weight (w)</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Slider
                      style={{ flex: 1, height: 40 }}
                      minimumValue={-1}
                      maximumValue={1}
                      value={weight}
                      onValueChange={setWeight}
                      minimumTrackTintColor={isDone ? '#666' : '#ff4d4d'}
                      thumbTintColor={isDone ? '#888' : '#fff'}
                      disabled={isDone}
                    />
                    <Text style={{ marginLeft: 10, minWidth: 35, fontSize: 12 }}>
                      {(weight).toFixed(2)}
                    </Text>
                  </View>
                </View>

                <View style={styles.sliderGroup}>
                  <Text style={styles.subLabel}>Bias (b)</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Slider
                      style={{ flex: 1, height: 40 }}
                      minimumValue={-1}
                      maximumValue={1}
                      value={bias}
                      onValueChange={setBias}
                      minimumTrackTintColor={isDone ? '#666' : '#1e00ff'}
                      thumbTintColor={isDone ? '#888' : '#fff'}
                      disabled={isDone}
                    />
                    <Text style={{ marginLeft: 10, minWidth: 35, fontSize: 12 }}>
                      {(bias).toFixed(2)}
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          </DockPanel>

          {/* ENGINE AREA */}
          <DockPanel
            id='ENGINE'
            title='LOSS LANDSCAPE VISUALISATION'
            isMaximized={isMaximized}
          >
            <View style={styles.engineContainer}>
              <View style={styles.engineHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginRight: 8 }}>
                  <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold', opacity: is3D ? 1 : 0.5 }}>3D</Text>
                  <Switch 
                    checked={is3D} 
                    onCheckedChange={setIs3D} 
                  />
                </View>
                <TouchableOpacity
                  onPress={() => setIsMaximized(!isMaximized)}
                  style={{ zIndex: 10 }}
                >
                  {isMaximized ? (
                    <Minimize2 size={18} color='white' />
                  ) : (
                    <Maximize2 size={18} color='white' />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={onRefreshPress}
                  style={{ opacity: 1 }}
                >
                  <Animated.View style={refreshStyle}>
                    <RefreshCw size={18} color='white' />
                  </Animated.View>
                </TouchableOpacity>
              </View>

              {/* Centered Canvas Container */}
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
                />
              </View>
            
            </View>
          </DockPanel>

          <StatsGroupPanel
            archContent={
              <NetworkArchitecture
                inputs={inputs.length || 0}
                depth={depth}
                width={width}
                activation={activation}
                outputs={outputs}
                weights={[weight, bias]} // Network Weights connected to state
              />
            }
            metricsContent={
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'stretch', gap: 12 }}>
                <View style={{ 
                  flex: 1,
                  borderRadius: 8, 
                  borderWidth: 1, 
                  borderColor: theme.colors.border, 
                  padding: 12,
                }}>
                  <Text style={{ fontSize: 9, fontWeight: "700", color: theme.colors.mutedForeground, letterSpacing: 0.5 }}>DATA FIT</Text>
                  {LineGraphContent}
                </View>
                <View style={{ flex: 1 }}>
                  <TrainingMetrics
                    currentLoss={currentLoss}
                    lossChange={null}
                    fidelity={null}
                    log={null}
                    isPathLoaded={true}
                  />
                </View>
              </View>
            }
          />
        </LayoutManager>
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  sidebarContent: { padding: 16, gap: 24 },
  controlGroup: { gap: 8 },
  label: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5, opacity: 0.8 },
  subLabel: { fontSize: 9, fontWeight: '600', opacity: 0.5, marginBottom: 2 },
  subText: { opacity: 0.7, fontSize: 12 },
  rowGap: { flexDirection: 'row', gap: 10 },
  dropdownTrigger: {
    height: 36,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  dropdownValue: { fontSize: 12 },
  engineContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    overflow: 'hidden',
    position: 'relative',
  },
  canvasCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  engineHeader: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    gap: 16,
    zIndex: 10,
  },
  sliderGroup: { marginBottom: 10 },
  successBox: {
    padding: 10,
    marginTop: 10,
    backgroundColor: 'rgba(34, 243, 255, 0.1)',
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'column',
    gap: 10,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(34, 243, 255, 0.3)'
  },
  successText: {
    color: '#22f3ff',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 14,
  },
});