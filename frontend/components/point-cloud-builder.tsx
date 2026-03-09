import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Text, Float } from '@react-three/drei';
import * as THREE from 'three';

interface Point {
  x: number; // m (Slope)
  y: number; // b (Intercept)
  z: number; // Loss (Height)
  id: number;
}

interface Props {
  points: Point[];
  current: { m: number; b: number; mse: number };
}

export function PointCloudBuilder({ points, current }: Props) {
  return (
    <Canvas camera={{ position: [5, 5, 5], fmin: 0.1, fmax: 1000 }}>
      <color attach="background" args={['#050505']} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      
      {/* 1. THE FLOOR GRID (Parameter Space) */}
      <Grid 
        infiniteGrid 
        fadeDistance={20} 
        sectionSize={1} 
        cellSize={0.5} 
        sectionColor="#222" 
        cellColor="#111" 
      />

      {/* 2. PLOTTED HISTORICAL POINTS */}
      {points.map((p) => (
        <group key={p.id} position={[p.x, p.z / 2, p.y]}>
          {/* The Pillar */}
          <mesh>
            <cylinderGeometry args={[0.02, 0.02, p.z, 8]} />
            <meshStandardMaterial color="#444" transparent opacity={0.6} />
          </mesh>
          {/* The Point at the top */}
          <mesh position={[0, p.z / 2, 0]}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshStandardMaterial color="#C6F382" emissive="#C6F382" emissiveIntensity={0.5} />
          </mesh>
        </group>
      ))}

      {/* 3. THE "LIVE" GHOST POINT (Current Slider Position) */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <group position={[current.m, current.mse / 2, current.b]}>
          <mesh>
            <cylinderGeometry args={[0.01, 0.01, current.mse, 8]} />
            <meshStandardMaterial color="#f59e0b" dashSize={0.1} gapSize={0.1} transparent opacity={0.4} />
          </mesh>
          <mesh position={[0, current.mse / 2, 0]}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshStandardMaterial color="#f59e0b" wireframe />
          </mesh>
        </group>
      </Float>

      {/* 4. AXIS LABELS */}
      <Text position={[3, 0, 0]} fontSize={0.2} color="#666">Weight (m)</Text>
      <Text position={[0, 0, 3]} fontSize={0.2} color="#666" rotation={[0, Math.PI / 2, 0]}>Bias (b)</Text>
      <Text position={[0, 3, 0]} fontSize={0.2} color="#f59e0b" rotation={[0, Math.PI / 4, 0]}>LOSS</Text>

      <OrbitControls makeDefault />
    </Canvas>
  );
}