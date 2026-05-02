import React, { useMemo, useEffect, useState, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from "../components/theme-provider";
import Svg, { Line, Circle, Rect, Text as SvgText, Defs, Filter, FeGaussianBlur, G, ClipPath } from 'react-native-svg';
import * as THREE from 'three';

import { 
  initScene, 
  createLandscapeMesh, 
  cleanupScene, 
  handleResize, 
  generateMSEData,
  updateLandscapeVisibility // <-- Make sure to import the new function!
} from '../utils/threejs-utils';

const MAP_SIZE = 380;
const GRID = 20;
const CELL_SIZE = MAP_SIZE / GRID;

interface LossHeatmapProps {
  weight: number;
  bias: number;
  currentLoss: number;
  dataPoints: { x: number, y: number }[];
  isHeld: boolean;
  isDone: boolean;
  is3D: boolean;
  refreshKey: number;
  onResult: (isCorrect: boolean) => void;
  onCoverageUpdate?: (coverage: number) => void;
}

export function LossHeatmap({ weight, bias, currentLoss, dataPoints, isHeld, is3D, isDone, refreshKey, onResult, onCoverageUpdate }: LossHeatmapProps) {
  const { theme, isDark } = useTheme();
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const containerRef = useRef<any>(null);
  const sceneRef = useRef<any>(null);

  const currentGridX = Math.min(GRID, Math.max(0, Math.floor(((weight + 1) / 2) * GRID)));
  const currentGridY = Math.min(GRID, Math.max(0, Math.floor(((bias + 1) / 2) * GRID)));

  useEffect(() => {
    setVisited(new Set());
  }, [refreshKey]);

  useEffect(() => {
    if (!isDone && currentLoss < 0.01 && !isHeld) {
      onResult(true);
      return;
    }

    if (!isDone) {
      setVisited(prevVisited => {
        const newVisited = new Set(prevVisited);
        let changed = false;
        
        for (let x = currentGridX - 1; x <= currentGridX + 1; x++) {
          for (let y = currentGridY - 1; y <= currentGridY + 1; y++) {
            if (x >= 0 && x <= GRID && y >= 0 && y <= GRID) {
              const key = `${x}-${y}`;
              if (!newVisited.has(key)) {
                newVisited.add(key);
                changed = true;
              }
            }
          }
        }
        
        return changed ? newVisited : prevVisited;
      });
    }
  }, [currentGridX, currentGridY, currentLoss, isDone, onResult, isHeld]);

  useEffect(() => {
    if (onCoverageUpdate) {
      const totalVertices = Math.pow(GRID + 1, 2);
      const coveragePercent = (visited.size / totalVertices) * 100;
      onCoverageUpdate(coveragePercent);
    }
  }, [visited.size, onCoverageUpdate]);

  const landscape2D = useMemo(() => {
    if (is3D) return [];

    const mses = [];
    for (let i = 0; i < GRID; i++) {
      const row = [];
      for (let j = 0; j < GRID; j++) {
        const w = (i / (GRID - 1)) * 2 - 1;
        const b = (j / (GRID - 1)) * 2 - 1;
        let sumSqErr = 0;
        for (const pt of dataPoints) {
          sumSqErr += Math.pow(pt.y - (w * pt.x + b), 2);
        }
        const mse = sumSqErr / dataPoints.length;
        
        const visualLoss = Math.min(1, mse);
        row.push(visualLoss);
      }
      mses.push(row);
    }

    const flatMses = mses.flat();
    const minLoss = Math.min(...flatMses);
    const maxLoss = Math.max(...flatMses);
    const range = maxLoss - minLoss || 1;

    const RAINBOW = ['#9333ea', '#3b82f6', '#22d3ee', '#4ade80', '#eab308', '#ef4444'];
    const segmentCount = RAINBOW.length - 1;
    const _c1 = new THREE.Color();
    const _c2 = new THREE.Color();
    const _finalColor = new THREE.Color();

    const rects = [];
    
    for (let i = -1; i <= GRID; i++) {
      for (let j = -1; j <= GRID; j++) {
        const clampedI = Math.max(0, Math.min(GRID - 1, i));
        const clampedJ = Math.max(0, Math.min(GRID - 1, j));
        
        const val = mses[clampedI][clampedJ];
        const t = Math.max(0, Math.min(1, (val - minLoss) / range));

        const scaledT = t * segmentCount;
        const index = Math.floor(scaledT);
        const localT = scaledT - index;
        _c1.set(RAINBOW[Math.min(index, segmentCount)]);
        _c2.set(RAINBOW[Math.min(index + 1, segmentCount)]);
        _finalColor.copy(_c1).lerp(_c2, localT);

        rects.push(
          <Rect
            key={`bg-${i}-${j}`}
            x={i * CELL_SIZE}
            y={MAP_SIZE - (j + 1) * CELL_SIZE}
            width={CELL_SIZE + 1.5}
            height={CELL_SIZE + 1.5}
            fill={`#${_finalColor.getHexString()}`}
            stroke={`#${_finalColor.getHexString()}`}
            strokeWidth={1.5}
          />
        );
      }
    }
    return rects;
  }, [is3D, dataPoints]);

  const fogOfWar2D = useMemo(() => {
    if (is3D) return [];
    const fog = [];
    for (let i = 0; i < GRID; i++) {
      for (let j = 0; j < GRID; j++) {
        const isVisible = isDone || visited.has(`${i}-${j}`);
        if (!isVisible) {
          fog.push(
            <G key={`fog-${i}-${j}`}>
              <Rect
                x={i * CELL_SIZE}
                y={MAP_SIZE - (j + 1) * CELL_SIZE}
                width={CELL_SIZE + 1.5}
                height={CELL_SIZE + 1.5}
                fill={theme.colors.background}
                stroke={theme.colors.background}
                strokeWidth={1.5}
              />
              <Rect
                x={i * CELL_SIZE}
                y={MAP_SIZE - (j + 1) * CELL_SIZE}
                width={CELL_SIZE + 1.5}
                height={CELL_SIZE + 1.5}
                fill="rgba(0,0,0,0.1)"
                stroke="rgba(0,0,0,0.1)"
                strokeWidth={1.5}
              />
            </G>
          );
        }
      }
    }
    return fog;
  }, [is3D, isDone, visited, theme]);

  useEffect(() => {
    if (!is3D || !containerRef.current) return;

    const container = containerRef.current as HTMLElement;
    const { scene, camera, renderer, controls } = initScene(container);
    
    camera.position.set(0, 3, 2.5);
    controls.target.set(0, 0.5, 0); 
    controls.update();

    // Generate Landscape
    const Z_SCALE = 3.5;
    const mseData = generateMSEData(GRID, dataPoints);
    const { mesh } = createLandscapeMesh(false, mseData, Z_SCALE);
    mesh.material = new THREE.MeshLambertMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      transparent: true,
      alphaTest: 0.8,
    });
    scene.add(mesh);

    const axisMaterial = new THREE.MeshBasicMaterial({ 
      color: new THREE.Color(theme.colors.foreground),
    });

    // X-Axis (Weight)
    const xAxisGeom = new THREE.CylinderGeometry(0.015, 0.015, 2, 8);
    const xAxis = new THREE.Mesh(xAxisGeom, axisMaterial);
    xAxis.rotation.z = Math.PI / 2;
    xAxis.position.set(0, 0, 1); 
    scene.add(xAxis);

    // Z-Axis (Bias)
    const zAxisGeom = new THREE.CylinderGeometry(0.015, 0.015, 2, 8);
    const zAxis = new THREE.Mesh(zAxisGeom, axisMaterial);
    zAxis.rotation.x = Math.PI / 2;
    zAxis.position.set(-1, 0, 0);
    scene.add(zAxis);

    // 3D TEXT LABELS
    const createTextPlane = (text: string, isVertical: boolean) => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = theme.colors.foreground;
        ctx.font = 'bold 36px System, sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 256, 32); 
      }
      
      const texture = new THREE.CanvasTexture(canvas);
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy(); 
      
      const planeMat = new THREE.MeshBasicMaterial({ 
        map: texture, 
        transparent: true,
        side: THREE.DoubleSide
      });
      
      const planeGeom = new THREE.PlaneGeometry(0.8, 0.2);
      const plane = new THREE.Mesh(planeGeom, planeMat);
      
      // Lay the text flat on the 3D grid
      plane.rotation.x = -Math.PI / 2;
      
      if (isVertical) {
        // Rotate text 90 degrees so it points vertically along the Z-axis
        plane.rotation.z = Math.PI / 2;
      }
      
      return plane;
    };

    // Place Weight label at the bottom right corner (End of the X-axis)
    const weightLabel = createTextPlane("Weight →", false);
    weightLabel.position.set(0.6, 0.01, 1.2); 
    scene.add(weightLabel);

    // Place Bias label at the top left corner (Start of the Z-axis)
    const biasLabel = createTextPlane("Bias →", true);
    biasLabel.position.set(-1.2, 0.01, -0.6); 
    scene.add(biasLabel);

    // Create Marker Ball
    const ballGeometry = new THREE.SphereGeometry(0.03, 32, 32);
    const ballMaterial = new THREE.MeshPhysicalMaterial({
        color: '#fff',
        emissive: '#fff',
        emissiveIntensity: 0.5,
        metalness: 0.1,
        roughness: 0.1,
        clearcoat: 1.0,
        clearcoatRoughness: 0.0,
        reflectivity: 1.0,
    });
    const ball = new THREE.Mesh(ballGeometry, ballMaterial);
    ball.castShadow = true;
    scene.add(ball);

    sceneRef.current = { scene, camera, renderer, controls, ball, mesh, Z_SCALE };

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
      sceneRef.current = null;
    };
  }, [is3D, theme]);

  // --- UPDATE VISIBILITY (FOG OF WAR) ---
  useEffect(() => {
    if (!is3D || !sceneRef.current) return;
    updateLandscapeVisibility(sceneRef.current.mesh, visited, isDone, GRID);
  }, [is3D, visited, isDone, theme]);

  // --- UPDATE BALL POSITION ---
  useEffect(() => {
    if (!is3D || !sceneRef.current) return;
    const { ball, Z_SCALE } = sceneRef.current;

    const x = weight;
    const z = -bias;

    // Match visual geometry height
    const visualLoss = Math.min(1, currentLoss);
    const heightMultiplier = 0.4 * Z_SCALE; 
    const y = visualLoss * heightMultiplier + 0.04;
    
    ball.position.set(x, y, z);
  }, [is3D, weight, bias, currentLoss, theme]);

  const cx2D = ((weight + 1) / 2) * MAP_SIZE;
  const cy2D = MAP_SIZE - ((bias + 1) / 2) * MAP_SIZE;

  return (
    <View style={[
      styles.mapWrapper, 
      is3D && { width: '100%', height: '100%', overflow: 'visible' }
    ]}>
      
      {/* 2D RENDERER */}
      {!is3D && (
        <Svg 
          width="100%" 
          height="100%" 
          viewBox={`-35 -15 ${MAP_SIZE + 50} ${MAP_SIZE + 50}`} 
          preserveAspectRatio="xMidYMid meet"
        >
          <Defs>
            <Filter id="smoothBlur" x="-10%" y="-10%" width="120%" height="120%">
              <FeGaussianBlur in="SourceGraphic" stdDeviation="7" />
            </Filter>
            {/* Defines a strict bounding box to chop off overflowing blur */}
            <ClipPath id="mapClip">
              <Rect x={0} y={0} width={MAP_SIZE} height={MAP_SIZE} />
            </ClipPath>
          </Defs>

          {/* Apply the clip path to the smoothed background */}
          <G clipPath="url(#mapClip)">
            <G filter="url(#smoothBlur)">
              {landscape2D}
            </G>
          </G>

          {fogOfWar2D}

          <Line x1={0} y1={cy2D} x2={MAP_SIZE} y2={cy2D} stroke={theme.colors.foreground} />
          <Line x1={cx2D} y1={0} x2={cx2D} y2={MAP_SIZE} stroke={theme.colors.foreground} />
          <Circle cx={cx2D} cy={cy2D} r={6} fill='white' stroke='#000' strokeWidth={2} />

          <SvgText 
            x={MAP_SIZE} 
            y={MAP_SIZE + 22} 
            fill={theme.colors.foreground} 
            fontSize="20"
            fontFamily="System"
            fontWeight="bold"
            textAnchor="end" 
            opacity="0.8"
          >
            Weight →
          </SvgText>
          <SvgText 
            x={-10} 
            y={0} 
            fill={theme.colors.foreground}
            fontSize="20" 
            fontFamily="System"
            fontWeight="bold"
            textAnchor="end" 
            transform="rotate(-90, -10, 0)" 
            opacity="0.8"
          >
            Bias →
          </SvgText>
        </Svg>
      )}

      {/* 3D RENDERER */}
      {is3D && (
        <>
          <View ref={containerRef} style={{ flex: 1, minWidth: 0, backgroundColor: 'transparent' }} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mapWrapper: {
    position: 'relative',
    overflow: 'hidden',
    width: '90%',
    height: '90%',
  },
});