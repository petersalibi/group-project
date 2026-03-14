import React, { useState, useMemo, useEffect, useRef } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from "../../components/theme-provider";
import { Text } from "../../components/text";
import { Slider } from "../../components/slider";
import { Target, RefreshCw, ZoomIn, ZoomOut, BarChart3, Layers, Layers2 } from "lucide-react-native";
import Svg, { Circle, Line as SvgLine, G, Rect } from "react-native-svg";
import * as THREE from 'three';

import { 
  initScene, 
  cleanupScene, 
  handleResize, 
  createOriginLandscape, 
  updateOriginHeights 
} from '../../utils/threejs-utils';

const DATA = Array.from({ length: 45 }, (_, i) => {
  const x = -0.98 + (i * 0.045); 
  return { x, y: (x * 0.45) + (Math.sin(i * 0.4) * 0.12) + (Math.cos(i * 0.9) * 0.08) };
});

const GRID_SIZE = 14; 

export function LandscapeOriginLesson({ onTaskUpdate }: any) {
  const { theme, isDark } = useTheme();
  const successColor = isDark ? '#C6F382' : '#16a34a';
  const successBgColor = isDark ? 'rgba(198, 243, 130, 0.05)' : 'rgba(22, 163, 74, 0.05)';
  const scale = useSharedValue(0);
  const successAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: scale.value,
  }));
  
  const [m, setM] = useState(0.5);
  const [b, setB] = useState(0);
  const [history, setHistory] = useState<any[]>([]);
  const [fillMode, setFillMode] = useState(1);

  const containerRef = useRef<any>(null);
  const sceneRef = useRef<any>(null);

  const currentMSE = useMemo(() => 
    DATA.reduce((acc, p) => acc + Math.pow((m * p.x + b) - p.y, 2), 0) / DATA.length, 
  [m, b]);

  const coverageScore = useMemo(() => {
    if (history.length === 0) return 0;

    let trueVolume = 0;
    let errorVolume = 0;

    const step = 20 / GRID_SIZE;
    for (let i = 0; i <= GRID_SIZE; i++) {
      for (let j = 0; j <= GRID_SIZE; j++) {
        const gridM = -10 + i * step;
        const gridB = -10 + j * step;

        let sumSqErr = 0;
        for (const pt of DATA) {
          sumSqErr += Math.pow(pt.y - (gridM * pt.x + gridB), 2);
        }
        const trueMSE = sumSqErr / DATA.length;
        trueVolume += trueMSE;

        let interpolatedMSE = 0;
        let totalWeight = 0;
        let weightedHeight = 0;

        for (const p of history) {
          const distSq = Math.pow(gridM - p.m, 2) + Math.pow(gridB - p.b, 2) + 0.2;
          const weight = 1 / Math.pow(distSq, 2.5);
          weightedHeight += p.mse * weight;
          totalWeight += weight;
        }
        if (totalWeight > 0) interpolatedMSE = weightedHeight / totalWeight;

        errorVolume += Math.abs(trueMSE - interpolatedMSE);
      }
    }

    const accuracy = Math.max(0, 1 - (errorVolume / trueVolume));
    return Math.round(accuracy * 100);
  }, [history]);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current as HTMLElement;
    const { scene, camera, renderer, controls } = initScene(container);

    camera.position.set(18, 15, 27);
    controls.target.set(0, 0, 0);
    controls.update();

    const Z_SCALE = 0.25; 

    const mesh = createOriginLandscape(GRID_SIZE, 20, theme.colors.accent);
    scene.add(mesh);

    const historyGroup = new THREE.Group();
    scene.add(historyGroup);

    const markerGroup = new THREE.Group();
    const ballGeom = new THREE.SphereGeometry(0.25, 16, 16);
    const ballMat = new THREE.MeshBasicMaterial({ color: '#f59e0b' });
    const ball = new THREE.Mesh(ballGeom, ballMat);
    
    const stemGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, -10, 0)
    ]);
    const stemMat = new THREE.LineBasicMaterial({ color: '#f59e0b', transparent: true, opacity: 0.6 });
    const stem = new THREE.Line(stemGeom, stemMat);
    
    markerGroup.add(ball);
    markerGroup.add(stem);
    scene.add(markerGroup);

    const gridHelper = new THREE.GridHelper(20, GRID_SIZE, theme.colors.foreground, theme.colors.foreground);
    (gridHelper.material as THREE.Material).opacity = 0.1;
    (gridHelper.material as THREE.Material).transparent = true;
    scene.add(gridHelper);

    sceneRef.current = { scene, camera, renderer, controls, mesh, historyGroup, markerGroup, stem, Z_SCALE };

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
  }, [theme]);

  // --- UPDATE MESH, DOTS, AND TASK VALIDATION ---
  useEffect(() => {
    if (!sceneRef.current) return;
    const { mesh, historyGroup, Z_SCALE } = sceneRef.current;

    updateOriginHeights(mesh, history, Z_SCALE);

    while(historyGroup.children.length > 0){
      historyGroup.remove(historyGroup.children[0]);
    }

    const dotGeom = new THREE.SphereGeometry(0.12, 16, 16);
    const dotMat = new THREE.MeshBasicMaterial({ color: theme.colors.accent, transparent: true, opacity: 0.8 });
    
    history.forEach(p => {
      const dot = new THREE.Mesh(dotGeom, dotMat);
      dot.position.set(p.m, p.mse * Z_SCALE, p.b);
      historyGroup.add(dot);
    });

    if (onTaskUpdate) {
      if (coverageScore >= 70) {
        scale.value = withSpring(1, { damping: 20, stiffness: 500 });
        onTaskUpdate(true, null);
      } else if (history.length > 0) {
        
        // Dynamic coaching based on their progress
        if (coverageScore < 20) {
          onTaskUpdate(false, "Your landscape is flat! Map the edges (high loss) and the center (low loss) to cover the area.");
        } else if (coverageScore < 50) {
          onTaskUpdate(false, "It's taking shape. Keep plotting points in unmapped areas to pull the landscape into place.");
        } else {
          onTaskUpdate(false, `Almost there! Your landscape matches ${coverageScore}% of the true mathematical surface. Keep mapping!`);
        }
        
      } else {
        onTaskUpdate(false, null);
      }
    }

  }, [history, coverageScore, theme]);

  useEffect(() => {
    if (!sceneRef.current) return;
    const { markerGroup, stem, Z_SCALE } = sceneRef.current;
    const targetY = currentMSE * Z_SCALE;
    markerGroup.position.set(m, targetY, b);

    const stemGeom = stem.geometry as THREE.BufferGeometry;
    const pos = stemGeom.attributes.position;
    pos.setY(1, -targetY); 
    pos.needsUpdate = true;
  }, [m, b, currentMSE]);

  useEffect(() => {
    if (!sceneRef.current) return;
    const { mesh } = sceneRef.current;
    mesh.material.visible = false;
    mesh.userData.wireframe.visible = fillMode === 1;
  }, [fillMode]);

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
          <View style={[styles.subHeader, {borderBottomColor: theme.colors.border}]}>
            <BarChart3 size={12} color={theme.colors.accent} />
            <Text style={styles.subTitle}>DATASET RESIDUAL ANALYSIS</Text>
          </View>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.wideGraphBox}>
              <Svg width="100%" height="100%" viewBox="0 0 600 240">
                <Rect width="100%" height="100%" fill={theme.colors.background} rx={4} />
                <SvgLine x1="50" y1="120" x2="550" y2="120" stroke={theme.colors.border} strokeWidth="2" />
                
                {history.map((h, idx) => (
                  <SvgLine 
                    key={`ghost-${idx}`}
                    x1={50} y1={120-(h.m*-1+h.b)*60} 
                    x2={550} y2={120-(h.m*1+h.b)*60} 
                    stroke={theme.colors.accent} strokeWidth="1" opacity={0.5} 
                  />
                ))}

                {DATA.map((p, i) => (
                  <G key={i}>
                    <SvgLine x1={300+p.x*250} y1={120-p.y*60} x2={300+p.x*250} y2={120-(m*p.x+b)*60} stroke="#ff4d4d" strokeWidth="1.8" strokeDasharray="3,3" opacity={0.6} />
                    <Circle cx={300+p.x*250} cy={120-p.y*60} r="3.5" fill={theme.colors.foreground} />
                  </G>
                ))}
                
                <SvgLine x1={50} y1={120-(m*-1+b)*60} x2={550} y2={120-(m*1+b)*60} stroke="#f59e0b" strokeWidth="5" />
              </Svg>
            </View>

            {/* MSE LOSS METRIC */}
            <View style={[styles.metricStrip, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)', marginBottom: 12 }]}>
              <View>
                <Text style={[styles.metricLabel, { color: theme.colors.mutedForeground }]}>MSE LOSS</Text>
                <Text style={styles.metricValue}>{currentMSE.toFixed(6)}</Text>
              </View>
              <TouchableOpacity style={[styles.toggleBtn, {borderColor: theme.colors.border, backgroundColor: fillMode ? theme.colors.accent : theme.colors.background}]} onPress={() => setFillMode(fillMode === 1 ? 0 : 1)}>
                <Layers2 size={12} color={fillMode ? theme.colors.background : theme.colors.foreground} />
                <Text style={[styles.toggleText, {color: fillMode ? theme.colors.background : theme.colors.foreground}]}>{fillMode === 1 ? 'FILL: ON' : 'FILL: OFF'}</Text>
              </TouchableOpacity>
            </View>

            {/* EXPLORATION COVERAGE PROGRESS BAR */}
            <View style={[styles.metricStrip, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)', paddingVertical: 12 }]}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={[styles.metricLabel, { color: theme.colors.mutedForeground }]}>EXPLORATION COVERAGE</Text>
                  <Text style={{ fontSize: 12, fontWeight: '900', color: coverageScore >= 80 ? successColor : theme.colors.foreground }}>{coverageScore}%</Text>
                </View>
                <View style={{ height: 6, width: '100%', backgroundColor: theme.colors.border, borderRadius: 3, overflow: 'hidden' }}>
                  <View style={{ 
                    height: '100%', 
                    width: `${coverageScore}%`, 
                    backgroundColor: coverageScore >= 80 ? successColor : theme.colors.accent 
                  }} />
                </View>
              </View>
            </View>

            {/* SUCCESS TEXT */}
            {coverageScore >= 70 && (
              <Animated.View style={[styles.successBox, successAnimatedStyle, { borderColor: successColor, backgroundColor: successBgColor }]}>
                <Text style={[styles.successText, { color: successColor }]}>
                  You've successfully created a loss landscape!
                  {'\n\n'}
                  By recording models with high error (the peaks) and low error (the valley), you've revealed the true mathematical shape of the loss function.
                  {'\n\n'}
                  This 3D topography is exactly what neural networks "see" and navigate to find the optimal parameters!
                </Text>
              </Animated.View>
            )}

            <View style={styles.controlGroup}>
              <View style={styles.sliderGroup}>
                <Text style={[styles.controlLabel, {color: theme.colors.mutedForeground}]}>SLOPE (M): {m.toFixed(2)}</Text>
                <Slider 
                  style={{ flex: 1, height: 40, marginTop: 4 }}
                  value={m} min={-10} max={10} step={0.01} onValueChange={setM} 
                  minimumTrackTintColor={theme.colors.accent} thumbTintColor={theme.colors.foreground}
                />
              </View>
              
              <View style={styles.sliderGroup}>
                <Text style={[styles.controlLabel, {color: theme.colors.mutedForeground}]}>INTERCEPT (B): {b.toFixed(2)}</Text>
                <Slider 
                  style={{ flex: 1, height: 40, marginTop: 4 }}
                  value={b} min={-10} max={10} step={0.01} onValueChange={setB} 
                  minimumTrackTintColor={theme.colors.accent} thumbTintColor={theme.colors.foreground}
                />
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.captureBtn, { backgroundColor: coverageScore >= 80 ? successColor : theme.colors.accent }]} 
              onPress={() => setHistory([...history, {m, b, mse: currentMSE, id: Date.now()}])}
              disabled={coverageScore >= 70}
            >
              <Target size={16} color={theme.colors.background} />
              <Text style={[styles.captureBtnText, { color: theme.colors.background }]}>
                {coverageScore >= 70 ? "RECORDING COMPLETE" : "RECORD PARAMETER SET"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* RIGHT PANEL (THREE.JS) */}
        <View style={[styles.subPanel, { flex: 1.4, backgroundColor: 'rgba(0,0,0,0.05)' }]}>
          <View style={[styles.subHeader, {borderBottomColor: theme.colors.border, zIndex: 10}]}>
            <Layers size={12} color={theme.colors.accent} />
            <Text style={styles.subTitle}>3D ERROR TOPOGRAPHY</Text>
            <View style={styles.headerControls}>
              <TouchableOpacity onPress={() => handleZoom('in')}><ZoomIn size={16} color={theme.colors.foreground} /></TouchableOpacity>
              <TouchableOpacity onPress={() => handleZoom('out')}><ZoomOut size={16} color={theme.colors.foreground} /></TouchableOpacity>
              <TouchableOpacity onPress={() => {
                setHistory([]); 
                scale.value = withTiming(0);
                if (sceneRef.current) {
                   sceneRef.current.camera.position.set(18, 15, 27);
                   sceneRef.current.controls.target.set(0, 0, 0);
                }
              }}>
                <RefreshCw size={16} color={theme.colors.foreground} />
              </TouchableOpacity>
            </View>
          </View>
          
          <View ref={containerRef} style={{ flex: 1, width: '100%', minHeight: 0 }} />
          
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  groupContainer: { flex: 1, flexDirection: 'row', gap: 1 },
  subPanel: { flex: 1 },
  
  subHeader: { height: 40, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, borderBottomWidth: 1, gap: 8 },
  headerControls: { marginLeft: 'auto', flexDirection: 'row', gap: 16, alignItems: 'center' },
  subTitle: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  scrollContent: { paddingHorizontal: 24, paddingVertical: 24 },
  wideGraphBox: { width: '100%', aspectRatio: 2.1, marginBottom: 20 },
  
  metricStrip: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, padding: 16, borderRadius: 6 },
  metricLabel: { fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  metricValue: { fontSize: 28, fontWeight: '700', color: '#f59e0b', marginTop: 4 },
  
  toggleBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6, borderWidth: 1 },
  toggleText: { fontSize: 8, fontWeight: '900' },
  
  controlGroup: { width: '100%', gap: 16 },
  controlLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  sliderGroup: { marginBottom: 8 },
  
  captureBtn: { height: 48, borderRadius: 8, marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  captureBtnText: { fontSize: 11, fontWeight: '900' },

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