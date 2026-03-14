import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../components/theme-provider';
import { Text } from '../../components/text';
import { Slider } from '../../components/slider';
import {
  Activity,
  Layers,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Database,
} from 'lucide-react-native';
import * as THREE from 'three';

import { NetworkArchitecture } from '../../components/network-architecture';

import api from '../../src/api';

import {
  initScene,
  cleanupScene,
  handleResize,
  createLandscapeMesh,
} from '../../utils/threejs-utils';

export function ActivationLesson({ onTaskUpdate }: any) {
  const { theme, isDark } = useTheme();
  const successColor = isDark ? '#C6F382' : '#16a34a';
  const successBgColor = isDark
    ? 'rgba(198, 243, 130, 0.05)'
    : 'rgba(22, 163, 74, 0.05)';

  const [activation, setActivation] = useState<'Linear' | 'ReLU' | 'Tanh'>(
    'Linear',
  );
  const [isLoading, setIsLoading] = useState(false);

  const [depth, setDepth] = useState(1);
  const [width, setWidth] = useState(1);

  // Task Progression
  const [hasSeenDeepLinear, setHasSeenDeepLinear] = useState(false);
  const [hasSeenDeepReLU, setHasSeenDeepReLU] = useState(false);
  const [hasSeenDeepTanh, setHasSeenDeepTanh] = useState(false);

  const scale = useSharedValue(0);
  const successAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: scale.value,
  }));

  const containerRef = useRef<any>(null);
  const sceneRef = useRef<any>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current as HTMLElement;
    const { scene, camera, renderer, controls } = initScene(container);

    camera.position.set(0, 4, 2);
    controls.target.set(0, 0, 0);
    controls.update();

    sceneRef.current = { scene, camera, renderer, controls };

    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => handleResize(container, camera, renderer, null);
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', onResize);
      cleanupScene(scene, renderer);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchLandscape = async () => {
      if (!sceneRef.current) return;
      setIsLoading(true);

      try {
        let dict: any;

        if (activation === 'Linear') {
          // FRONTEND PROCEDURAL GENERATION
          const res = 40;
          const surface = [];
          const axis = [];

          for (let i = 0; i <= res; i++) {
            axis.push((i / res) * 4 - 2);
          }

          for (let j = 0; j <= res; j++) {
            const row = [];
            for (let i = 0; i <= res; i++) {
              const x = axis[i];
              const y = axis[j];
              row.push((x * x + y * y) * 0.15);
            }
            surface.push(row);
          }

          dict = { surface, x_axis: axis, y_axis: axis };
          await new Promise((resolve) => setTimeout(resolve, 400));
          if (!isMounted) return;
        } else {
          // BACKEND API GENERATION (For ReLU and Tanh)
          const payload = {
            network: {
              activation: activation,
              depth: depth,
              width: width,
            },
            method: 'RANDOMDIRS',
            data: 'SINREGRESSION',
            loss: 'MSELoss',
            rawdata: null,
            args: null,
          };

          const resp = await api.post('/generatelandscape', payload);
          if (!isMounted) return;
          dict = resp.data;
        }

        if (!dict?.surface || !dict.x_axis || !dict.y_axis) {
          throw new Error('Invalid data received from API');
        }

        const { scene } = sceneRef.current;

        if (meshRef.current) {
          scene.remove(meshRef.current);
          meshRef.current.geometry.dispose();
          if (Array.isArray(meshRef.current.material)) {
            meshRef.current.material.forEach((m) => m.dispose());
          } else {
            meshRef.current.material.dispose();
          }
        }

        const { mesh } = createLandscapeMesh(false, dict, 2.0);
        scene.add(mesh);
        meshRef.current = mesh;

        // Progress the task milestones based on what they just generated
        if (
          activation === 'Linear' &&
          depth >= 3 &&
          width >= 3 &&
          !hasSeenDeepLinear
        )
          setHasSeenDeepLinear(true);
        if (hasSeenDeepLinear && activation === 'ReLU' && !hasSeenDeepReLU)
          setHasSeenDeepReLU(true);
        if (hasSeenDeepReLU && activation === 'Tanh' && !hasSeenDeepTanh)
          setHasSeenDeepTanh(true);
      } catch (err) {
        console.error('Failed to load landscape:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchLandscape();

    return () => {
      isMounted = false;
    };
  }, [activation, depth, width]);

  useEffect(() => {
    if (onTaskUpdate) {
      if (hasSeenDeepTanh) {
        scale.value = withSpring(1, { damping: 20, stiffness: 500 });
        onTaskUpdate(true, null);
      } else if (!hasSeenDeepLinear) {
        if (activation !== 'Linear') {
          onTaskUpdate(
            false,
            "Wait! Go back to 'Linear' first. Increase DEPTH and WIDTH to at least 3 to prove that deep linear networks are still just flat bowls.",
            true,
          );
        } else {
          onTaskUpdate(
            false,
            "Step 1: Prove that linear networks can't fold space. Increase DEPTH and WIDTH to at least 3.",
          );
        }
      } else if (!hasSeenDeepReLU) {
        onTaskUpdate(
          false,
          "Step 2: Notice it's STILL a flat bowl! Now, switch to 'ReLU' to see how non-linearity instantly shatters the landscape.",
        );
      } else {
        onTaskUpdate(
          false,
          "Step 3: ReLU creates sharp creases. Now switch to 'Tanh' to see how a smooth activation bends the landscape into waves.",
        );
      }
    }
  }, [
    activation,
    depth,
    width,
    hasSeenDeepLinear,
    hasSeenDeepReLU,
    hasSeenDeepTanh,
  ]);

  const handleZoom = (direction: 'in' | 'out') => {
    if (!sceneRef.current) return;
    const { camera } = sceneRef.current;
    const zoomFactor = direction === 'in' ? 0.8 : 1.2;
    camera.position.multiplyScalar(zoomFactor);
  };

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
            <Activity size={12} color={theme.colors.accent} />
            <Text style={styles.subTitle}>ACTIVATION FUNCTIONS</Text>
          </View>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* DATASET CONTEXT */}
            <View
              style={[
                styles.datasetBox,
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
                A network using only linear math can only draw straight lines,
                making it mathematically impossible to fit a wavy sine curve.
                Non-linear activation functions give the network the flexibility
                to "bend" its predictions to match the data.
                {'\n\n'}
                Without them, no matter how deep the architecture is, the loss
                landscape will always collapse back into a simple, flat bowl.
              </Text>
            </View>

            {/* NETWORK ARCHITECTURE VISUAL */}
            <View
              style={[
                styles.wideGraphBox,
                {
                  backgroundColor: isDark
                    ? 'rgba(0,0,0,0.2)'
                    : 'rgba(0,0,0,0.03)',
                  padding: 16,
                  borderRadius: 8,
                  opacity: isLoading ? 0.5 : 1,
                },
              ]}
            >
              <NetworkArchitecture
                inputs={1}
                depth={depth}
                width={width}
                activation={activation}
                outputs={1}
                weights={[]}
              />
            </View>

            {/* SUCCESS TEXT */}
            {hasSeenDeepTanh && (
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
                  You've mastered the shape of networks!
                  {'\n\n'}• <Text style={{ fontWeight: 'bold' }}>Linear:</Text>{' '}
                  Stays a smooth bowl, regardless of depth.
                  {'\n'}• <Text style={{ fontWeight: 'bold' }}>ReLU:</Text>{' '}
                  Shatters into sharp, piecewise-linear creases.
                  {'\n'}• <Text style={{ fontWeight: 'bold' }}>Tanh:</Text>{' '}
                  Melts into smooth, curving waves.
                </Text>
              </Animated.View>
            )}

            {/* ACTIVATION SELECTOR (PILLS) */}
            <View style={styles.controlGroup}>
              <Text
                style={[
                  styles.controlLabel,
                  { color: theme.colors.mutedForeground, marginBottom: 4 },
                ]}
              >
                SELECT ACTIVATION FUNCTION
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {['Linear', 'ReLU', 'Tanh'].map((act) => {
                  const isActive = activation === act;
                  return (
                    <TouchableOpacity
                      key={act}
                      disabled={isLoading}
                      style={[
                        styles.pillButton,
                        {
                          backgroundColor: isActive
                            ? theme.colors.accent
                            : 'transparent',
                          opacity: isLoading ? 0.5 : 1,
                        },
                      ]}
                      onPress={() => setActivation(act as any)}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          {
                            color: isActive
                              ? theme.colors.background
                              : theme.colors.mutedForeground,
                          },
                        ]}
                      >
                        {act}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* ARCHITECTURE CONTROLS */}
            <View style={[styles.controlGroup, { marginTop: 24 }]}>
              <View style={styles.sliderGroup}>
                <Text
                  style={[
                    styles.controlLabel,
                    { color: theme.colors.mutedForeground },
                  ]}
                >
                  NETWORK DEPTH (LAYERS): {depth}
                </Text>
                <Slider
                  style={{ flex: 1, height: 40, marginTop: 4 }}
                  value={depth}
                  min={1}
                  max={5}
                  step={1}
                  onValueChange={setDepth}
                  disabled={isLoading}
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
                  LAYER WIDTH (NEURONS): {width}
                </Text>
                <Slider
                  style={{ flex: 1, height: 40, marginTop: 4 }}
                  value={width}
                  min={1}
                  max={5}
                  step={1}
                  onValueChange={setWidth}
                  disabled={isLoading}
                  minimumTrackTintColor={theme.colors.accent}
                  thumbTintColor={theme.colors.foreground}
                />
              </View>
            </View>
          </ScrollView>
        </View>

        {/* RIGHT PANEL (THREE.JS) */}
        <View
          style={[
            styles.subPanel,
            {
              flex: 1.4,
              backgroundColor: 'rgba(0,0,0,0.05)',
              position: 'relative',
            },
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
            <View style={styles.headerControls}>
              <TouchableOpacity onPress={() => handleZoom('in')}>
                <ZoomIn size={16} color={theme.colors.foreground} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleZoom('out')}>
                <ZoomOut size={16} color={theme.colors.foreground} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setActivation('Linear');
                  setDepth(1);
                  setWidth(1);
                  setHasSeenDeepLinear(false);
                  setHasSeenDeepReLU(false);
                  setHasSeenDeepTanh(false);
                  scale.value = withTiming(0);
                  if (sceneRef.current) {
                    sceneRef.current.camera.position.set(0, 4, 2);
                    sceneRef.current.controls.target.set(0, 0, 0);
                  }
                }}
              >
                <RefreshCw size={16} color={theme.colors.foreground} />
              </TouchableOpacity>
            </View>
          </View>

          <View
            ref={containerRef}
            style={{ flex: 1, width: '100%', minHeight: 0 }}
          />

          {/* LOADING OVERLAY */}
          {isLoading && (
            <View style={[StyleSheet.absoluteFill, styles.loadingOverlay]}>
              <ActivityIndicator size='large' color={theme.colors.powderBlue} />
              <Text
                style={{ marginTop: 12, fontWeight: 'bold', color: '#fff' }}
              >
                Generating Topology...
              </Text>
            </View>
          )}
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
  headerControls: {
    marginLeft: 'auto',
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  subTitle: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  scrollContent: { paddingHorizontal: 24, paddingVertical: 24 },
  datasetBox: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 20,
  },
  wideGraphBox: {
    width: '100%',
    minHeight: 120,
    justifyContent: 'center',
    marginBottom: 20,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
  },
  toggleText: { fontSize: 8, fontWeight: '900' },
  controlGroup: { width: '100%', marginTop: 8 },
  controlLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  sliderGroup: { marginBottom: 8 },
  pillButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  pillText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
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
  loadingOverlay: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
});
