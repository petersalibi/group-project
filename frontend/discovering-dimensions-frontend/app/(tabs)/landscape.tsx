'use client';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'; // Used for camera control
import { Platform, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '@/src/api';
import { Picker } from '@react-native-picker/picker';
import Slider from '@react-native-community/slider';

export default function TabThreeScreen() {
  const [selectedSurface, setSelectedSurface] = useState('loss_filt.json');
  const [zValue, setZValue] = useState(1.0);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  useEffect(() => {
    // Create scene
    const container = document.getElementById('container');
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;

    // Create camera
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    camera.position.set(0, 1, 3);
    if (Platform.OS === 'web') {
      camera.zoom = 1.0;
    } else {
      camera.zoom = 0.5;
    }
    camera.updateProjectionMatrix();
    cameraRef.current = camera;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Add controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 0);
    controls.update();

    // Add lights
    const light = new THREE.DirectionalLight(0xffffff, 1.5);
    light.position.set(1, 1, 1);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));

    function animate() {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    }

    animate();

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }, []);

  useEffect(() => {
    if (!sceneRef.current) return;

    // Load JSON of {x, y, z} points
    async function loadAndBuild(url: string) {
      // Fetch JSON data
      const response = await api.get(`/data/${url}`);
      const json = await response.data;
      if (json.error) {
        alert(`Error loading data: ${json.error}`);
        return;
      }
      const data = json.data;

      // Convert to arrays
      const xs: number[] = data.map((p: { x: number }) => p.x);
      const ys: number[] = data.map((p: { y: number }) => p.y);
      const zs: number[] = data.map((p: { z: number }) => p.z);

      // Deduce grid resolution
      const uniqueX = [...new Set(xs)].sort((a, b) => a - b);
      const uniqueY = [...new Set(ys)].sort((a, b) => a - b);
      const nx = uniqueX.length;
      const ny = uniqueY.length;

      // Sort and map Z values into grid layout
      const zGrid = Array.from({ length: nx }, () => Array(ny).fill(0));
      data.forEach((p: { x: number; y: number; z: number }) => {
        const i = uniqueX.indexOf(p.x);
        const j = uniqueY.indexOf(p.y);
        if (i >= 0 && j >= 0) zGrid[i][j] = p.z;
      });

      // Compute width/height of the plane
      const width = uniqueX[uniqueX.length - 1] - uniqueX[0];
      const height = uniqueY[uniqueY.length - 1] - uniqueY[0];
      const widthSegments = nx - 1;
      const heightSegments = ny - 1;

      if (meshRef.current) {
        sceneRef.current!.remove(meshRef.current);
        meshRef.current.geometry.dispose();
        (meshRef.current.material as THREE.Material).dispose();
      }

      const geometry = new THREE.PlaneGeometry(
        width,
        height,
        widthSegments,
        heightSegments,
      );
      const positions = geometry.attributes.position;
      const vertexCount = positions.count;

      // Compute min/max for coloring
      const minZ = Math.min(...zs);
      const maxZ = Math.max(...zs);
      const range = maxZ - minZ || 1;
      const zScale = Math.min(width, height) * 0.2;
      const colors = new Float32Array(vertexCount * 3);

      let v = 0;
      for (let j = 0; j <= heightSegments; j++) {
        for (let i = 0; i <= widthSegments; i++) {
          // Set Z (loss) position
          const lossVal = zGrid[i][j];
          positions.setZ(v, ((lossVal - minZ) / range) * zScale);
          // Set color based on Z value
          const norm = (lossVal - minZ) / range;
          const col = new THREE.Color();
          col.setHSL((1 - norm) * 0.7, 0.8, 0.5);
          // Set RGB values
          colors[v * 3] = col.r;
          colors[v * 3 + 1] = col.g;
          colors[v * 3 + 2] = col.b;
          v++;
        }
      }

      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geometry.computeVertexNormals();

      const material = new THREE.MeshStandardMaterial({
        vertexColors: true,
        side: THREE.DoubleSide,
        flatShading: false,
      });

      // Create mesh
      const mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.x = -Math.PI / 2;
      mesh.scale.z = zScale;
      sceneRef.current!.add(mesh);
      meshRef.current = mesh;
    }

    loadAndBuild(selectedSurface);
  }, [selectedSurface]);

  useEffect(() => {
    // Update mesh Z scale when zScale state changes
    const mesh = sceneRef.current?.children.find(
      (child) => child instanceof THREE.Mesh,
    ) as THREE.Mesh | undefined;
    if (mesh) {
      mesh.scale.z = zValue;
    }
  }, [zValue]);

  const surfaces = [
    { id: 1, label: 'Filterwise Normalised', value: 'loss_filt.json' },
    { id: 2, label: 'Random Directions', value: 'loss_rand.json' },
  ];

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View id='container'>
        <View
          style={{
            flexDirection: Platform.OS === 'web' ? 'row' : 'column',
            alignItems: 'center',
            padding: 10,
            gap: 10,
            backgroundColor: '#d8eeffd3',
          }}
        >
          <Text>Select surface:</Text>
          <Picker
            id='fileSelect'
            selectedValue={selectedSurface}
            style={{ height: 30, width: 200 }}
            onValueChange={(itemValue) => setSelectedSurface(itemValue)}
          >
            {surfaces.map((surface) => (
              <Picker.Item
                key={surface.id}
                label={surface.label}
                value={surface.value}
              />
            ))}
          </Picker>
          <Text>Z scale:</Text>
          <Slider
            style={{ width: 200, height: 40 }}
            minimumValue={0.001}
            maximumValue={5}
            value={zValue}
            onValueChange={(value) => setZValue(value)}
            minimumTrackTintColor='#1EB1FC'
            maximumTrackTintColor='#1EB1FC'
          />
          <Text>{zValue}</Text>
        </View>
      </View>
      <canvas id='landscapeCanvas'></canvas>
    </SafeAreaView>
  );
}
