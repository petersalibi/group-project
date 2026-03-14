import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  Network,
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

export function ArchitectureComplexityLesson({ onTaskUpdate }: any) {
  const { theme, isDark } = useTheme();
  const successColor = isDark ? '#C6F382' : '#16a34a';
  const successBgColor = isDark
    ? 'rgba(198, 243, 130, 0.05)'
    : 'rgba(22, 163, 74, 0.05)';

  const [depth, setDepth] = useState(1);
  const [width, setWidth] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [hasSeenChaos, setHasSeenChaos] = useState(false);
  const [hasSeenSmoothing, setHasSeenSmoothing] = useState(false);

  const scale = useSharedValue(0);
  const successAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: scale.value,
  }));

  const containerRef = useRef<any>(null);
  const sceneRef = useRef<any>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);

  const complexityScore = useMemo(() => {
    if (depth === 1) return 0;
    const chaos = (depth - 1) * 35;
    const smoothing = Math.max(1, width * 0.4);
    return Math.min(100, Math.round(chaos / smoothing));
  }, [depth, width]);

  const complexityLabel = useMemo(() => {
    if (complexityScore < 20) return 'CONVEX (SMOOTH BOWL)';
    if (complexityScore < 50) return 'WAVY (SMOOTH FOLDS)';
    if (complexityScore < 80) return 'WARPED (STEEP SLOPES)';
    return 'HIGHLY NON-CONVEX (CHAOTIC)';
  }, [complexityScore]);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current as HTMLElement;
    const { scene, camera, renderer, controls } = initScene(container);

    camera.position.set(0, 4, 2);
    controls.target.set(0, 0, 0);
    controls.update();

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

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

  // Fetch landscape from api
  useEffect(() => {
    let isMounted = true;

    const fetchLandscape = async () => {
      if (!sceneRef.current) return;
      setIsLoading(true);

      try {
        const payload = {
          network: {
            activation: 'Tanh',
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

        const dict = resp.data;
        if (!dict?.surface || !dict.x_axis || !dict.y_axis) {
          throw new Error('Invalid data received from API');
        }

        const { scene } = sceneRef.current;

        // Clean up the old mesh before adding the new one
        if (meshRef.current) {
          scene.remove(meshRef.current);
          meshRef.current.geometry.dispose();
          if (Array.isArray(meshRef.current.material)) {
            meshRef.current.material.forEach((m) => m.dispose());
          } else {
            meshRef.current.material.dispose();
          }
        }

        const { mesh } = createLandscapeMesh(false, dict, 3.5);

        if (mesh.userData.wireframe) {
          mesh.userData.wireframe.visible = false;
        }

        scene.add(mesh);
        meshRef.current = mesh;

        if (complexityScore > 80 && !hasSeenChaos) {
          setHasSeenChaos(true);
        }

        if (hasSeenChaos && width >= 4 && !hasSeenSmoothing) {
          setHasSeenSmoothing(true);
        }
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
  }, [depth, width]); // Re-fetch whenever depth or width change

  useEffect(() => {
    if (onTaskUpdate) {
      if (hasSeenSmoothing) {
        scale.value = withSpring(1, { damping: 20, stiffness: 500 });
        onTaskUpdate(true, null);
      } else if (!hasSeenChaos) {
        if (width >= 3 && depth <= 2) {
          onTaskUpdate(
            false,
            'Adding Width smooths the landscape. Increase Depth first to fold the space and create chaos.',
            true,
          );
        } else {
          onTaskUpdate(false, null);
        }
      } else {
        onTaskUpdate(
          false,
          'Now, increase the width. Notice how over-parameterising the network smooths the sweeping valleys out!',
          true,
        );
      }
    }
  }, [hasSeenChaos, hasSeenSmoothing, width, depth, onTaskUpdate, scale]);

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
            <Network size={12} color={theme.colors.accent} />
            <Text style={styles.subTitle}>NETWORK CAPACITY</Text>
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
                A simple 1-layer network cannot bend to fit a wavy sine curve.
                As we add hidden layers, the network gains the ability to "fold"
                the space, creating sweeping periodic valleys in the landscape.
                {'\n\n'}
                <Text style={{ fontStyle: 'italic' }}>
                  (Think of these folds as the network's "flexibility" to bend
                  its predictions—you will learn exactly how this works later!)
                </Text>
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
                activation={'Tanh'}
                outputs={1}
                weights={[]}
              />
            </View>

            {/* COMPLEXITY METRIC */}
            <View
              style={[
                styles.metricStrip,
                {
                  backgroundColor: isDark
                    ? 'rgba(0,0,0,0.2)'
                    : 'rgba(0,0,0,0.03)',
                  marginBottom: 16,
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 6,
                  }}
                >
                  <Text
                    style={[
                      styles.metricLabel,
                      { color: theme.colors.mutedForeground },
                    ]}
                  >
                    LANDSCAPE COMPLEXITY
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '900',
                      color:
                        complexityScore > 80
                          ? '#ef4444'
                          : theme.colors.foreground,
                    }}
                  >
                    {complexityScore}%
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: 'bold',
                    color: theme.colors.foreground,
                    marginBottom: 12,
                  }}
                >
                  {complexityLabel}
                </Text>
                <View
                  style={{
                    height: 6,
                    width: '100%',
                    backgroundColor: theme.colors.border,
                    borderRadius: 3,
                    overflow: 'hidden',
                  }}
                >
                  <View
                    style={{
                      height: '100%',
                      width: `${complexityScore}%`,
                      backgroundColor:
                        complexityScore > 80 ? '#ef4444' : theme.colors.accent,
                    }}
                  />
                </View>
              </View>
            </View>

            {/* SUCCESS TEXT */}
            {hasSeenSmoothing && (
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
                  You discovered a deep learning secret!
                  {'\n\n'}
                  Adding Depth creates chaotic folds and local minimums, but
                  making the layers Wider (over-parameterisation) smooths the
                  landscape out, making it easier for Optimisers to find the
                  bottom.
                </Text>
              </Animated.View>
            )}

            {/* ARCHITECTURE CONTROLS */}
            <View style={styles.controlGroup}>
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
                  setDepth(1);
                  setWidth(1);
                  setHasSeenChaos(false);
                  setHasSeenSmoothing(false);
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
  wideGraphBox: { width: '100%', minHeight: 120, justifyContent: 'center' },
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
  controlGroup: { width: '100%', gap: 16 },
  controlLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  sliderGroup: { marginBottom: 8 },
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
