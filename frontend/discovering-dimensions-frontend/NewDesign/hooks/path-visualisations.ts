import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import api from '../src/api';
import {
  initScene,
  createLandscapeMesh,
  project2DPathTo3D,
  createOrUpdatePathLine,
  createBall,
  createGhostObjects,
  handleResize,
  cleanupScene,
} from '../utils/threejs-utils';
import { PathConfigInterface, PathConfig } from '../components/path-config';

export interface UsePathVisualisationsProps {
    activation: string;
    depth: number;
    width: number;
    data: string;
    csv: string;
    loss: string;
    pathConfigs: PathConfigInterface[];
    onPathConfigChange: (id: number, field: keyof PathConfigInterface, value: any) => void;
    disposeObject: (obj: THREE.Object3D | null) => void;
    sceneRef,
    cameraRef,
    rendererRef,
    controlsRef,
    meshRef,
    raycasterRef,
    clockRef,
    rafRef,
    originRef,
    xDirRef,
    yDirRef
}

// --- Constants ---
const animationSpeed = 0.1;

// --- Reusable Three.js Vectors/Matrices ---
const TEMP_BALL_POS = new THREE.Vector3();
const TEMP_BALL_NORM = new THREE.Vector3();
const TEMP_BALL_OFFSET = new THREE.Vector3();
const MOUSE_VECTOR = new THREE.Vector2();
const TEMP_HIT_VECTOR = new THREE.Vector3();
const LINE_TOP_OFFSET = new THREE.Vector3(0, 0.2, 0);
const VIRTUAL_GROUND_PLANE = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

// Helper function to get normalised device coordinates from an event
const getNormalisedCoordinates = (event: any, rect: DOMRect) => {
    let clientX, clientY;

    // Check for Touch Events
    if (event.touches && event.touches.length > 0) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
    } else if (event.changedTouches && event.changedTouches.length > 0) {
        // For touchend events
        clientX = event.changedTouches[0].clientX;
        clientY = event.changedTouches[0].clientY;
    } else {
        // Mouse Events
        clientX = event.clientX;
        clientY = event.clientY;
    }

    return {
        x: ((clientX - rect.left) / rect.width) * 2 - 1,
        y: -((clientY - rect.top) / rect.height) * 2 + 1,
    };
};

