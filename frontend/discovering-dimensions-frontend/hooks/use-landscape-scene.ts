import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import api from '@/src/api';
import {
  initScene,
  createLandscapeMesh,
  project2DPathTo3D,
  createOrUpdatePathLine,
  createBall,
  createGhostObjects,
  handleResize,
  cleanupScene,
} from '@/utils/threejs-utils';
import { PathConfig } from '@/components/path-config-controls';

// --- Constants ---
const animationSpeed = 0.2;
const containerId = 'container';

// --- Reusable Three.js Vectors/Matrices ---
const TEMP_BALL_POS = new THREE.Vector3();
const TEMP_BALL_NORM = new THREE.Vector3();
const TEMP_BALL_OFFSET = new THREE.Vector3();
const MOUSE_VECTOR = new THREE.Vector2();
const TEMP_HIT_VECTOR = new THREE.Vector3();
const LINE_TOP_OFFSET = new THREE.Vector3(0, 0.2, 0);
const VIRTUAL_GROUND_PLANE = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

// --- Hook Props ---
export interface UseLandscapeSceneProps {
  // Landscape props
  activation: string;
  depth: number;
  width: number;
  method: string;
  data: string;
  loss: string;
  pathConfigs: PathConfig[];
  onPathConfigChange: (id: number, field: keyof PathConfig, value: any) => void;
}

