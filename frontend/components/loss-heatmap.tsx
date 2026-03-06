import React, { useMemo, useEffect, useState, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from './text';
import Svg, { Line, Circle, Rect, Polygon, Defs, RadialGradient, Stop, Text as SvgText } from 'react-native-svg';
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
const TARGET_INDEX = 10;

interface LossHeatmapProps {
  weight: number;
  bias: number;
  isHeld: boolean;
  isDone: boolean;
  is3D: boolean;
  refreshKey: number;
  onResult: (isCorrect: boolean) => void;
}

export function LossHeatmap({ weight, bias, isHeld, is3D, isDone, refreshKey, onResult }: LossHeatmapProps) {
  const [visited, setVisited] = useState(new Set(['0-0', '0-1', '1-0', '1-1']));
  const containerRef = useRef<any>(null);
  const sceneRef = useRef<any>(null);

  // --- GRID TARGET LOGIC ---
  const currentGridX = Math.min(GRID - 1, Math.round(weight * GRID));
  const currentGridY = Math.min(GRID - 1, Math.round(bias * GRID));

  useEffect(() => {
    setVisited(new Set(['0-0', '0-1', '1-0', '1-1']));
  }, [refreshKey]);

  useEffect(() => {
    if (!isDone && currentGridX === TARGET_INDEX && currentGridY === TARGET_INDEX && !isHeld) {
      onResult(true);
      return;
    }

    if (!isDone) {
      const newVisited = new Set(visited);
      let changed = false;
      for (let x = currentGridX - 1; x <= currentGridX + 1; x++) {
        for (let y = currentGridY - 1; y <= currentGridY + 1; y++) {
          if (x >= 0 && x < GRID && y >= 0 && y < GRID) {
            const key = `${x}-${y}`;
            if (!newVisited.has(key)) {
              newVisited.add(key);
              changed = true;
            }
          }
        }
      }
      if (changed) setVisited(newVisited);
    }
  }, [currentGridX, currentGridY, isDone, visited, onResult, isHeld]);

  const gradientStops = useMemo(() => {
    const stops = [];
    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      const dist = (i / steps) * 0.707;
      const loss = Math.min(1, dist * 1.5);
      const hue = 280 - loss * 280; 
      const lightness = 25 + loss * 35;
      
      stops.push(
        <Stop 
          key={i} 
          offset={`${(i / steps) * 100}%`} 
          stopColor={`hsl(${hue}, 80%, ${lightness}%)`} 
        />
      );
    }
    return stops;
  }, []);

  const fogOfWar2D = useMemo(() => {
    if (is3D) return [];
    const fog = [];
    for (let i = 0; i < GRID; i++) {
      for (let j = 0; j < GRID; j++) {
        const isVisible = isDone || visited.has(`${i}-${j}`);
        if (!isVisible) {
          fog.push(
            <Rect
              key={`fog-${i}-${j}`}
              x={i * CELL_SIZE}
              y={MAP_SIZE - (j + 1) * CELL_SIZE}
              width={CELL_SIZE + 0.6}
              height={CELL_SIZE + 0.6}
              fill="#0a0a0a"
            />
          );
        }
      }
    }
    return fog;
  }, [is3D, isDone, visited]);

  useEffect(() => {
    if (!is3D || !containerRef.current) return;

    const container = containerRef.current as HTMLElement;
    const { scene, camera, renderer, controls } = initScene(container);
    
    camera.position.set(0, 3, 2.5);
    controls.target.set(0, 0.5, 0); 
    controls.update();

    // Generate Landscape
    const Z_SCALE = 3.5;
    const mseData = generateMSEData(GRID);
    const { mesh } = createLandscapeMesh(false, mseData, Z_SCALE);
    mesh.material = new THREE.MeshLambertMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
    });
    scene.add(mesh);

    const axisMaterial = new THREE.LineBasicMaterial({ color: 0x666666, linewidth: 4 });
    const axisPoints = [
      new THREE.Vector3(-1, 0, -1),
      new THREE.Vector3(-1, 0, 1),
      new THREE.Vector3(1, 0, 1)
    ];
    const customAxes = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(axisPoints), 
      axisMaterial
    );
    scene.add(customAxes);

    // Create Marker Ball
    const ballGeometry = new THREE.SphereGeometry(0.03, 32, 32);
    const ballMaterial = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(0xffffff),
        emissive: new THREE.Color(0xffffff),
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
  }, [is3D]);

  // --- UPDATE VISIBILITY (FOG OF WAR) ---
  useEffect(() => {
    if (!is3D || !sceneRef.current) return;
    updateLandscapeVisibility(sceneRef.current.mesh, visited, isDone, GRID);
  }, [is3D, visited, isDone]);

  // --- UPDATE BALL POSITION ---
  useEffect(() => {
    if (!is3D || !sceneRef.current) return;
    const { ball, Z_SCALE } = sceneRef.current;

    const x = (weight - 0.5) * 2;
    const z = (0.5 - bias) * 2; 

    // Match the geometry's internal height mapping
    const dist = Math.sqrt(Math.pow(weight - 0.5, 2) + Math.pow(bias - 0.5, 2));
    const loss = Math.min(1, dist * 1.5);
    
    // Base scale is 0.4 (from createLandscapeMesh: Math.min(2, 2) * 0.2)
    // Multiplied by our new exaggerated Z_SCALE
    const heightMultiplier = 0.4 * Z_SCALE; 
    
    ball.position.set(x, loss * heightMultiplier + 0.03, z);
  }, [is3D, weight, bias]);

  const cx2D = weight * MAP_SIZE;
  const cy2D = MAP_SIZE - bias * MAP_SIZE;

  return (
    <View style={styles.mapWrapper}>
      
      {/* 2D RENDERER */}
      {!is3D && (
        <Svg 
          width="100%" 
          height="100%" 
          viewBox={`-25 -5 ${MAP_SIZE + 25} ${MAP_SIZE + 25}`}
        >
          <Defs>
            {/* Smooth mathematical bowl gradient */}
            <RadialGradient id="smoothBowl" cx="50%" cy="50%" r="70.7%">
              {gradientStops}
            </RadialGradient>
          </Defs>

          {/* 1. The Smooth Background */}
          <Rect x={0} y={0} width={MAP_SIZE} height={MAP_SIZE} fill="url(#smoothBowl)" />

          {/* 2. The Fog of War (Dark squares covering unvisited areas) */}
          {fogOfWar2D}

          {/* 3. Crosshairs & Target Ball */}
          <Line x1={0} y1={cy2D} x2={MAP_SIZE} y2={cy2D} stroke='white' opacity={0.3} />
          <Line x1={cx2D} y1={0} x2={cx2D} y2={MAP_SIZE} stroke='white' opacity={0.3} />
          <Circle cx={cx2D} cy={cy2D} r={6} fill='white' stroke='#000' strokeWidth={2} />

          {/* 4. Built-in, perfectly scaling SVG Axes */}
          <SvgText 
            x={MAP_SIZE} 
            y={MAP_SIZE + 20} 
            fill="white" 
            fontSize="15"
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
            fill="white" 
            fontSize="15" 
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
    width: '80%',
    height: '80%',
  },
});