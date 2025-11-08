'use client';
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { Platform, Text, View, Button } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import Slider from '@react-native-community/slider';
import api from '@/src/api';

export default function LandscapeWithPath() {
  // UI state
  const [activation, setActivation] = useState<string>("ReLU");
  const [depth, setDepth] = useState<number>(2);
  const [width, setWidth] = useState<number>(10);
  const [method, setMethod] = useState<string>("RANDOMDIRS");
  const [data, setData] = useState<string>("SINREGRESSION");
  const [optim, setOptim] = useState<string>("Adam");
  const [loss, setLoss] = useState<string>("MSELoss");
  const [zValue, setZValue] = useState<number>(1);
  const [isLandscapeLoading, setIsLandscapeLoading] = useState<boolean>(false);
  const [isPathLoading, setIsPathLoading] = useState<boolean>(false);
  const [isPathLoaded, setIsPathLoaded] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [animationProgress, setAnimationProgress] = useState<number>(0);


  const originRef = useRef<number[] | null>(null);
  const xDirRef = useRef<number[] | null>(null);
  const yDirRef = useRef<number[] | null>(null);

  // Three.js refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const pathLineRef = useRef<Line2 | null>(null);
  const ballRef = useRef<THREE.Mesh | null>(null);
  const pathPointsRef = useRef<THREE.Vector3[]>([]);
  const pathNormalsRef = useRef<THREE.Vector3[]>([]);
  const totalPathPointsRef = useRef<number>(0);
  const path2DRef = useRef<THREE.Vector2[] | null>(null);

  // Animation
  const clockRef = useRef<THREE.Clock | null>(null);
  const animationDuration = 10; // seconds

  const containerId = 'container';

  // --- Scene init ---
  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error('Container element not found');
      return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );

    camera.position.set(0, -3, 3);
    if (Platform.OS === 'web') {
      camera.zoom = 1.0;
    } else {
      camera.zoom = 0.5;
    }
    camera.updateProjectionMatrix();
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.zIndex = '1';

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 0);
    controls.update();
    controlsRef.current = controls;

    // Lights
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));

    // Clock
    clockRef.current = new THREE.Clock();

    // Render loop
    let rafId = 0;
    const animate = () => {
      rafId = requestAnimationFrame(animate);

      // Animate path drawing & ball movement
      try {
        const pathLine = pathLineRef.current;
        const clock = clockRef.current;
        const totalPathPoints = totalPathPointsRef.current;

        if (pathLine && totalPathPoints > 0 && clock) {
          const progress = (clock.getElapsedTime() / animationDuration) % 1;
          setAnimationProgress(progress);
          const drawCount = Math.floor(progress * totalPathPoints);
          (pathLine.geometry as any).instanceCount = drawCount;

          // Move ball along the path
          const ball = ballRef.current;
          const pts = pathPointsRef.current;
          const norms = pathNormalsRef.current;
          if (ball && pts.length > 0) {
            const idx = Math.min(Math.floor(progress * pts.length), pts.length - 1);
            const pos = pts[idx];
            const normal = norms[idx];
            const radius = (ball.geometry as any).parameters?.radius ?? 0;
            ball.position.copy(pos).add(normal.clone().multiplyScalar(radius));
          }
        }
      } catch (err) {
        console.warn('Animation error', err);
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current!.setSize(window.innerWidth, window.innerHeight);

      // Update line material resolution if present
      const line = pathLineRef.current;
      if (line) {
        const mat = line.material as any;
        if (mat && mat.resolution && typeof mat.resolution.set === 'function') {
          mat.resolution.set(window.innerWidth, window.innerHeight);
        } else if (mat && mat.resolution && mat.resolution instanceof THREE.Vector2) {
          mat.resolution.set(window.innerWidth, window.innerHeight);
        }
      }
    };
    window.addEventListener('resize', handleResize);

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);

      // Dispose scene objects
      try {
        if (pathLineRef.current) {
          scene.remove(pathLineRef.current);
          const geo = (pathLineRef.current.geometry as any);
          const mat = (pathLineRef.current.material as any);
          if (geo) geo.dispose?.();
          if (mat) mat.dispose?.();
          pathLineRef.current = null;
        }
        if (ballRef.current) {
          scene.remove(ballRef.current);
          ballRef.current.geometry.dispose();
          (ballRef.current.material as THREE.Material).dispose();
          ballRef.current = null;
        }

        if (meshRef.current) {
          scene.remove(meshRef.current);
          meshRef.current.geometry.dispose();
          (meshRef.current.material as THREE.Material).dispose();
          meshRef.current = null;
        }

        if (rendererRef.current) {
          rendererRef.current.dispose();
          if (rendererRef.current.domElement && rendererRef.current.domElement.parentElement) {
            rendererRef.current.domElement.parentElement.removeChild(rendererRef.current.domElement);
          }
          rendererRef.current = null;
        }
      } catch (err) {
        // Ignore disposal errors
      }
    };
  }, []);

  async function loadAndBuildLandscape() {
    if (!sceneRef.current) {
      console.error("Scene is not ready.");
      return;
    }
    const scene = sceneRef.current;

    setIsLandscapeLoading(true);

    try {
      const paramString = `/generatelandscape/${JSON.stringify({ 
        network: { activation: activation, depth: depth, width: width },
        method: method,
        data: data,
        loss: loss
      })}`;
      const resp = await api.get(paramString);
      const dict = resp.data;

      if (
        !dict ||
        !dict.surface ||
        !dict.x_axis ||
        !dict.y_axis ||
        !Array.isArray(dict.surface) ||
        !Array.isArray(dict.x_axis) ||
        !Array.isArray(dict.y_axis)
      ) {
        console.error("Invalid data received from API");
        setIsLandscapeLoading(false);
        return;
      }

      originRef.current = dict.theta_0 || null;
      xDirRef.current = dict.x_direction || null;
      yDirRef.current = dict.y_direction || null;

      const zGrid: number[][] = dict.surface;
      const xs: number[] = dict.x_axis;
      const ys: number[] = dict.y_axis;

      const nx = xs.length;
      const ny = ys.length;

      if (nx === 0 || ny === 0 || zGrid.length === 0) {
        console.error("Empty data received from API");
        setIsLandscapeLoading(false);
        return;
      }

      // Compute geometry dimensions
      const geoWidth = xs[nx - 1] - xs[0];
      const geoHeight = ys[ny - 1] - ys[0];
      const widthSegments = nx - 1;
      const heightSegments = ny - 1;

      // Remove old mesh, path line and ball
      if (meshRef.current) {
        scene.remove(meshRef.current);
        meshRef.current.geometry.dispose();
        (meshRef.current.material as THREE.Material).dispose();
        meshRef.current = null;
      }
      if (pathLineRef.current) {
        scene.remove(pathLineRef.current);
        const geo = (pathLineRef.current.geometry as any);
        const mat = (pathLineRef.current.material as any);
        if (geo) geo.dispose?.();
        if (mat) mat.dispose?.();
        pathLineRef.current = null;
        clockRef.current = new THREE.Clock();
        setIsPathLoaded(false);
      }
      if (ballRef.current) {
        scene.remove(ballRef.current);
        ballRef.current.geometry.dispose();
        (ballRef.current.material as THREE.Material).dispose();
        ballRef.current = null;
      }

      // Create landscape geometry and colors
      const geometry = new THREE.PlaneGeometry(geoWidth, geoHeight, widthSegments, heightSegments);
      const positions = geometry.attributes.position;
      const vertexCount = positions.count;

      const zs = zGrid.flat();
      const minZ = Math.min(...zs);
      const maxZ = Math.max(...zs);
      const range = maxZ - minZ || 1;
      const baseZScale = Math.min(geoWidth, geoHeight) * 0.2;

      const colors = new Float32Array(vertexCount * 3);
      let v = 0;
      for (let j = 0; j <= heightSegments; j++) {
        for (let i = 0; i <= widthSegments; i++) {
          const zVal = zGrid[i][j];
          positions.setZ(v, ((zVal - minZ) / range) * baseZScale);
          const color = new THREE.Color().setHSL((1 - (zVal - minZ) / range) * 0.7, 0.8, 0.5);
          colors[v * 3] = color.r;
          colors[v * 3 + 1] = color.g;
          colors[v * 3 + 2] = color.b;
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

      const mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.x = -Math.PI / 2;

      // Set z-scale
      mesh.scale.set(1, 1, zValue);
      scene.add(mesh);
      meshRef.current = mesh;

      // Reposition camera using diag
      const diag = Math.sqrt(geoWidth ** 2 + geoHeight ** 2);
      if (cameraRef.current && controlsRef.current) {
        cameraRef.current.position.set(0, diag * 0.8, diag * 1.1);
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
      }

      setIsLandscapeLoading(false);
    } catch (err) {
      console.error('Failed to load landscape:', err);
      setIsLandscapeLoading(false);
    }
  }

  // --- Load path and animate ---
  async function loadAndAnimatePath(mesh: THREE.Mesh | null) {
    const scene = sceneRef.current;
    if (!scene) return;

    // Reset clock and animation state
    clockRef.current = new THREE.Clock();
    setIsPlaying(true);
    setAnimationProgress(0);

    // Remove existing pathLine & ball
    try {
      if (pathLineRef.current) {
        scene.remove(pathLineRef.current);
        const geo = (pathLineRef.current.geometry as any);
        const mat = (pathLineRef.current.material as any);
        if (geo) geo.dispose?.();
        if (mat) mat.dispose?.();
        pathLineRef.current = null;
      }
      if (ballRef.current) {
        scene.remove(ballRef.current);
        ballRef.current.geometry.dispose();
        (ballRef.current.material as THREE.Material).dispose();
        ballRef.current = null;
      }
    } catch (err) {
      // Ignore disposal errors
    }

    pathPointsRef.current = [];
    pathNormalsRef.current = [];
    totalPathPointsRef.current = 0;
    path2DRef.current = null; // Clear 2D path cache
    setIsPathLoaded(false);

    if (!mesh) return;

    setIsPathLoading(true);

    try {
      const paramString = `/animateminimiser/${JSON.stringify({ 
        network: { activation: activation, depth: depth, width: width },
        data: data,
        x_direction: xDirRef.current,
        y_direction: yDirRef.current,
        theta_0: originRef.current,
        init_xy: [-0.5, -0.5],
        optimiser: optim,
        loss: loss,
      })}`;
      const resp = await api.get(paramString);
      const pathData = await resp.data;
      const path = pathData.path;
      const arr = Array.isArray(path) ? path : path.data ?? path;

      if (!Array.isArray(arr) || arr.length < 2) {
        console.error('Invalid path data');
        setIsPathLoading(false);
        return;
      }
      console.log("First point is:", arr[0][0], arr[0][1]);
      
      const twoDPoints = arr.map((p: number[]) => new THREE.Vector2(p[0], p[1]));
      const curve2D = new THREE.SplineCurve(twoDPoints);
      const smoothPoints: THREE.Vector2[] = curve2D.getPoints(100);
      path2DRef.current = smoothPoints;

      updatePathGeometry(mesh, true); 
      setIsPathLoaded(true);
      setIsPathLoading(false);

    } catch (err) {
      console.error('Failed to load or process path.json:', err);
      setIsPathLoaded(false);
      setIsPathLoading(false);
    }
  }

  // Updates the 3D path geometry based on the cached 2D path and a given mesh
  function updatePathGeometry(mesh: THREE.Mesh, createBall: boolean = false) {
    const scene = sceneRef.current;
    const smoothPoints = path2DRef.current;

    if (!scene || !mesh || !smoothPoints || smoothPoints.length < 2) {
      return;
    }

    // Raycast from above onto the mesh to get 3D points & normals
    const raycaster = new THREE.Raycaster();
    const normalMatrix = new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld);
    const lineLiftAmount = 0.002;

    // Clear old 3D points
    pathPointsRef.current = [];
    pathNormalsRef.current = [];

    for (const p of smoothPoints) {
      const rayOrigin = new THREE.Vector3(p.x, 1000, -p.y);
      raycaster.set(rayOrigin, new THREE.Vector3(0, -1, 0));
      const hit = raycaster.intersectObject(mesh)[0];
      if (hit) {
        const worldNormal = hit.face!.normal.clone().applyMatrix3(normalMatrix).normalize();
        const lifted = hit.point.clone().add(worldNormal.clone().multiplyScalar(lineLiftAmount));
        pathPointsRef.current.push(lifted);
        pathNormalsRef.current.push(worldNormal);
      }
    }

    if (pathPointsRef.current.length < 2) {
      return;
    }

    totalPathPointsRef.current = Math.max(0, pathPointsRef.current.length - 1);
    const positions: number[] = [];
    for (const p of pathPointsRef.current) {
      positions.push(p.x, p.y, p.z);
    }

    if (createBall) {
      // --- Create Ball (only on first load) ---
      if (ballRef.current) {
         scene.remove(ballRef.current);
         ballRef.current.geometry.dispose();
         (ballRef.current.material as THREE.Material).dispose();
      }
      const geomParams = (mesh.geometry as any).parameters ?? { width: 1, height: 1 };
      const geoWidth = geomParams.width || 1;
      const geoHeight = geomParams.height || 1;
      const ballRadius = Math.sqrt(geoWidth ** 2 + geoHeight ** 2) * 0.005;
      const ballGeometry = new THREE.SphereGeometry(ballRadius, 16, 16);
      const ballMaterial = new THREE.MeshStandardMaterial({
        color: 0xff0000,
        roughness: 0.5,
      });
      const ball = new THREE.Mesh(ballGeometry, ballMaterial);
      ball.position.copy(pathPointsRef.current[0]).add(pathNormalsRef.current[0].clone().multiplyScalar(ballRadius));
      scene.add(ball);
      ballRef.current = ball;
    }

    // --- Create or Update Line ---
    if (pathLineRef.current) {
      // Path line already exists, just update its geometry
      (pathLineRef.current.geometry as LineGeometry).setPositions(positions);
    } else {
      // Create new Line2 path
      const lineGeometry = new LineGeometry();
      lineGeometry.setPositions(positions);
      const lineMaterial = new LineMaterial({
        color: 0x00ffff,
        linewidth: 8, // pixels
      }) as any;
      lineMaterial.resolution = new THREE.Vector2(window.innerWidth, window.innerHeight);
      const line2 = new Line2(lineGeometry as any, lineMaterial);
      // Initialise with zero drawn segments
      (line2.geometry as any).instanceCount = 0;
      scene.add(line2);
      pathLineRef.current = line2;
    }
  }

  // --- UI lists ---
  const depths = [
    { id: 1, label: '2 Layers', value: 2 },
    { id: 2, label: '3 Layers', value: 3 },
    { id: 3, label: '4 Layers', value: 4 }
  ];
  const widths = [
    { id: 1, label: '5 Nodes', value: 5 },
    { id: 2, label: '10 Nodes', value: 10 },
    { id: 3, label: '15 Nodes', value: 15 }
  ];
  const activations = [
    { id: 1, label: 'ReLU', value: "ReLU" },
    { id: 2, label: 'Tanh', value: "Tanh" },
    { id: 3, label: 'Sigmoid', value: "Sigmoid" },
    { id: 4, label: 'LeakyReLU', value: "LeakyReLU" }
  ];
  const methods = [
    { id: 1, label: 'Random Directions', value: "RANDOMDIRS" },
    { id:2, label: 'Filter-wise Normalised Directions', value: "FILTERNORM" }
  ];
  const dataSets = [
    { id: 1, label: 'Sine Regression', value: "SINREGRESSION" },
    { id: 2, label: 'Penguins', value: "PENGUINS" }
  ];
  const optimisers = [
    { id: 1, label: 'SGD', value: "SGD" },
    { id: 2, label: 'Adam', value: "Adam" },
    { id: 3, label: 'RMSProp', value: "RMSprop" }
  ];
  const losses = [
    { id: 1, label: 'MSE', value: "MSELoss" },
    { id: 2, label: 'Cross-Entropy', value: "CrossEntropyLoss" },
    { id: 3, label: 'L1', value: "L1Loss" }
  ];

  // --- Handler: when user changes z-value (slider) update mesh scale immediately ---
  const handleZChange = (val: number) => {
    setZValue(val);
    if (meshRef.current) {
      meshRef.current.scale.z = val;
    }

    window.clearTimeout((handleZChange as any).__debounce);
    (handleZChange as any).__debounce = window.setTimeout(() => {
      if (meshRef.current && path2DRef.current && pathLineRef.current) {
        // Pass 'false' because we don't need to re-create the ball
        updatePathGeometry(meshRef.current, false); 
      }
    }, 50); // 50ms debounce
  };

  const handleLoadLandscapeButtonClick = () => {
    loadAndBuildLandscape();
  };

  const handleLoadPathButtonClick = () => {
    loadAndAnimatePath(meshRef.current);
  }

  const togglePlayPause = () => {
    if (!clockRef.current) return;
    if (isPlaying) {
      clockRef.current.stop();
    } else {
      clockRef.current.oldTime = performance.now();
      clockRef.current.running = true;
    }
    setIsPlaying(!isPlaying);
  };

const handleProgressChange = (newProgress: number) => {
  if (!clockRef.current) return;

  setAnimationProgress(newProgress);
  const newElapsedTimeInSeconds = newProgress * animationDuration;
  clockRef.current.elapsedTime = newElapsedTimeInSeconds;
  clockRef.current.oldTime = performance.now();
};

  return (
    <SafeAreaView style={{ flex: 1, position: 'relative' }}>
      <View id={containerId} style={{ flex: 1 }} />
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          flexDirection: 'column',
        }}
      >
        <View
          style={{
            flexDirection: Platform.OS === 'web' ? 'row' : 'column',
            alignItems: 'center',
            padding: 10,
            gap: 10,
            backgroundColor: '#d8eeffd3',
            flexWrap: 'wrap',
          }}
        >
          <Text>Select depth of network:</Text>
          <Picker
            id="depthSelect"
            selectedValue={depth}
            style={{ height: 30, width: 100 }}
            onValueChange={(itemValue) => setDepth(Number(itemValue))}
          >
            {depths.map((d) => (
              <Picker.Item key={d.id} label={d.label} value={d.value} />
            ))}
          </Picker>

          <Text>Select width of hidden layers:</Text>
          <Picker
            id="widthSelect"
            selectedValue={width}
            style={{ height: 30, width: 100 }}
            onValueChange={(itemValue) => setWidth(Number(itemValue))}
          >
            {widths.map((w) => (
              <Picker.Item key={w.id} label={w.label} value={w.value} />
            ))}
          </Picker>

          <Text>Select activation function:</Text>
          <Picker
            id="activationSelect"
            selectedValue={activation}
            style={{ height: 30, width: 100 }}
            onValueChange={(itemValue) => setActivation(String(itemValue))}
          >
            {activations.map((a) => (
              <Picker.Item key={a.id} label={a.label} value={a.value} />
            ))}
          </Picker>

          <Text>Select visualisation method:</Text>
          <Picker
            id="methodSelect"
            selectedValue={method}
            style={{ height: 30, width: 200 }}
            onValueChange={(itemValue) => setMethod(String(itemValue))}
          >
            {methods.map((m) => (
              <Picker.Item key={m.id} label={m.label} value={m.value} />
            ))}
          </Picker>

          <Button
            title={isLandscapeLoading ? "Loading..." : "Generate Landscape"}
            onPress={handleLoadLandscapeButtonClick}
            disabled={isLandscapeLoading}
          />

          <Text>Select optimiser:</Text>
          <Picker
            id="optimiserSelect"
            selectedValue={optim}
            style={{ height: 30, width: 200 }}
            onValueChange={(itemValue) => setOptim(String(itemValue))}
          >
            {optimisers.map((o) => (
              <Picker.Item key={o.id} label={o.label} value={o.value} />
            ))}
          </Picker>

          <Text>Select loss:</Text>
          <Picker
            id="lossSelect"
            selectedValue={loss}
            style={{ height: 30, width: 150 }}
            onValueChange={(itemValue) => {setLoss(String(itemValue));}}
          >
            {losses.map((loss) => (
              <Picker.Item key={loss.id} label={loss.label} value={loss.value} />
            ))}
          </Picker>

          <Button
            title={isPathLoading ? "Loading..." : "Generate Path"}
            onPress={handleLoadPathButtonClick}
            disabled={isPathLoading || !meshRef.current}
          />

          <Text>Z scale:</Text>
          <Slider
            style={{ width: 150, height: 40 }}
            minimumValue={0.001}
            maximumValue={5}
            value={zValue}
            onValueChange={handleZChange}
            minimumTrackTintColor="#00aaffff"
            maximumTrackTintColor="#0083c4ff"
            thumbTintColor="#0076a9ff"
            disabled={isLandscapeLoading || isPathLoading}
          />
          <Text>{zValue.toFixed(3)}</Text>
        </View>
        
        {isPathLoaded && (
          <View
            style={{
              alignSelf: 'flex-end',
              marginTop: 10,
              marginRight: 10,
              width: 300,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              padding: 5,
              borderRadius: 5,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <Button
              title={isPlaying ? "Pause" : "Play"}
              onPress={togglePlayPause}
              disabled={!pathLineRef.current}
            />
            <Slider
              style={{ flex: 1, height: 40 }}
              minimumValue={0}
              maximumValue={1}
              step={0.001}
              value={animationProgress}
              onValueChange={handleProgressChange}
              minimumTrackTintColor="#00aaffff"
              maximumTrackTintColor="#ffffff"
              thumbTintColor="#0076a9ff"
              disabled={!pathLineRef.current}
            />
          </View>
        )}
      </View>
      {/* Renderer will append a canvas into the container div above */}
    </SafeAreaView>
  );

}
