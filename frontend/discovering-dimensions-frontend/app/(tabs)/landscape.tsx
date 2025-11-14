'use client';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { Platform, StyleSheet, Text, View, Button } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import Slider from '@react-native-community/slider';
import api from '@/src/api';

export default function LandscapeWithPath() {
  // UI state
  const [activation, setActivation] = useState<string>('ReLU');
  const [depth, setDepth] = useState<number>(2);
  const [width, setWidth] = useState<number>(10);
  const [method, setMethod] = useState<string>('RANDOMDIRS');
  const [data, setData] = useState<string>('SINREGRESSION');
  const [optim, setOptim] = useState<string>('Adam');
  const [loss, setLoss] = useState<string>('MSELoss');
  const [zValue, setZValue] = useState<number>(1);
  const [lr, setLr] = useState<number>(0.01);
  const [isLandscapeLoading, setIsLandscapeLoading] = useState<boolean>(false);
  const [isLandscapeLoaded, setIsLandscapeLoaded] = useState<boolean>(false);
  const [isPathLoading, setIsPathLoading] = useState<boolean>(false);
  const [isPathLoaded, setIsPathLoaded] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [animationProgress, setAnimationProgress] = useState<number>(0);
  const [isPlacingMode, setIsPlacingMode] = useState<boolean>(false);

  const originRef = useRef<number[] | null>(null);
  const xDirRef = useRef<number[] | null>(null);
  const yDirRef = useRef<number[] | null>(null);
  const startPointRef = useRef<[number, number]>([0, 0]);

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
  const pathLengthRef = useRef<number>(0);
  const animationDurationRef = useRef<number | null>(null);
  const ghostBallRef = useRef<THREE.Mesh | null>(null);
  const ghostLineRef = useRef<THREE.Line | null>(null);
  const raycasterRef = useRef<THREE.Raycaster | null>(null);

  // Animation
  const clockRef = useRef<THREE.Clock | null>(null);
  const animationSpeed = 0.2; // 0.2 3D units per second

  const containerId = 'container';

  // --- Scene init ---
  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error('Container element not found');
      return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );

    camera.position.set(0, -3, 5);
    if (Platform.OS === 'web') {
      camera.zoom = 1.0;
    } else {
      camera.zoom = 0.5;
    }
    camera.updateProjectionMatrix();
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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
    scene.add(new THREE.AmbientLight(0xffffff, 0.3));
    const hemiLight = new THREE.HemisphereLight(
      0x4488ff, // Sky color
      0x000000, // Ground color
      0.5, // Intensity
    );
    scene.add(hemiLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(2, 5, 3);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(directionalLight);

    clockRef.current = new THREE.Clock();
    raycasterRef.current = new THREE.Raycaster();

    const TEMP_BALL_POS = new THREE.Vector3();
    const TEMP_BALL_NORM = new THREE.Vector3();
    const TEMP_BALL_OFFSET = new THREE.Vector3();

    // Render loop
    let rafId = 0;
    const animate = () => {
      rafId = requestAnimationFrame(animate);

      // Animate path drawing & ball movement
      try {
        const pathLine = pathLineRef.current;
        const clock = clockRef.current;
        const totalPathPoints = totalPathPointsRef.current;
        const animationDuration = animationDurationRef.current;

        if (pathLine && totalPathPoints > 0 && clock && animationDuration) {
          const progress = (clock.getElapsedTime() / animationDuration) % 1;
          setAnimationProgress(progress);
          const drawCount = Math.floor(progress * totalPathPoints);
          (pathLine.geometry as any).instanceCount = drawCount;

          // Move ball along the path
          const ball = ballRef.current;
          const pts = pathPointsRef.current;
          const norms = pathNormalsRef.current;
          if (ball && pts.length > 0) {
            const totalSegments = pts.length - 1;
            const currentSegmentFloat = progress * totalSegments;
            const segmentIndex = Math.floor(currentSegmentFloat);
            const segmentProgress = currentSegmentFloat - segmentIndex;

            // Get the two points and normals we are between
            const i1 = Math.min(segmentIndex, totalSegments);
            const i2 = Math.min(i1 + 1, totalSegments);

            if (pts[i1] && norms[i1] && pts[i2] && norms[i2]) {
              // Interpolate position
              TEMP_BALL_POS.copy(pts[i1]).lerp(pts[i2], segmentProgress);

              // Interpolate normal and re-normalize it
              TEMP_BALL_NORM.copy(norms[i1])
                .lerp(norms[i2], segmentProgress)
                .normalize();

              // Apply offset from the surface
              const radius = (ball.geometry as any).parameters?.radius ?? 0;
              TEMP_BALL_OFFSET.copy(TEMP_BALL_NORM).multiplyScalar(radius);
              ball.position.copy(TEMP_BALL_POS).add(TEMP_BALL_OFFSET);
            }
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
        } else if (
          mat &&
          mat.resolution &&
          mat.resolution instanceof THREE.Vector2
        ) {
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
          const geo = pathLineRef.current.geometry as any;
          const mat = pathLineRef.current.material as any;
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
        if (ghostBallRef.current) {
          scene.remove(ghostBallRef.current);
          ghostBallRef.current.geometry.dispose();
          (ghostBallRef.current.material as THREE.Material).dispose();
          ghostBallRef.current = null;
        }
        if (ghostLineRef.current) {
          scene.remove(ghostLineRef.current);
          ghostLineRef.current.geometry.dispose();
          (ghostLineRef.current.material as THREE.Material).dispose();
          ghostLineRef.current = null;
        }
        if (rendererRef.current) {
          rendererRef.current.dispose();
          if (
            rendererRef.current.domElement &&
            rendererRef.current.domElement.parentElement
          ) {
            rendererRef.current.domElement.parentElement.removeChild(
              rendererRef.current.domElement,
            );
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
      console.error('Scene is not ready.');
      return;
    }
    const scene = sceneRef.current;

    setIsLandscapeLoading(true);

    // Remove old mesh, path line and ball
    if (meshRef.current) {
      scene.remove(meshRef.current);
      if (meshRef.current.children[0]) {
        (
          (meshRef.current.children[0] as THREE.Mesh).material as THREE.Material
        ).dispose();
      }
      meshRef.current.geometry.dispose();
      (meshRef.current.material as THREE.Material).dispose();
      meshRef.current = null;
    }
    if (pathLineRef.current) {
      scene.remove(pathLineRef.current);
      const geo = pathLineRef.current.geometry as any;
      const mat = pathLineRef.current.material as any;
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

    try {
      const paramString = `/generatelandscape/${JSON.stringify({
        network: { activation: activation, depth: depth, width: width },
        method: method,
        data: data,
        loss: loss,
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
        console.error('Invalid data received from API');
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
        console.error('Empty data received from API');
        setIsLandscapeLoading(false);
        return;
      }

      // Compute geometry dimensions
      const geoWidth = xs[nx - 1] - xs[0];
      const geoHeight = ys[ny - 1] - ys[0];
      const widthSegments = nx - 1;
      const heightSegments = ny - 1;

      // Create landscape geometry and colors
      const geometry = new THREE.PlaneGeometry(
        geoWidth,
        geoHeight,
        widthSegments,
        heightSegments,
      );
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
          const color = new THREE.Color().setHSL(
            (1 - (zVal - minZ) / range) * 0.7,
            0.8,
            0.5,
          );
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
        metalness: 0.2, // Add a slight metallic sheen
        roughness: 0.5, // Make it semi-glossy
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.x = -Math.PI / 2;
      mesh.receiveShadow = true;

      const wireframeMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        opacity: 0.1,
        transparent: true,
        wireframe: true,
      });
      const wireframeMesh = new THREE.Mesh(geometry, wireframeMaterial);
      // Slightly lift the wireframe to prevent z-fighting
      wireframeMesh.position.y = 0.001;
      mesh.add(wireframeMesh);

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
      setIsLandscapeLoaded(true); // Enable Z-value slider
    } catch (err) {
      console.error('Failed to load landscape:', err);
      setIsLandscapeLoading(false);
    }
  }

  // --- Load path and animate ---
  async function loadAndAnimatePath(mesh: THREE.Mesh | null) {
    setIsLandscapeLoaded(false);
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
        const geo = pathLineRef.current.geometry as any;
        const mat = pathLineRef.current.material as any;
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
        init_xy: startPointRef.current,
        optimiser: optim,
        learning_rate: lr,
        loss: loss,
        lock_to_plane: true,
      })}`;
      const resp = await api.get(paramString);
      const pathData = await resp.data;
      const path = pathData.path;
      const arr = Array.isArray(path) ? path : (path.data ?? path);

      if (!Array.isArray(arr) || arr.length < 2) {
        console.error('Invalid path data');
        setIsPathLoading(false);
        return;
      }

      const twoDPoints = arr.map((p: number[]) => new THREE.Vector2(p[0], p[1]),);
      const curve2D = new THREE.SplineCurve(twoDPoints);
      const smoothPoints: THREE.Vector2[] = curve2D.getSpacedPoints(500).map(p => {
        p.x = Math.max(-1, Math.min(1, p.x));
        p.y = Math.max(-1, Math.min(1, p.y));
        return p;
      });
      path2DRef.current = smoothPoints;

      updatePathGeometry(mesh, true);
      setIsPathLoaded(true);
      setIsPathLoading(false);
      setIsLandscapeLoaded(true);
    } catch (err) {
      console.error('Failed to load or process path.json:', err);
      setIsPathLoaded(false);
      setIsPathLoading(false);
      setIsLandscapeLoaded(true);
    }
  }

  const RAYCASTER = new THREE.Raycaster();
  const RAY_ORIGIN = new THREE.Vector3();
  const RAY_DIRECTION = new THREE.Vector3(0, -1, 0);
  const NORMAL_MATRIX = new THREE.Matrix3();
  const TEMP_WORLD_NORMAL = new THREE.Vector3();
  const TEMP_LIFT_OFFSET = new THREE.Vector3();
  const TEMP_BALL_OFFSET = new THREE.Vector3();
  const TEMP_BBOX_SIZE = new THREE.Vector3();

  // Updates the 3D path geometry based on the cached 2D path and a given mesh
  function updatePathGeometry(mesh: THREE.Mesh, createBall: boolean = false) {
    const scene = sceneRef.current;
    const smoothPoints = path2DRef.current;

    if (!scene || !mesh || !smoothPoints || smoothPoints.length < 2) {
      return;
    }

    NORMAL_MATRIX.getNormalMatrix(mesh.matrixWorld);
    const lineLiftAmount = 0.002;

    let totalLength = 0;
    const newPathPoints: THREE.Vector3[] = [];
    const newPathNormals: THREE.Vector3[] = [];
    const positions: number[] = [];

    for (const p of smoothPoints) {
      RAY_ORIGIN.set(p.x, 100, -p.y);
      RAYCASTER.set(RAY_ORIGIN, RAY_DIRECTION);
      const hit = RAYCASTER.intersectObject(mesh)[0];

      if (hit) {
        // Get world normal
        TEMP_WORLD_NORMAL.copy(hit.face!.normal)
          .applyMatrix3(NORMAL_MATRIX)
          .normalize();

        // Get lift offset
        TEMP_LIFT_OFFSET.copy(TEMP_WORLD_NORMAL).multiplyScalar(lineLiftAmount);

        // Create the final point
        const liftedPoint = hit.point.clone().add(TEMP_LIFT_OFFSET);

        if (newPathPoints.length > 0) {
          totalLength += liftedPoint.distanceTo(
            newPathPoints[newPathPoints.length - 1],
          );
        }

        newPathPoints.push(liftedPoint);
        newPathNormals.push(TEMP_WORLD_NORMAL.clone());
        positions.push(liftedPoint.x, liftedPoint.y, liftedPoint.z);
      } else {
        console.warn('Raycast did not hit the mesh for point:', p);
      }
    }

    if (newPathPoints.length < 2) {
      return; // Not enough points
    }

    const curve3D = new THREE.CatmullRomCurve3(newPathPoints, false, 'centripetal');
    const smooth3DPoints = curve3D.getPoints(1000);
    for (const p of smooth3DPoints) {
      positions.push(p.x, p.y, p.z);
    }

    pathPointsRef.current = newPathPoints;
    pathNormalsRef.current = newPathNormals;
    totalPathPointsRef.current = Math.max(0, newPathPoints.length - 1);
    pathLengthRef.current = totalLength;
    animationDurationRef.current = totalLength / animationSpeed;

    if (createBall) {
      // Remove old ball
      if (ballRef.current) {
        scene.remove(ballRef.current);
        ballRef.current.geometry.dispose();
        (ballRef.current.material as THREE.Material).dispose();
      }

      // Create new ball
      mesh.geometry.computeBoundingBox();
      mesh.geometry.boundingBox!.getSize(TEMP_BBOX_SIZE);
      const geoWidth = TEMP_BBOX_SIZE.x || 1;
      const geoHeight = TEMP_BBOX_SIZE.z || 1;
      const ballRadius = Math.hypot(geoWidth, geoHeight) * 0.005;
      const ballGeometry = new THREE.SphereGeometry(ballRadius, 16, 16);
      const ballMaterial = new THREE.MeshStandardMaterial({
        color: 0xff0000,
        emissive: 0xff0000,
        emissiveIntensity: 2,
        toneMapped: false,
      });
      const ball = new THREE.Mesh(ballGeometry, ballMaterial);
      ball.castShadow = true;

      TEMP_BALL_OFFSET.copy(pathNormalsRef.current[0]).multiplyScalar(
        ballRadius,
      );
      ball.position.copy(pathPointsRef.current[0]).add(TEMP_BALL_OFFSET);

      scene.add(ball);
      ballRef.current = ball;
    }

    // Update or create path line
    if (pathLineRef.current) {
      (pathLineRef.current.geometry as LineGeometry).setPositions(positions);
    } else {
      const lineGeometry = new LineGeometry();
      lineGeometry.setPositions(positions);
      const lineMaterial = new LineMaterial({
        color: 0xffff00,
        linewidth: 3,
      }) as any;
      lineMaterial.resolution = new THREE.Vector2(
        window.innerWidth,
        window.innerHeight,
      );
      const line2 = new Line2(lineGeometry as any, lineMaterial);
      (line2.geometry as any).instanceCount = 0;
      scene.add(line2);
      pathLineRef.current = line2;
    }
  }

  // --- UI lists ---
  const depths = [
    { id: 1, label: '2 Layers', value: 2 },
    { id: 2, label: '3 Layers', value: 3 },
    { id: 3, label: '4 Layers', value: 4 },
  ];
  const widths = [
    { id: 1, label: '5 Nodes', value: 5 },
    { id: 2, label: '10 Nodes', value: 10 },
    { id: 3, label: '15 Nodes', value: 15 },
  ];
  const activations = [
    { id: 1, label: 'ReLU', value: 'ReLU' },
    { id: 2, label: 'Tanh', value: 'Tanh' },
    { id: 3, label: 'Sigmoid', value: 'Sigmoid' },
    { id: 4, label: 'LeakyReLU', value: 'LeakyReLU' },
  ];
  const methods = [
    { id: 1, label: 'Random Directions', value: 'RANDOMDIRS' },
    { id: 2, label: 'Filter-wise Normalised Directions', value: 'FILTERNORM' },
  ];
  const dataSets = [
    { id: 1, label: 'Sine Regression', value: 'SINREGRESSION' },
    { id: 2, label: 'Penguins', value: 'PENGUINS' },
  ];
  const optimisers = [
    { id: 1, label: 'SGD', value: 'SGD' },
    { id: 2, label: 'Adam', value: 'Adam' },
    { id: 3, label: 'RMSProp', value: 'RMSprop' },
  ];
  const losses = [
    { id: 1, label: 'MSE', value: 'MSELoss' },
    { id: 2, label: 'Cross-Entropy', value: 'CrossEntropyLoss' },
    { id: 3, label: 'L1', value: 'L1Loss' },
  ];

  const lrs = [
    { id: 1, label: '0.01', value: 0.01 },
    { id: 2, label: '0.02', value: 0.02 },
    { id: 3, label: '0.05', value: 0.05 },
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

  const handleCanvasMouseMove = useCallback((event: MouseEvent) => {
    if (
      !rendererRef.current ||
      !cameraRef.current ||
      !meshRef.current ||
      !ghostBallRef.current ||
      !ghostLineRef.current ||
      !raycasterRef.current
    ) {
      return;
    }

    const canvas = rendererRef.current.domElement;
    const rect = canvas.getBoundingClientRect();
    const mouse = new THREE.Vector2();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouse, cameraRef.current);
    const intersects = raycasterRef.current.intersectObject(meshRef.current);

    if (intersects.length > 0) {
      const hit = intersects[0];
      ghostBallRef.current.visible = true;
      ghostLineRef.current.visible = true;

      // Vertical white dashed line (along world Y-axis)
      const lineTopPosition = hit.point
        .clone()
        .add(new THREE.Vector3(0, 0.2, 0)); // 0.2 world units high
      const lineBottomPosition = hit.point;

      ghostBallRef.current.position.copy(lineTopPosition);
      (ghostLineRef.current.geometry as THREE.BufferGeometry).setFromPoints([
        lineBottomPosition,
        lineTopPosition,
      ]);
      ghostLineRef.current.computeLineDistances();
    } else {
      ghostBallRef.current.visible = false;
      ghostLineRef.current.visible = false;
    }
  }, []);

  // Click handler for placing mode
  const handleCanvasClick = useCallback((event: MouseEvent) => {
    if (
      !rendererRef.current ||
      !cameraRef.current ||
      !meshRef.current ||
      !raycasterRef.current
    ) {
      return;
    }

    const canvas = rendererRef.current.domElement;
    const rect = canvas.getBoundingClientRect();
    const mouse = new THREE.Vector2();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouse, cameraRef.current);
    const intersects = raycasterRef.current.intersectObject(meshRef.current);

    if (intersects.length > 0) {
      const hit = intersects[0];
      // Mapping: world (x, z) -> plane (x, -y)
      const init_xy: [number, number] = [hit.point.x, -hit.point.z];
      startPointRef.current = init_xy;

      // Automatically load the path from this new point
      loadAndAnimatePath(meshRef.current);
    }

    // Always exit placing mode on click, whether it hit or not
    setIsPlacingMode(false);
  }, []);

  // This effect manages the event listeners and ghost objects based on isPlacingMode
  useEffect(() => {
    const canvas = rendererRef.current?.domElement;
    if (!canvas) return;

    if (isPlacingMode) {
      // Create ghost objects if they don't exist
      if (!ghostBallRef.current && sceneRef.current) {
        const ballRadius =
          (ballRef.current?.geometry as any)?.parameters?.radius || 0.01;
        const ballGeom = new THREE.SphereGeometry(ballRadius, 16, 16);
        const ballMaterial = new THREE.MeshStandardMaterial({
          color: 0xff0000,
          emissive: 0xff0000,
          emissiveIntensity: 2,
          toneMapped: false,
        });
        ghostBallRef.current = new THREE.Mesh(ballGeom, ballMaterial);
        ghostBallRef.current.visible = false;
        sceneRef.current.add(ghostBallRef.current);

        const lineMat = new THREE.LineDashedMaterial({
          color: 0xffffff,
          dashSize: 0.01,
          gapSize: 0.01,
          transparent: true,
          opacity: 0.7,
        });
        const lineGeom = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(),
          new THREE.Vector3(0, 0.2, 0),
        ]);
        ghostLineRef.current = new THREE.Line(lineGeom, lineMat);
        ghostLineRef.current.visible = false;
        sceneRef.current.add(ghostLineRef.current);
      }

      canvas.addEventListener('mousemove', handleCanvasMouseMove);
      canvas.addEventListener('click', handleCanvasClick);
      canvas.style.cursor = 'none'; // Hide cursor, ball will follow
    } else {
      // Cleanup: hide objects and remove listeners
      if (ghostBallRef.current) ghostBallRef.current.visible = false;
      if (ghostLineRef.current) ghostLineRef.current.visible = false;
      canvas.style.cursor = 'auto'; // Restore cursor
    }

    // Cleanup function for the effect
    return () => {
      canvas.removeEventListener('mousemove', handleCanvasMouseMove);
      canvas.removeEventListener('click', handleCanvasClick);
      canvas.style.cursor = 'auto';
    };
  }, [isPlacingMode, handleCanvasMouseMove, handleCanvasClick]);

  const handleLoadLandscapeButtonClick = () => {
    loadAndBuildLandscape();
  };

  const handleLoadPathButtonClick = () => {
    loadAndAnimatePath(meshRef.current);
  };

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
    const clock = clockRef.current;
    const animationDuration = animationDurationRef.current;

    if (!clock || !animationDuration) {
        return;
    }

    console.log('Setting progress to:', newProgress);
    setAnimationProgress(newProgress);
    const newElapsedTimeInSeconds = newProgress * animationDuration;
    clock.elapsedTime = newElapsedTimeInSeconds;
    clock.oldTime = performance.now();
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
            backgroundColor: '#d8eeff4d',
            flexWrap: 'wrap',
          }}
        >
          <View style={styles.param}>
            <Text>Select data set:</Text>
            <Picker
              id='dataSelect'
              selectedValue={data}
              style={{ height: 30 }}
              onValueChange={(itemValue) => setData(String(itemValue))}
            >
              {dataSets.map((d) => (
                <Picker.Item key={d.id} label={d.label} value={d.value} />
              ))}
            </Picker>
          </View>

          <View style={styles.param}>
            <Text>Select depth of network:</Text>
            <Picker
              id='depthSelect'
              selectedValue={depth}
              style={{ height: 30 }}
              onValueChange={(itemValue) => setDepth(Number(itemValue))}
            >
              {depths.map((d) => (
                <Picker.Item key={d.id} label={d.label} value={d.value} />
              ))}
            </Picker>
          </View>

          <View style={styles.param}>
            <Text>Select width of hidden layers:</Text>
            <Picker
              id='widthSelect'
              selectedValue={width}
              style={{ height: 30 }}
              onValueChange={(itemValue) => setWidth(Number(itemValue))}
            >
              {widths.map((w) => (
                <Picker.Item key={w.id} label={w.label} value={w.value} />
              ))}
            </Picker>
          </View>

          <View style={styles.param}>
            <Text>Select activation function:</Text>
            <Picker
              id='activationSelect'
              selectedValue={activation}
              style={{ height: 30 }}
              onValueChange={(itemValue) => setActivation(String(itemValue))}
            >
              {activations.map((a) => (
                <Picker.Item key={a.id} label={a.label} value={a.value} />
              ))}
            </Picker>
          </View>

          <View style={styles.param}>
            <Text>Select visualisation method:</Text>
            <Picker
              id='methodSelect'
              selectedValue={method}
              style={{ height: 30 }}
              onValueChange={(itemValue) => setMethod(String(itemValue))}
            >
              {methods.map((m) => (
                <Picker.Item key={m.id} label={m.label} value={m.value} />
              ))}
            </Picker>
          </View>

          <Button
            title={isLandscapeLoading ? 'Loading...' : 'Generate Landscape'}
            onPress={handleLoadLandscapeButtonClick}
            disabled={isLandscapeLoading}
          />

          <View style={styles.param}>
            <Text>Select optimiser:</Text>
            <Picker
              id='optimiserSelect'
              selectedValue={optim}
              style={{ height: 30 }}
              onValueChange={(itemValue) => setOptim(String(itemValue))}
            >
              {optimisers.map((o) => (
                <Picker.Item key={o.id} label={o.label} value={o.value} />
              ))}
            </Picker>
          </View>

          <View style={styles.param}>
            <Text>Select loss:</Text>
            <Picker
              id='lossSelect'
              selectedValue={loss}
              style={{ height: 30 }}
              onValueChange={(itemValue) => {
                setLoss(String(itemValue));
              }}
            >
              {losses.map((loss) => (
                <Picker.Item
                  key={loss.id}
                  label={loss.label}
                  value={loss.value}
                />
              ))}
            </Picker>
          </View>

          <View style={styles.param}>
            <Text>Select learning rate:</Text>
            <Picker
              id='lrSelect'
              selectedValue={lr}
              style={{ height: 30 }}
              onValueChange={(itemValue) => {
                setLr(Number(itemValue));
              }}
            >
              {lrs.map((lr) => (
                <Picker.Item key={lr.id} label={lr.label} value={lr.value} />
              ))}
            </Picker>
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button
              title={isPlacingMode ? 'Cancel Placing' : 'Place Start Point'}
              onPress={() => setIsPlacingMode((prev) => !prev)}
              disabled={isLandscapeLoading || isPathLoading || !meshRef.current}
            />

            <Button
              title={isPathLoading ? 'Loading...' : 'Generate Path'}
              onPress={handleLoadPathButtonClick}
              disabled={isLandscapeLoading || isPathLoading || !meshRef.current}
            />
          </View>

          <View
              style={{
                width: 250,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                marginRight: 10,
              }}
            >
              <Text style={{ color: 'white' }}>Z scale:</Text>
              <Slider
                style={{ width: 150, height: 40 }}
                minimumValue={0.001}
                maximumValue={5}
                value={zValue}
                onValueChange={handleZChange}
                minimumTrackTintColor={
                  isLandscapeLoading || !isLandscapeLoaded || isPathLoading
                    ? '#888888'
                    : '#00aaffff'
                }
                maximumTrackTintColor={
                  isLandscapeLoading || !isLandscapeLoaded || isPathLoading
                    ? '#444444'
                    : '#0052c4ff'
                }
                thumbTintColor={
                  isLandscapeLoading || !isLandscapeLoaded || isPathLoading
                    ? '#666666'
                    : '#00b9e2ff'
                }
                disabled={
                  isLandscapeLoading || !isLandscapeLoaded || isPathLoading
                }
              />
              <Text style={{ color: 'white' }}>{zValue.toFixed(3)}</Text>
            </View>
        </View>

        {isPathLoaded && (
          <View
            style={{
              backgroundColor: '#2a74874d',
              padding: 10,
              borderRadius: 5,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                flex: 1,
              }}
            >
              <View style={{ width: 70 }}>
                <Button
                  title={isPlaying ? 'Pause' : 'Play'}
                  onPress={togglePlayPause}
                  disabled={!pathLineRef.current}
                />
              </View>
              <Slider
                style={{ height: 40, width: 200 }}
                minimumValue={0}
                maximumValue={0.99}
                step={0.01}
                value={animationProgress}
                onValueChange={handleProgressChange}
                minimumTrackTintColor={
                  pathLineRef.current ? '#00aaffff' : '#888888'
                }
                maximumTrackTintColor={
                  pathLineRef.current ? '#0083c4ff' : '#444444'
                }
                thumbTintColor={pathLineRef.current ? '#00b9e2ff' : '#666666'}
                disabled={!pathLineRef.current}
              />
            </View>
          </View>
        )}
      </View>
      {/* Renderer will append a canvas into the container div above */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  param: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 5,
    backgroundColor: '#90fbffd3',
    padding: 5,
    borderRadius: 5,
  },
});
