import React, { useEffect, useRef, useState, useCallback } from 'react';
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
  const [isLandscapeLoading, setIsLandscapeLoading] = useState<boolean>(false);
  const [isLandscapeLoaded, setIsLandscapeLoaded] = useState<boolean>(false);
  const [isPathLoading, setIsPathLoading] = useState<boolean>(false);
  const [isPathLoaded, setIsPathLoaded] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isPlacingMode, setIsPlacingMode] = useState<boolean>(false);
  const [placingPathId, setPlacingPathId] = useState<number | null>(null);

  // --- Internal state refs ---
  const originRef = useRef<number[] | null>(null);
  const xDirRef = useRef<number[] | null>(null);
  const yDirRef = useRef<number[] | null>(null);
  
  // --- Three.js refs ---
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const raycasterRef = useRef<THREE.Raycaster | null>(null);
  const clockRef = useRef<THREE.Clock | null>(null);
  const ghostBallRef = useRef<THREE.Mesh | null>(null);
  const ghostLineRef = useRef<THREE.Line | null>(null);

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

  /**
   * Fetches and renders all configured paths.
   */
  const loadAndAnimateAllPaths = useCallback(async () => {
    const mesh = meshRef.current;
    if (!mesh) return;

    setIsLandscapeLoaded(false);
    setIsPathLoading(true);
    handleRemoveAllPaths();
    setIsPlaying(true);

    try {
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
          loss: config.loss,
          lock_to_plane: true,
        })}`;
        return api.get(paramString);
      });

      const responses = await Promise.all(pathPromises);

      // Process all responses
      responses.forEach((resp, index) => {
        const pathData = resp.data;
        const arr = pathData.path?.data ?? pathData.path;

        if (!Array.isArray(arr) || arr.length < 2) {
          throw new Error(`Invalid path data for path ${index + 1}`);
        }

        const twoDPoints = arr.map(
          (p: number[]) => new THREE.Vector2(p[0], p[1]),
        );
        const curve2D = new THREE.SplineCurve(twoDPoints);
        path2DArrayRef.current[index] = curve2D.getSpacedPoints(500).map((p) => {
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
  }, [
    activation,
    depth,
    width,
    data,
    pathConfigs,
    handleRemoveAllPaths,
    updatePathGeometry,
  ]);

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

      if (!dict?.surface || !dict.x_axis || !dict.y_axis) {
        throw new Error('Invalid data received from API');
      }

      originRef.current = dict.theta_0 || null;
      xDirRef.current = dict.x_direction || null;
      yDirRef.current = dict.y_direction || null;

      const { mesh, geoWidth, geoHeight } = createLandscapeMesh(dict, zValue);
      scene.add(mesh);
      meshRef.current = mesh;

      const diag = Math.hypot(geoWidth, geoHeight);
      if (cameraRef.current && controlsRef.current) {
        cameraRef.current.position.set(0, diag * 0.8, diag * 1.1);
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
      }
      setIsLandscapeLoaded(true);
    } catch (err) {
      console.error('Failed to load landscape:', err);
      setIsLandscapeLoaded(false);
    } finally {
      setIsLandscapeLoading(false);
    }
  }, [activation, depth, width, method, data, loss, zValue, handleRemoveAllPaths]);

  // --- Event Handlers ---

  const handleCanvasMouseMove = useCallback((event: MouseEvent) => {
    const { renderer, camera, mesh, ghostBall, ghostLine, raycaster } = {
      renderer: rendererRef.current,
      camera: cameraRef.current,
      mesh: meshRef.current,
      ghostBall: ghostBallRef.current,
      ghostLine: ghostLineRef.current,
      raycaster: raycasterRef.current,
    };
    if (!renderer || !camera || !mesh || !ghostBall || !ghostLine || !raycaster)
      return;

    const rect = renderer.domElement.getBoundingClientRect();
    MOUSE_VECTOR.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    MOUSE_VECTOR.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(MOUSE_VECTOR, camera);

    const intersects = raycaster.intersectObject(mesh);
    if (intersects.length > 0) {
      const hit = intersects[0];
      ghostBall.visible = true;
      ghostLine.visible = true;
      TEMP_HIT_VECTOR.copy(hit.point).add(LINE_TOP_OFFSET);
      ghostBall.position.copy(TEMP_HIT_VECTOR);
      (ghostLine.geometry as THREE.BufferGeometry).setFromPoints([
        hit.point,
        TEMP_HIT_VECTOR,
      ]);
      ghostLine.computeLineDistances();
    } else {
      ghostLine.visible = false;
      const hitPlane = raycaster.ray.intersectPlane(
        VIRTUAL_GROUND_PLANE,
        TEMP_HIT_VECTOR,
      );
      if (hitPlane) {
        ghostBall.visible = true;
        ghostBall.position.copy(TEMP_HIT_VECTOR).add(LINE_TOP_OFFSET);
      } else {
        ghostBall.visible = false;
      }
    }
  }, []);

  const handleCanvasClick = useCallback(
    (event: MouseEvent) => {
      const { renderer, camera, mesh, raycaster } = {
        renderer: rendererRef.current,
        camera: cameraRef.current,
        mesh: meshRef.current,
        raycaster: raycasterRef.current,
      };
      if (!renderer || !camera || !mesh || !raycaster || placingPathId === null)
        return;

      const rect = renderer.domElement.getBoundingClientRect();
      MOUSE_VECTOR.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      MOUSE_VECTOR.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(MOUSE_VECTOR, camera);

      const intersects = raycaster.intersectObject(mesh);
      if (intersects.length > 0) {
        const hit = intersects[0];
        const newStartPoint: [number, number] = [hit.point.x, -hit.point.z];
        onPathConfigChange(placingPathId, 'startPoint', newStartPoint);
      }
      setIsPlacingMode(false);
      setPlacingPathId(null);
    },
    [placingPathId, onPathConfigChange],
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

  const togglePlacingMode = useCallback(
    (id: number | null) => {
      if (id === null || id === placingPathId) {
        // Cancel placing
        setIsPlacingMode(false);
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

        if (!pathLine || !ball || !animationDuration || !pts || !norms) continue;

        // Calculate this path's individual progress, stopping at 1.0
        const pathProgress = (elapsedTime / animationDuration);
        if (pathProgress > 1.0 && animationDuration >= Math.max(...animationDurationsRef.current)) {
          if (animationDuration >= Math.max(...animationDurationsRef.current)){
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
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;
      // Handle resize for all lines
      pathLinesRef.current.forEach(line => {
        handleResize(camera, renderer, line);
      })
      // Handle case where no lines exist yet
      if (pathLinesRef.current.length === 0) {
        handleResize(camera, renderer, null);
      }
    };
    window.addEventListener('resize', onResize);

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
      // Get color for the path being placed
      const color = pathConfigs[placingPathId]?.colorValue || '#FFFFFF';

      // Dispose old ghost objects
      disposeObject(ghostBallRef.current);
      disposeObject(ghostLineRef.current);
      
      if (sceneRef.current) {
        const ballRadius =
          (ballsRef.current[0]?.geometry as any)?.parameters?.radius || 0.01;
        const { ghostBall, ghostLine } = createGhostObjects(
          sceneRef.current,
          ballRadius,
          color,
        );
        ghostBallRef.current = ghostBall;
        ghostLineRef.current = ghostLine;
      }
      
      canvas.addEventListener('mousemove', handleCanvasMouseMove);
      canvas.addEventListener('click', handleCanvasClick);
      canvas.style.cursor = 'none';
    } else {
      // Cleanup
      if (ghostBallRef.current) ghostBallRef.current.visible = false;
      if (ghostLineRef.current) ghostLineRef.current.visible = false;
      canvas.style.cursor = 'auto';
    }

    return () => {
      canvas.removeEventListener('mousemove', handleCanvasMouseMove);
      canvas.removeEventListener('click', handleCanvasClick);
      canvas.style.cursor = 'auto';
    };
  }, [isPlacingMode, placingPathId, pathConfigs, handleCanvasMouseMove, handleCanvasClick]);

  // --- Return values ---
  return {
    containerId,
    zValue,
    isLandscapeLoading,
    isLandscapeLoaded,
    isPathLoading,
    isPathLoaded,
    isPlaying,
    isPlacingMode,
    placingPathId,
    handleLoadLandscapeButtonClick,
    handleLoadAllPathsButtonClick,
    handleRemoveAllPaths,
    togglePlayPause,
    handleZChange,
    togglePlacingMode,
  };
}