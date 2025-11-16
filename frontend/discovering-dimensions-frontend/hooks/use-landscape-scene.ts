import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
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

// --- Constants ---
const animationSpeed = 0.2;
const containerId = 'container';

// --- Reusable Three.js Vectors/Matrices (for loop/handlers) ---
const TEMP_BALL_POS = new THREE.Vector3();
const TEMP_BALL_NORM = new THREE.Vector3();
const TEMP_BALL_OFFSET = new THREE.Vector3();
const MOUSE_VECTOR = new THREE.Vector2();
const TEMP_HIT_VECTOR = new THREE.Vector3();
const LINE_TOP_OFFSET = new THREE.Vector3(0, 0.2, 0);
const VIRTUAL_GROUND_PLANE = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

// --- Hook Props ---
export interface UseLandscapeSceneProps {
  activation: string;
  depth: number;
  width: number;
  method: string;
  data: string;
  optim: string;
  loss: string;
  lr: number;
}

export function useLandscapeScene(props: UseLandscapeSceneProps) {
  const { activation, depth, width, method, data, optim, loss, lr } = props;

  // --- UI State ---
  const [zValue, setZValue] = useState<number>(1);
  const [isLandscapeLoading, setIsLandscapeLoading] = useState<boolean>(false);
  const [isLandscapeLoaded, setIsLandscapeLoaded] = useState<boolean>(false);
  const [isPathLoading, setIsPathLoading] = useState<boolean>(false);
  const [isPathLoaded, setIsPathLoaded] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [animationProgress, setAnimationProgress] = useState<number>(0);
  const [isPlacingMode, setIsPlacingMode] = useState<boolean>(false);

  // --- Internal state refs ---
  const originRef = useRef<number[] | null>(null);
  const xDirRef = useRef<number[] | null>(null);
  const yDirRef = useRef<number[] | null>(null);
  const startPointRef = useRef<[number, number]>([0, 0]);

  // --- Three.js refs ---
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
  const clockRef = useRef<THREE.Clock | null>(null);

  /**
   * Disposes of a single Three.js object.
   */
  const disposeObject = (objRef: React.MutableRefObject<any>) => {
    if (!objRef.current) return;
    const scene = sceneRef.current;
    if (scene) scene.remove(objRef.current);

    objRef.current.geometry?.dispose();
    if (objRef.current.material) {
      if (Array.isArray(objRef.current.material)) {
        objRef.current.material.forEach((m: any) => m.dispose());
      } else {
        objRef.current.material.dispose();
      }
    }
    objRef.current = null;
  };

  /**
   * Updates 3D path geometry from the cached 2D path.
   * This is the core function for both creating a new path and updating it on z-scale.
   */
  const updatePathGeometry = useCallback(
    (mesh: THREE.Mesh, createBallFlag: boolean = false) => {
      const scene = sceneRef.current;
      const raycaster = raycasterRef.current;
      const smoothPoints = path2DRef.current;

      if (!scene || !mesh || !raycaster || !smoothPoints) return;

      // 1. Project 2D points to 3D surface
      const { newPathPoints, newPathNormals, positions, totalLength } =
        project2DPathTo3D(mesh, smoothPoints, raycaster);

      if (newPathPoints.length < 2) return;

      // 2. Store path data for animation
      pathPointsRef.current = newPathPoints;
      pathNormalsRef.current = newPathNormals;
      totalPathPointsRef.current = Math.max(0, newPathPoints.length - 1);
      pathLengthRef.current = totalLength;
      animationDurationRef.current = totalLength / animationSpeed;

      // 3. Create or update the visible line
      pathLineRef.current = createOrUpdatePathLine(
        scene,
        positions,
        pathLineRef.current,
      );

      // 4. Create the ball (only on initial load)
      if (createBallFlag) {
        disposeObject(ballRef);
        ballRef.current = createBall(
          scene,
          mesh,
          newPathPoints,
          newPathNormals,
        );
      }
    },
    [],
  ); // Relies only on refs

  /**
   * Fetches path data and initiates path/ball creation.
   */
  const loadAndAnimatePath = useCallback(
    async (mesh: THREE.Mesh | null) => {
      setIsLandscapeLoaded(false); // Disable Z-slider during path load
      if (!sceneRef.current) return;

      clockRef.current = new THREE.Clock();
      setIsPlaying(true);
      setAnimationProgress(0);
      disposeObject(pathLineRef);
      disposeObject(ballRef);

      pathPointsRef.current = [];
      pathNormalsRef.current = [];
      totalPathPointsRef.current = 0;
      path2DRef.current = null;
      setIsPathLoaded(false);

      if (!mesh) {
        setIsLandscapeLoaded(true);
        return;
      }

      setIsPathLoading(true);
      try {
        const paramString = `/animateminimiser/${JSON.stringify({
          network: { activation, depth, width },
          data,
          x_direction: xDirRef.current,
          y_direction: yDirRef.current,
          theta_0: originRef.current,
          init_xy: startPointRef.current,
          optimiser: optim,
          learning_rate: lr,
          loss,
          lock_to_plane: true,
        })}`;
        const resp = await api.get(paramString);
        const pathData = await resp.data;
        const arr = pathData.path?.data ?? pathData.path;

        if (!Array.isArray(arr) || arr.length < 2) {
          throw new Error('Invalid path data');
        }

        const twoDPoints = arr.map(
          (p: number[]) => new THREE.Vector2(p[0], p[1]),
        );
        const curve2D = new THREE.SplineCurve(twoDPoints);
        path2DRef.current = curve2D.getSpacedPoints(500).map((p) => {
          p.x = Math.max(-1, Math.min(1, p.x));
          p.y = Math.max(-1, Math.min(1, p.y));
          return p;
        });

        updatePathGeometry(mesh, true);
        setIsPathLoaded(true);
      } catch (err) {
        console.error('Failed to load or process path:', err);
        setIsPathLoaded(false);
      } finally {
        setIsPathLoading(false);
        setIsLandscapeLoaded(true); // Re-enable Z-slider
      }
    },
    [activation, depth, width, data, optim, lr, loss, updatePathGeometry],
  );

  /**
   * Fetches landscape data and builds the mesh.
   */
  const loadAndBuildLandscape = useCallback(async () => {
    const scene = sceneRef.current;
    if (!scene) return;

    setIsLandscapeLoading(true);
    disposeObject(meshRef);
    disposeObject(pathLineRef);
    disposeObject(ballRef);
    setIsPathLoaded(false);

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

      // Use utility to create the mesh
      const { mesh, geoWidth, geoHeight } = createLandscapeMesh(dict, zValue);
      scene.add(mesh);
      meshRef.current = mesh;

      // Reposition camera
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
  }, [activation, depth, width, method, data, loss, zValue]);

  // --- Event Handlers ---

  const handleCanvasMouseMove = useCallback((event: MouseEvent) => {
    const {
      renderer,
      camera,
      mesh,
      ghostBall,
      ghostLine,
      raycaster,
    } = {
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
      if (!renderer || !camera || !mesh || !raycaster) return;

      const rect = renderer.domElement.getBoundingClientRect();
      MOUSE_VECTOR.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      MOUSE_VECTOR.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(MOUSE_VECTOR, camera);

      const intersects = raycaster.intersectObject(mesh);
      if (intersects.length > 0) {
        const hit = intersects[0];
        startPointRef.current = [hit.point.x, -hit.point.z];
        loadAndAnimatePath(mesh);
      }
      setIsPlacingMode(false);
    },
    [loadAndAnimatePath],
  );

  const handleLoadLandscapeButtonClick = useCallback(
    () => loadAndBuildLandscape(),
    [loadAndBuildLandscape],
  );

  const handleLoadPathButtonClick = useCallback(
    () => loadAndAnimatePath(meshRef.current),
    [loadAndAnimatePath],
  );

  const handleRemovePathButtonClick = useCallback(() => {
    disposeObject(pathLineRef);
    disposeObject(ballRef);
    setIsPathLoaded(false);
  }, []);

  const togglePlayPause = useCallback(() => {
    if (!clockRef.current) return;
    if (isPlaying) {
      clockRef.current.stop();
    } else {
      clockRef.current.oldTime = performance.now();
      clockRef.current.running = true;
    }
    setIsPlaying((prev) => !prev);
  }, [isPlaying]);

  const handleProgressChange = useCallback((newProgress: number) => {
    const clock = clockRef.current;
    const animationDuration = animationDurationRef.current;
    if (!clock || !animationDuration) return;

    setAnimationProgress(newProgress);
    clock.elapsedTime = newProgress * animationDuration;
    clock.oldTime = performance.now();
  }, []);

  const handleZChange = useCallback(
    (val: number) => {
      setZValue(val);
      if (meshRef.current) {
        meshRef.current.scale.z = val;
      }
      // Debounce the expensive path geometry update
      window.clearTimeout((handleZChange as any).__debounce);
      (handleZChange as any).__debounce = window.setTimeout(() => {
        if (meshRef.current && path2DRef.current && pathLineRef.current) {
          updatePathGeometry(meshRef.current, false);
        }
      }, 50);
    },
    [updatePathGeometry],
  );

  const togglePlacingMode = useCallback(() => {
    setIsPlacingMode((prev) => !prev);
  }, []);

  // --- Scene Init Effect ---
  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) return;

    // 1. Use util to setup scene
    const { scene, camera, renderer, controls } = initScene(container);
    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    controlsRef.current = controls;

    // 2. Setup non-object refs
    clockRef.current = new THREE.Clock();
    raycasterRef.current = new THREE.Raycaster();

    // 3. Render loop
    let rafId = 0;
    const animate = () => {
      rafId = requestAnimationFrame(animate);

      const pathLine = pathLineRef.current;
      const clock = clockRef.current;
      const animationDuration = animationDurationRef.current;

      if (
        pathLine &&
        clock &&
        animationDuration &&
        isPlaying
      ) {
        const progress = (clock.getElapsedTime() / animationDuration) % 1;
        setAnimationProgress(progress);
        
        const lineGeom = pathLine.geometry;
        const totalLineSegments = lineGeom.attributes.instanceStart.count;
        const drawCount = Math.floor(progress * totalLineSegments);
        lineGeom.instanceCount = drawCount;

        const ball = ballRef.current;
        const pts = pathPointsRef.current;
        const norms = pathNormalsRef.current;

        if (ball && pts.length > 0) {
          const totalSegments = pts.length - 1;
          const currentSegmentFloat = progress * totalSegments;
          const segmentIndex = Math.floor(currentSegmentFloat);
          const segmentProgress = currentSegmentFloat - segmentIndex;
          const i1 = Math.min(segmentIndex, totalSegments);
          const i2 = Math.min(i1 + 1, totalSegments);

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
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // 4. Resize listener
    const onResize = () =>
      handleResize(camera, renderer, pathLineRef.current);
    window.addEventListener('resize', onResize);

    // 5. Cleanup
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      cleanupScene(scene, renderer);
    };
  }, []); // Empty dependency array ensures this runs only once

  // --- Placing Mode Effect ---
  useEffect(() => {
    const canvas = rendererRef.current?.domElement;
    if (!canvas) return;

    if (isPlacingMode) {
      if (!ghostBallRef.current && sceneRef.current) {
        const ballRadius =
          (ballRef.current?.geometry as any)?.parameters?.radius || 0.01;
        const { ghostBall, ghostLine } = createGhostObjects(
          sceneRef.current,
          ballRadius,
        );
        ghostBallRef.current = ghostBall;
        ghostLineRef.current = ghostLine;
      }
      canvas.addEventListener('mousemove', handleCanvasMouseMove);
      canvas.addEventListener('click', handleCanvasClick);
      canvas.style.cursor = 'none';
    } else {
      if (ghostBallRef.current) ghostBallRef.current.visible = false;
      if (ghostLineRef.current) ghostLineRef.current.visible = false;
      canvas.style.cursor = 'auto';
    }

    return () => {
      canvas.removeEventListener('mousemove', handleCanvasMouseMove);
      canvas.removeEventListener('click', handleCanvasClick);
      canvas.style.cursor = 'auto';
    };
  }, [isPlacingMode, handleCanvasMouseMove, handleCanvasClick]);

  // --- Return values for the component ---
  return {
    containerId,
    zValue,
    isLandscapeLoading,
    isLandscapeLoaded,
    isPathLoading,
    isPathLoaded,
    isPlaying,
    animationProgress,
    isPlacingMode,
    handleLoadLandscapeButtonClick,
    handleLoadPathButtonClick,
    handleRemovePathButtonClick,
    togglePlayPause,
    handleProgressChange,
    handleZChange,
    togglePlacingMode,
  };
}