export function useLandscapeScene(props: UseLandscapeSceneProps) {
  const {
    activation,
    depth,
    width,
    method,
    data,
    loss,
    pathConfigs,
    onPathConfigChange,
  } = props;

  // --- UI State ---
  const [zValue, setZValue] = useState<number>(1);
  const [isLogPlot, setIsLogPlot] = useState<boolean>(false);
  const [isLandscapeLoading, setIsLandscapeLoading] = useState<boolean>(false);
  const [isLandscapeLoaded, setIsLandscapeLoaded] = useState<boolean>(false);
  const [isPathLoading, setIsPathLoading] = useState<boolean>(false);
  const [isPathLoaded, setIsPathLoaded] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isPlacingMode, setIsPlacingMode] = useState<boolean>(false);
  const [placingPathId, setPlacingPathId] = useState<number | null>(null);
  const [currentParams, setCurrentParams] = useState<number[] | null>(null);

  // --- Internal state refs ---
  const dataRef = useRef<string>(data);
  const lossRef = useRef<string>(loss);
  const activationRef = useRef<string>(activation);
  const depthRef = useRef<number>(depth);
  const widthRef = useRef<number>(width);
  const dictRef = useRef<any>(null);
  const originRef = useRef<number[] | null>(null);
  const xDirRef = useRef<number[] | null>(null);
  const yDirRef = useRef<number[] | null>(null);
  const networkViewIdRef = useRef<number | null>(null);

  // --- Three.js refs ---
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const raycasterRef = useRef<THREE.Raycaster | null>(null);
  const clockRef = useRef<THREE.Clock | null>(null);
  const markersRef = useRef<{
    [id: number]: { ball: THREE.Mesh; line: THREE.Line };
  }>({});

  // --- Refs for Animation Loop ---
  // These refs will mirror the state, so the animate loop can read them
  const isPlayingRef = useRef(isPlaying);
  const isPathLoadedRef = useRef(isPathLoaded);
  const animationTimeRef = useRef(0);

  // --- Array refs for multiple paths ---
  const pathLinesRef = useRef<Line2[]>([]);
  const ballsRef = useRef<THREE.Mesh[]>([]);
  const pathPointsArrayRef = useRef<THREE.Vector3[][]>([]);
  const pathNormalsArrayRef = useRef<THREE.Vector3[][]>([]);
  const totalPathPointsArrayRef = useRef<number[]>([]);
  const path2DArrayRef = useRef<THREE.Vector2[][]>([]);
  const animationDurationsRef = useRef<number[]>([]);
  const parametersArrayRef = useRef<number[][][]>([]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    isPathLoadedRef.current = isPathLoaded;
  }, [isPathLoaded]);

  /**
   * Disposes of a single Three.js object from a ref array.
   */
  const disposeObject = (obj: THREE.Object3D | null) => {
    if (!obj) return;
    const scene = sceneRef.current;
    if (scene) scene.remove(obj);

    (obj as any).geometry?.dispose();
    if ((obj as any).material) {
      if (Array.isArray((obj as any).material)) {
        (obj as any).material.forEach((m: any) => m.dispose());
      } else {
        (obj as any).material.dispose();
      }
    }
  };

  /**
   * Removes all paths from the scene.
   */
  const handleRemoveAllPaths = useCallback(() => {
    pathLinesRef.current.forEach(disposeObject);
    ballsRef.current.forEach(disposeObject);
    pathLinesRef.current = [];
    ballsRef.current = [];
    pathPointsArrayRef.current = [];
    pathNormalsArrayRef.current = [];
    totalPathPointsArrayRef.current = [];
    path2DArrayRef.current = [];
    parametersArrayRef.current = [];
    Object.values(markersRef.current).forEach(({ ball, line }) => {
      disposeObject(ball);
      disposeObject(line);
    });
    markersRef.current = {};
    animationDurationsRef.current = [];
    setIsPathLoaded(false);
    animationTimeRef.current = 0;
    clockRef.current = new THREE.Clock();
  }, []);

  /**
   * Updates 3D path geometry from a cached 2D path.
   */
  const updatePathGeometry = useCallback(
    (mesh: THREE.Mesh, pathId: number, createBallFlag: boolean = false) => {
      const scene = sceneRef.current;
      const raycaster = raycasterRef.current;
      const smoothPoints = path2DArrayRef.current[pathId];
      const config = pathConfigs[pathId];

      if (!scene || !mesh || !raycaster || !smoothPoints || !config) return;

      const { newPathPoints, newPathNormals, positions, totalLength } =
        project2DPathTo3D(mesh, smoothPoints, raycaster);

      if (newPathPoints.length < 2) return;

      // Store path data for animation
      pathPointsArrayRef.current[pathId] = newPathPoints;
      pathNormalsArrayRef.current[pathId] = newPathNormals;
      totalPathPointsArrayRef.current[pathId] = newPathPoints.length - 1;
      animationDurationsRef.current[pathId] = totalLength / animationSpeed;

      // Create or update the visible line
      pathLinesRef.current[pathId] = createOrUpdatePathLine(
        scene,
        positions,
        pathLinesRef.current[pathId] || null,
        config.colorValue,
      );

      if (createBallFlag) {
        disposeObject(ballsRef.current[pathId]);
        ballsRef.current[pathId] = createBall(
          scene,
          mesh,
          newPathPoints,
          newPathNormals,
          config.colorValue,
        );
      }
    },
    [pathConfigs], // Depends on pathConfigs for colors
  );

  const getOrCreateMarker = useCallback(
    (id: number) => {
      if (!sceneRef.current) return null;

      // If it exists, return it
      if (markersRef.current[id]) {
        return markersRef.current[id];
      }

      // Create new if not exists
      const config = pathConfigs.find((c) => c.id === id);
      const color = config?.colorValue || '#ffffff';

      const { ghostBall, ghostLine } = createGhostObjects(
        sceneRef.current,
        0.02,
        color,
      );

      markersRef.current[id] = { ball: ghostBall, line: ghostLine };
      return markersRef.current[id];
    },
    [pathConfigs],
  );

  /**
   * Fetches and renders all configured paths.
   */
  const loadAndAnimateAllPaths = useCallback(async () => {
    const mesh = meshRef.current;
    if (!mesh) return;

    setIsLandscapeLoaded(false);
    setIsPathLoading(true);
    // === NEW: Clear all markers on generation ===
    Object.values(markersRef.current).forEach(({ ball, line }) => {
      ball.visible = false;
      line.visible = false;
    });
    handleRemoveAllPaths();
    setIsPlaying(true);

    try {
      const data = dataRef.current;
      const activation = activationRef.current;
      const depth = depthRef.current;
      const width = widthRef.current;
      const loss = lossRef.current;
      // Create a fetch promise for each config
      const pathPromises = pathConfigs.map((config) => {
        const paramString = `/animateminimiser/${JSON.stringify({
          network: { activation, depth, width },
          data,
          x_direction: xDirRef.current,
          y_direction: yDirRef.current,
          theta_0: originRef.current,
          init_xy: config.startPoint,
          optimiser: config.optim,
          learning_rate: config.lr,
          loss: loss,
          lock_to_plane: true,
        })}`;
        return api.get(paramString);
      });

      const responses = await Promise.all(pathPromises);

      // Process all responses
      responses.forEach((resp, index) => {
        const pathData = resp.data;
        const path_arr = pathData.minimiser_path?.data ?? pathData.minimiser_path;
        const parameters_arr = pathData.parameters_path?.data ?? pathData.parameters_path;

        if (!Array.isArray(path_arr) || path_arr.length < 2) {
          throw new Error(`Invalid path data for path ${index + 1}`);
        } else if (!Array.isArray(parameters_arr) || parameters_arr.length < 2) {
          throw new Error(`Invalid parameters data for path ${index + 1}`);
        }

        const twoDPoints = path_arr.map(
          (p: number[]) => new THREE.Vector2(p[0], p[1]),
        );
        parametersArrayRef.current[index] = parameters_arr;
        const curve2D = new THREE.SplineCurve(twoDPoints);
        path2DArrayRef.current[index] = curve2D
          .getSpacedPoints(500)
          .map((p) => {
            p.x = Math.max(-1, Math.min(1, p.x));
            p.y = Math.max(-1, Math.min(1, p.y));
            return p;
          });

        // Create the geometry, line, and ball for this path
        updatePathGeometry(mesh, index, true);
      });

      setIsPathLoaded(true);
      animationTimeRef.current = 0;

      if (clockRef.current && !clockRef.current.running) {
        clockRef.current.start();
      }
    } catch (err) {
      console.error('Failed to load one or more paths:', err);
      setIsPathLoaded(false);
    } finally {
      setIsPathLoading(false);
      setIsLandscapeLoaded(true);
    }
  }, [pathConfigs, handleRemoveAllPaths, updatePathGeometry]);

  /**
   * Fetches landscape data and builds the mesh.
   */
  const loadAndBuildLandscape = useCallback(async () => {
    const scene = sceneRef.current;
    if (!scene) return;

    setIsLandscapeLoading(true);
    handleRemoveAllPaths();
    disposeObject(meshRef.current);
    meshRef.current = null;

    try {
      const paramString = `/generatelandscape/${JSON.stringify({
        network: { activation, depth, width },
        method,
        data,
        loss,
      })}`;
      const resp = await api.get(paramString);
      const dict = resp.data;

      dataRef.current = data;
      lossRef.current = loss;
      activationRef.current = activation;
      depthRef.current = depth;
      widthRef.current = width;

      if (!dict?.surface || !dict.x_axis || !dict.y_axis) {
        throw new Error('Invalid data received from API');
      }

      dictRef.current = dict;
      originRef.current = dict.theta_0 || null;
      xDirRef.current = dict.x_direction || null;
      yDirRef.current = dict.y_direction || null;

      const { mesh, geoWidth, geoHeight } = createLandscapeMesh(isLogPlot, dict, zValue);
      scene.add(mesh);
      meshRef.current = mesh;

      if (cameraRef.current && controlsRef.current) {
        const box = new THREE.Box3().setFromObject(mesh);
        const center = new THREE.Vector3();
        box.getCenter(center);
        const size = new THREE.Vector3();
        box.getSize(size);

        controlsRef.current.target.copy(center);
        const maxDim = Math.max(size.x, size.z);
        const fov = cameraRef.current.fov * (Math.PI / 180);
        let cameraDist = Math.abs(maxDim / (2 * Math.tan(fov / 2)));
        cameraDist *= 1.5; // Zoom out multiplier

        cameraRef.current.position.set(
            center.x, 
            center.y + cameraDist * 0.7, // Height
            center.z + cameraDist * 0.7  // Depth
        );
        cameraRef.current.updateProjectionMatrix();
        controlsRef.current.update();
      }
      setIsLandscapeLoaded(true);
    } catch (err) {
      console.error('Failed to load landscape:', err);
      setIsLandscapeLoaded(false);
    } finally {
      setIsLandscapeLoading(false);
    }
  }, [
    activation,
    depth,
    width,
    method,
    data,
    loss,
    isLogPlot,
    zValue,
    handleRemoveAllPaths,
  ]);

  // --- Event Handlers ---

  const handleCanvasMouseMove = useCallback(
    (event: MouseEvent) => {
      if (
        !rendererRef.current ||
        !cameraRef.current ||
        !meshRef.current ||
        !raycasterRef.current ||
        placingPathId === null
      )
        return;

      const marker = getOrCreateMarker(placingPathId);
      if (!marker) return;
      const { ball, line } = marker;

      const rect = rendererRef.current.domElement.getBoundingClientRect();
      MOUSE_VECTOR.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      MOUSE_VECTOR.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycasterRef.current.setFromCamera(MOUSE_VECTOR, cameraRef.current);

      const intersects = raycasterRef.current.intersectObject(meshRef.current);
      if (intersects.length > 0) {
        const hit = intersects[0];

        ball.visible = true;
        line.visible = true;

        TEMP_HIT_VECTOR.copy(hit.point).add(LINE_TOP_OFFSET);
        ball.position.copy(TEMP_HIT_VECTOR);

        (line.geometry as THREE.BufferGeometry).setFromPoints([
          hit.point,
          TEMP_HIT_VECTOR,
        ]);
        line.computeLineDistances();
      } else {
        line.visible = false;

        const hitPlane = raycasterRef.current.ray.intersectPlane(
          VIRTUAL_GROUND_PLANE,
          TEMP_HIT_VECTOR,
        );

        if (hitPlane) {
          ball.visible = true;
          ball.position.copy(TEMP_HIT_VECTOR).add(LINE_TOP_OFFSET);
        } else {
          ball.visible = false;
        }
      }
    },
    [placingPathId, getOrCreateMarker],
  );

  const handleCanvasClick = useCallback(
    (event: MouseEvent) => {
      if (
        !rendererRef.current ||
        !cameraRef.current ||
        !meshRef.current ||
        !raycasterRef.current ||
        placingPathId === null
      )
        return;

      // Get the marker for the CURRENT placing ID
      const marker = getOrCreateMarker(placingPathId);
      if (!marker) return;

      const rect = rendererRef.current.domElement.getBoundingClientRect();
      MOUSE_VECTOR.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      MOUSE_VECTOR.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycasterRef.current.setFromCamera(MOUSE_VECTOR, cameraRef.current);

      // Check for intersection with landscape mesh
      const intersects = raycasterRef.current.intersectObject(meshRef.current);
      if (intersects.length > 0) {
        const hit = intersects[0];
        const newStartPoint: [number, number] = [hit.point.x, -hit.point.z];
        onPathConfigChange(placingPathId, 'startPoint', newStartPoint);

        // Make the ghost line solid for THIS path
        const mat = marker.line.material as THREE.LineDashedMaterial;
        mat.dashSize = 1000;
        mat.gapSize = 0;

        // Snap line to exact click point
        const lineGeo = marker.line.geometry as THREE.BufferGeometry;
        const positions = lineGeo.attributes.position.array as Float32Array;
        const topPt = hit.point.clone().add(new THREE.Vector3(0, 0.2, 0));
        positions[0] = hit.point.x;
        positions[1] = hit.point.y;
        positions[2] = hit.point.z;
        positions[3] = topPt.x;
        positions[4] = topPt.y;
        positions[5] = topPt.z;
        lineGeo.attributes.position.needsUpdate = true;
        marker.line.computeLineDistances();
      } else {
        // Clicked outside mesh, do nothing
        return;
      }

      // Exit placing mode
      setIsPlacingMode(false);
      setPlacingPathId(null);
    },
    [placingPathId, onPathConfigChange, getOrCreateMarker],
  );

  const handleLoadLandscapeButtonClick = useCallback(
    () => loadAndBuildLandscape(),
    [loadAndBuildLandscape],
  );

  const handleLoadAllPathsButtonClick = useCallback(
    () => loadAndAnimateAllPaths(),
    [loadAndAnimateAllPaths],
  );

  const togglePlayPause = useCallback(() => {
    if (!clockRef.current) return;
    if (isPlaying) {
      clockRef.current.stop();
    } else {
      if (animationTimeRef.current > 0) {
        clockRef.current.oldTime = performance.now();
        clockRef.current.running = true;
      } else {
        animationTimeRef.current = 0;
        clockRef.current.start();
      }
    }
    setIsPlaying((prev) => !prev);
  }, [isPlaying]);

  const handleLogPlotToggle = useCallback(
    () => {
      console.log('Toggling log plot. Current value:', isLogPlot);
      if (!sceneRef.current) return;
      setIsLandscapeLoading(true);
      handleRemoveAllPaths();
      disposeObject(meshRef.current);
      meshRef.current = null;
      const { mesh, geoWidth, geoHeight } = createLandscapeMesh(!isLogPlot, dictRef.current, zValue);
      sceneRef.current.add(mesh);
      meshRef.current = mesh;

      const diag = Math.hypot(geoWidth, geoHeight);
      if (cameraRef.current && controlsRef.current) {
        cameraRef.current.position.set(0, diag * 0.8, diag * 1.1);
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
      }
      setIsLogPlot((prev) => !prev);
      setIsLandscapeLoading(false);
    },
    [isLogPlot, zValue, handleRemoveAllPaths],
  );

  const handleZChange = useCallback(
    (val: number) => {
      setZValue(val);
      if (meshRef.current) {
        meshRef.current.scale.z = val;
      }
      // Debounce the expensive path geometry update
      window.clearTimeout((handleZChange as any).__debounce);
      (handleZChange as any).__debounce = window.setTimeout(() => {
        if (!meshRef.current || !isPathLoaded) return;

        // Update all loaded paths
        for (let i = 0; i < path2DArrayRef.current.length; i++) {
          if (path2DArrayRef.current[i] && pathLinesRef.current[i]) {
            updatePathGeometry(meshRef.current!, i, false);
          }
        }
      }, 50);
    },
    [isPathLoaded, updatePathGeometry],
  );

  const onViewNetwork = useCallback(
    (id: number) => {
      networkViewIdRef.current = id;
    },
    [],
  );

  const togglePlacingMode = useCallback(
    (id: number | null) => {
      if (id === null || id === placingPathId) {
        // Cancel placing
        setIsPlacingMode(false);
        // Destroy the marker for this path
        if (placingPathId !== null && markersRef.current[placingPathId]) {
          const { ball, line } = markersRef.current[placingPathId];
          disposeObject(ball);
          disposeObject(line);
          delete markersRef.current[placingPathId];
        }
        setPlacingPathId(null);
      } else {
        // Start placing for a new path
        setIsPlacingMode(true);
        setPlacingPathId(id);
      }
    },
    [placingPathId],
  );

  // --- Scene Init Effect ---
  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) return;

    const { scene, camera, renderer, controls } = initScene(container);
    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    controlsRef.current = controls;

    clockRef.current = new THREE.Clock();
    raycasterRef.current = new THREE.Raycaster();

    let rafId = 0;
    const animate = () => {
      rafId = requestAnimationFrame(animate);

      const clock = clockRef.current;
      if (!clock) return;

      controls.update();
      renderer.render(scene, camera);

      if (!isPlayingRef.current || !isPathLoadedRef.current) {
        return;
      }

      const delta = clock.getDelta();
      animationTimeRef.current += delta;
      const elapsedTime = animationTimeRef.current;

      // Loop over all active paths and animate them
      for (let i = 0; i < pathLinesRef.current.length; i++) {
        const pathLine = pathLinesRef.current[i];
        const ball = ballsRef.current[i];
        const animationDuration = animationDurationsRef.current[i];
        const pts = pathPointsArrayRef.current[i];
        const norms = pathNormalsArrayRef.current[i];

        if (!pathLine || !ball || !animationDuration || !pts || !norms)
          continue;

        // Calculate this path's individual progress, stopping at 1.0
        const pathProgress = elapsedTime / animationDuration;
        if (
          pathProgress > 1.0 &&
          animationDuration >= Math.max(...animationDurationsRef.current)
        ) {
          if (animationDuration >= Math.max(...animationDurationsRef.current)) {
            setIsPlaying(false);
            animationTimeRef.current = 0;
          }
          continue;
        }
        // Animate Line
        const lineGeom = pathLine.geometry as LineGeometry;
        const totalLineSegments = lineGeom.attributes.instanceStart.count;
        const drawCount = Math.floor(pathProgress * totalLineSegments);
        lineGeom.instanceCount = drawCount;

        // Animate Ball
        const totalBallSegments = pts.length - 1;
        const currentSegmentFloat = pathProgress * totalBallSegments;
        const segmentIndex = Math.floor(currentSegmentFloat);
        const segmentProgress = currentSegmentFloat - segmentIndex;
        const i1 = Math.min(segmentIndex, totalBallSegments);
        const i2 = Math.min(i1 + 1, totalBallSegments);

        if (pts[i1] && norms[i1] && pts[i2] && norms[i2]) {
          TEMP_BALL_POS.copy(pts[i1]).lerp(pts[i2], segmentProgress);
          TEMP_BALL_NORM.copy(norms[i1])
            .lerp(norms[i2], segmentProgress)
            .normalize();
          const radius = (ball.geometry as any).parameters?.radius ?? 0;
          TEMP_BALL_OFFSET.copy(TEMP_BALL_NORM).multiplyScalar(radius);
          ball.position.copy(TEMP_BALL_POS).add(TEMP_BALL_OFFSET);
        }
        // Update current parameters of network (if network view is selected)
        const networkViewId = networkViewIdRef.current;
        if (networkViewId !== null && networkViewId === i) {
          const timeStep = Math.floor(pathProgress * (parametersArrayRef.current[i].length - 1));
          setCurrentParams(parametersArrayRef.current[networkViewId][timeStep]);
        }
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if (!cameraRef.current || !rendererRef.current || !container) return;
      
      const width = container.clientWidth;
      const height = container.clientHeight;

      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);

      // Update line resolution uniforms if lines exist
      pathLinesRef.current.forEach(line => {
         if (line.material) {
             (line.material as any).resolution.set(width, height);
         }
      });
    };
    window.addEventListener('resize', onResize);
    onResize();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      cleanupScene(scene, renderer);
    };
  }, []);

  // --- Placing Mode Effect ---
  useEffect(() => {
    const canvas = rendererRef.current?.domElement;
    if (!canvas) return;

    if (isPlacingMode && placingPathId !== null) {
      const marker = getOrCreateMarker(placingPathId);

      if (marker && sceneRef.current) {
        // Reset to Dashed
        const mat = marker.line.material as THREE.LineDashedMaterial;
        mat.dashSize = 0.01;
        mat.gapSize = 0.01;

        marker.ball.visible = false;
        marker.line.visible = false;
      }

      canvas.addEventListener('mousemove', handleCanvasMouseMove);
      canvas.addEventListener('click', handleCanvasClick);
      canvas.style.cursor = 'none';
    } else {
      canvas.style.cursor = 'auto';
    }

    return () => {
      canvas.removeEventListener('mousemove', handleCanvasMouseMove);
      canvas.removeEventListener('click', handleCanvasClick);
      canvas.style.cursor = 'auto';
    };
  }, [
    isPlacingMode,
    placingPathId,
    getOrCreateMarker,
    handleCanvasMouseMove,
    handleCanvasClick,
  ]);

  // --- Return values ---
  return {
    containerId,
    zValue,
    isLogPlot,
    isLandscapeLoading,
    isLandscapeLoaded,
    isPathLoading,
    isPathLoaded,
    isPlaying,
    isPlacingMode,
    placingPathId,
    currentParams,
    handleLoadLandscapeButtonClick,
    handleLoadAllPathsButtonClick,
    handleRemoveAllPaths,
    togglePlayPause,
    handleLogPlotToggle,
    handleZChange,
    togglePlacingMode,
    onViewNetwork
  };
}