export function usePathVisualisations(props: UsePathVisualisationsProps){
    const {
        activation,
        depth,
        width,
        data,
        csv,
        loss,
        pathConfigs,
        onPathConfigChange,
        disposeObject,
        sceneRef,
        cameraRef,
        rendererRef,
        controlsRef,
        meshRef,
        raycasterRef,
        clockRef,
        rafRef,
        originRef,
        xDirRef,
        yDirRef
    } = props;

    const [isPathLoading, setIsPathLoading] = useState<boolean>(false);
    const [isPathLoaded, setIsPathLoaded] = useState<boolean>(false);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [progress, setProgress] = useState(0);
    const [currentFrame, setCurrentFrame] = useState(0);
    const [totalFrames, setTotalFrames] = useState(100);
    const [isPlacingMode, setIsPlacingMode] = useState<boolean>(false);
    const [placingPathId, setPlacingPathId] = useState<number | null>(null);
    const [currentParams, setCurrentParams] = useState<number[] | null>(null);
    const [networkViewId, setNetworkViewId] = useState<number | null>(null);

    const markersRef = useRef<{
        [id: number]: { ball: THREE.Mesh; line: THREE.Line };
    }>({});

    // --- Refs for Animation Loop ---
    // These refs will mirror the state, so the animate loop can read them
    const isPlayingRef = useRef(isPlaying);
    const isPathLoadedRef = useRef(isPathLoaded);
    const lastUiUpdateRef = useRef(0);
    const animationTimeRef = useRef(0);
    const networkViewIdRef = useRef<number | null>(null);

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

    const handleRemovePath = useCallback((id: number) => {
        if (pathLinesRef.current[id]) disposeObject(pathLinesRef.current[id]);
        if (ballsRef.current[id]) disposeObject(ballsRef.current[id]);
        
        if (markersRef.current[id]) {
            disposeObject(markersRef.current[id].ball);
            disposeObject(markersRef.current[id].line);
            delete markersRef.current[id];
        }

        pathLinesRef.current.splice(id, 1);
        ballsRef.current.splice(id, 1);
        pathPointsArrayRef.current.splice(id, 1);
        pathNormalsArrayRef.current.splice(id, 1);
        totalPathPointsArrayRef.current.splice(id, 1);
        path2DArrayRef.current.splice(id, 1);
        parametersArrayRef.current.splice(id, 1);
        animationDurationsRef.current.splice(id, 1);

        // Re-index markersRef
        const newMarkers: { [id: number]: { ball: THREE.Mesh; line: THREE.Line } } = {};
        Object.keys(markersRef.current).forEach((keyStr) => {
            const keyId = parseInt(keyStr, 10);
            if (keyId > id) {
                newMarkers[keyId - 1] = markersRef.current[keyId]; // Shift down
            } else if (keyId < id) {
                newMarkers[keyId] = markersRef.current[keyId];     // Keep same
            }
        });
        markersRef.current = newMarkers;

        if (networkViewIdRef.current === id) {
            // If the user was viewing the network of the deleted path, clear it
            setNetworkViewId(null);
            networkViewIdRef.current = null;
            setCurrentParams(null);
        } else if (networkViewIdRef.current !== null && networkViewIdRef.current > id) {
            // If the user was viewing a path that comes AFTER the deleted one, decrement its ID
            setNetworkViewId(networkViewIdRef.current - 1);
            networkViewIdRef.current -= 1;
        }

        // If this was the last path, completely reset the playback state
        if (pathLinesRef.current.length === 0) {
            setIsPathLoaded(false);
            animationTimeRef.current = 0;
            clockRef.current = new THREE.Clock();
        }
    }, []);

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

    const handleClearPaths = useCallback(() => {
        handleRemoveAllPaths();
        setNetworkViewId(null);
        networkViewIdRef.current = null;
        setCurrentParams(null);
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

    setIsPathLoading(true);
    // Clear all markers on generation
    Object.values(markersRef.current).forEach(({ ball, line }) => {
      ball.visible = false;
      line.visible = false;
    });
    handleRemoveAllPaths();

    try {
        let csvData = data === 'CUSTOM' ? csv : null;
      // Create a fetch promise for each config
      const pathPromises = pathConfigs.map((config) => {
        const paramString = {
            network: { activation, depth, width },
            data: data,
            x_direction: xDirRef.current,
            y_direction: yDirRef.current,
            theta_0: originRef.current,
            init_xy: config.startPoint,
            optimiser: config.optim,
            learning_rate: config.lr,
            loss: loss,
            lock_to_plane: config.locked,
            rawdata: csvData,
        };
        return api.post('/animateminimiser', paramString);
      });

      const responses = await Promise.all(pathPromises);

      // Process all responses
      responses.forEach((resp, index) => {
        const pathData = resp.data;
        const path_arr =
          pathData.minimiser_path?.data ?? pathData.minimiser_path;
        const parameters_arr =
          pathData.parameters_path?.data ?? pathData.parameters_path;

        if (!Array.isArray(path_arr) || path_arr.length < 2) {
          throw new Error(`Invalid path data for path ${index + 1}`);
        } else if (
          !Array.isArray(parameters_arr) ||
          parameters_arr.length < 2
        ) {
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
      setIsPlaying(true);
      animationTimeRef.current = 0;

      if (clockRef.current && !clockRef.current.running) {
        clockRef.current.start();
      }
    } catch (err) {
      console.error('Failed to load one or more paths:', err);
      setIsPathLoaded(false);
    } finally {
      setIsPathLoading(false);
    }
  }, [pathConfigs, handleRemoveAllPaths, updatePathGeometry]);

  const getMaxSteps = useCallback(() => {
    if (!parametersArrayRef.current || parametersArrayRef.current.length === 0) return 1;
    // Use parametersArrayRef because it holds the raw, un-resampled backend data
    return Math.max(...parametersArrayRef.current.map(arr => arr.length));
  }, []);

  const getMaxDuration = useCallback(() => {
    if (!animationDurationsRef.current || animationDurationsRef.current.length === 0) return 1;
    return Math.max(...animationDurationsRef.current);
  }, []);

  const handleInputMove = useCallback(
    (event: any) => {
      if (event.type === 'touchmove' || event.type === 'touchstart') {
        event.preventDefault();
      }
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
      const coords = getNormalisedCoordinates(event, rect);
      if (isNaN(coords.x) || isNaN(coords.y)) return;

      MOUSE_VECTOR.set(coords.x, coords.y);
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
          ball.position.copy(TEMP_HIT_VECTOR);
        } else {
          ball.visible = false;
        }
      }
    },
    [placingPathId, getOrCreateMarker],
  );

  const handleInputClick = useCallback(
    (event: any) => {
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
      const coords = getNormalisedCoordinates(event, rect);
      MOUSE_VECTOR.set(coords.x, coords.y);
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

  const togglePlayPause = useCallback(() => {
    if (!clockRef.current) return;
    if (isPlaying) {
      clockRef.current.stop();
    } else {
      const maxDuration = Math.max(...animationDurationsRef.current, 0)
      if (animationTimeRef.current >= maxDuration) {
        animationTimeRef.current = 0;
        clockRef.current.start();
      } else if (animationTimeRef.current > 0) {
        clockRef.current.oldTime = performance.now();
        clockRef.current.running = true;
      } else {
        animationTimeRef.current = 0;
        clockRef.current.start();
      }
    }
    setIsPlaying((prev) => !prev);
  }, [isPlaying]);

  const handleSkipBack = useCallback(() => {
      const maxSteps = getMaxSteps();
      const maxDuration = getMaxDuration();

      // Time duration of exactly one original point
      const stepTime = maxDuration / Math.max(1, maxSteps - 1);
      
      animationTimeRef.current = Math.max(0, animationTimeRef.current - (20 * stepTime)); 
      
      const currentProg = (animationTimeRef.current / maxDuration) * 100;
      const currentF = Math.floor((animationTimeRef.current / maxDuration) * (maxSteps - 1)) + 1;
      
      setProgress(currentProg);
      setCurrentFrame(currentF);
      setTotalFrames(maxSteps);
  }, [getMaxSteps, getMaxDuration]);

  const handleSkipForward = useCallback(() => {
      const maxSteps = getMaxSteps();
      const maxDuration = getMaxDuration();

      // Time duration of exactly one original point
      const stepTime = maxDuration / Math.max(1, maxSteps - 1);
      
      animationTimeRef.current = Math.min(maxDuration, animationTimeRef.current + (20 * stepTime)); 
           
      const currentProg = (animationTimeRef.current / maxDuration) * 100;
      const currentF = Math.floor((animationTimeRef.current / maxDuration) * (maxSteps - 1)) + 1;
      
      setProgress(currentProg);
      setCurrentFrame(Math.min(currentF, maxSteps));
      setTotalFrames(maxSteps);
  }, [getMaxSteps, getMaxDuration]);

  const onViewNetwork = useCallback(
    (id: number) => {
      setNetworkViewId(id);
      networkViewIdRef.current = id;
    },
    [networkViewId],
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

  // --- Placing Mode Effect ---
  useEffect(() => {
    const canvas = rendererRef.current?.domElement;
    if (!canvas) return;

    // Disable camera controls when placing mode is active so touch doesn't rotate camera
    if (controlsRef.current) {
      controlsRef.current.enabled = !isPlacingMode;
    }

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

      canvas.addEventListener('mousemove', handleInputMove);
      canvas.addEventListener('touchstart', handleInputMove, {
        passive: false,
      });
      canvas.addEventListener('touchmove', handleInputMove, { passive: false });
      canvas.addEventListener('click', handleInputClick);
      canvas.addEventListener('touchend', handleInputClick);
      canvas.style.cursor = 'none';
    } else {
      canvas.style.cursor = 'auto';
    }

    return () => {
      canvas.removeEventListener('mousemove', handleInputMove);
      canvas.removeEventListener('touchstart', handleInputMove);
      canvas.removeEventListener('touchmove', handleInputMove);
      canvas.removeEventListener('click', handleInputClick);
      canvas.removeEventListener('touchend', handleInputClick);
      canvas.style.cursor = 'auto';
    };
  }, [
    isPlacingMode,
    placingPathId,
    getOrCreateMarker,
    handleInputMove,
    handleInputClick,
  ]);

  useEffect(() => {
    // Animation Loop
    const animate = () => {
        rafRef.current = requestAnimationFrame(animate);

        const clock = clockRef.current;
        if (!clock) return;

        const delta = clock.getDelta();

        if (!isPathLoadedRef.current) return;

        if (isPlayingRef.current) {
            animationTimeRef.current += delta;
        }

        const elapsedTime = animationTimeRef.current;

        for (let i = 0; i < pathLinesRef.current.length; i++) {
            const pathLine = pathLinesRef.current[i];
            const ball = ballsRef.current[i];
            const animationDuration = animationDurationsRef.current[i];
            const pts = pathPointsArrayRef.current[i];
            const norms = pathNormalsArrayRef.current[i];

            if (!pathLine || !ball || !animationDuration || !pts || !norms)
                continue;

            const LAG_TIME_SECONDS = 0.1;

            const ballProgress = Math.min(1.0, elapsedTime / animationDuration);
            const lineProgress = Math.max(0, (elapsedTime - LAG_TIME_SECONDS) / animationDuration);

            // Stop if finished
            if (lineProgress > 1.0) {
                // Check if this was the longest path to stop global playing
                if (animationDuration >= Math.max(...animationDurationsRef.current)) {
                  setIsPlaying(false);
                }
                continue;
            }

            // Animate Line
            const lineGeom = pathLine.geometry as LineGeometry;
            const totalLineSegments = lineGeom.attributes.instanceStart.count;
            const drawCount = Math.floor(lineProgress * totalLineSegments);
            lineGeom.instanceCount = drawCount;

            // Animate Ball
            const totalBallSegments = pts.length - 1;
            const currentSegmentFloat = ballProgress * totalBallSegments;
            const segmentIndex = Math.floor(currentSegmentFloat);
            const segmentProgress = currentSegmentFloat - segmentIndex;
            const i1 = Math.min(segmentIndex, totalBallSegments);
            const i2 = Math.min(i1 + 1, totalBallSegments);

            if (pts[i1] && norms[i1] && pts[i2] && norms[i2]) {
              const oldPos = ball.position.clone();

              // Calculate new position and normal
              TEMP_BALL_POS.copy(pts[i1]).lerp(pts[i2], segmentProgress);
              TEMP_BALL_NORM.copy(norms[i1])
              .lerp(norms[i2], segmentProgress)
              .normalize();
                        
              const radius = (ball.geometry as any).parameters?.radius ?? 0;
              TEMP_BALL_OFFSET.copy(TEMP_BALL_NORM).multiplyScalar(radius);
                    
              const newPos = TEMP_BALL_POS.clone().add(TEMP_BALL_OFFSET);

              // Only roll if the ball has actually moved and isn't at the origin (0,0,0)
              if (radius > 0 && oldPos.lengthSq() > 0) { 
                const deltaPos = newPos.clone().sub(oldPos);
                const distance = deltaPos.length();

                if (distance > 0.0001) { // Ignore tiny jitters
                  const moveDir = deltaPos.normalize();
                            
                    // The axis of rotation is perpendicular to the normal and movement dir
                    const rotationAxis = new THREE.Vector3().crossVectors(TEMP_BALL_NORM, moveDir).normalize();
                            
                    // Angle = distance / radius
                    const angle = distance / radius;
                            
                    ball.rotateOnWorldAxis(rotationAxis, angle);
                }
              }

              ball.position.copy(newPos);
            }

            // Update Network Params
            if (
                networkViewIdRef.current !== null &&
                networkViewIdRef.current === i
            ) {
                const timeStep = Math.floor(
                ballProgress * (parametersArrayRef.current[i].length - 1),
                );
                if (timeStep < parametersArrayRef.current[i].length) {
                setCurrentParams(
                    parametersArrayRef.current[networkViewIdRef.current][timeStep],
                );
                }
            }
        }

        if (isPlayingRef.current && isPathLoadedRef.current) {
            const delta = clock.getDelta();
            animationTimeRef.current += delta;
            const elapsedTime = animationTimeRef.current;

            const maxDuration = Math.max(...animationDurationsRef.current, 1);
        
            const now = performance.now();
            if (now - lastUiUpdateRef.current > 100) {
              const maxDuration = getMaxDuration();
              const maxSteps = getMaxSteps();

              const currentProg = Math.min(100, (elapsedTime / maxDuration) * 100);
              const currentF = Math.floor((elapsedTime / maxDuration) * (maxSteps - 1)) + 1;

              setProgress(currentProg);
              setCurrentFrame(Math.min(currentF, maxSteps));
              setTotalFrames(maxSteps);
            
              lastUiUpdateRef.current = now;
            }
        }
        if (isPlayingRef.current) {
            const now = performance.now();
            if (now - lastUiUpdateRef.current > 100) {
                const maxDuration = getMaxDuration();
                const maxSteps = getMaxSteps();

                const currentProg = Math.min(100, (elapsedTime / maxDuration) * 100);
                const currentF = Math.floor((elapsedTime / maxDuration) * (maxSteps - 1)) + 1;

                setProgress(currentProg);
                setCurrentFrame(Math.min(currentF, maxSteps));
                setTotalFrames(maxSteps);
                
                lastUiUpdateRef.current = now;
            }
        }
      };

      // Start everything
      animate();
  }, []);

  const handleLoadAllPathsButtonClick = useCallback(
    () => loadAndAnimateAllPaths(),
    [loadAndAnimateAllPaths],
  );

  return {
    isPathLoading,
    isPathLoaded,
    isPlaying,
    progress,
    currentFrame,
    totalFrames,
    isPlacingMode,
    placingPathId,
    currentParams,
    networkViewId,
    handleLoadAllPathsButtonClick,
    handleRemovePath,
    handleClearPaths,
    togglePlayPause,
    handleSkipBack,
    handleSkipForward,
    togglePlacingMode,
    onViewNetwork,
  };
}