import { useEffect, useRef, useState, useCallback } from 'react';
import { View } from 'react-native';
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

// --- Constants ---
const animationSpeed = 0.2;

// --- Reusable Three.js Vectors/Matrices ---
const TEMP_BALL_POS = new THREE.Vector3();
const TEMP_BALL_NORM = new THREE.Vector3();
const TEMP_BALL_OFFSET = new THREE.Vector3();
const MOUSE_VECTOR = new THREE.Vector2();
const TEMP_HIT_VECTOR = new THREE.Vector3();
const LINE_TOP_OFFSET = new THREE.Vector3(0, 0.2, 0);
const VIRTUAL_GROUND_PLANE = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

export interface UseVisualisationProps {
  activation: string;
  depth: number;
  width: number;
  method: string;
  data: string;
  csv: string;
  loss: string;
}

export function useVisualisation(props: UseVisualisationProps) {
    const {
        activation,
        depth,
        width,
        method,
        data,
        csv,
        loss,
    } = props;

    // --- UI State ---
    const [datasetInputs, setDatasetInputs] = useState<number | null>(null);
    const [datasetOutputs, setDatasetOutputs] = useState<number | null>(null);
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
    const [networkViewId, setNetworkViewId] = useState<number | null>(null);

    // --- Internal state refs ---
    const dataRef = useRef<string>(data);
    const lossRef = useRef<string>(loss);
    const activationRef = useRef<string>(activation);
    const depthRef = useRef<number>(depth);
    const csvRef = useRef<string | null>(csv);
    const widthRef = useRef<number>(width);
    const dictRef = useRef<any>(null);
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
    const markersRef = useRef<{
        [id: number]: { ball: THREE.Mesh; line: THREE.Line };
    }>({});

    // --- Refs for Animation Loop ---
    // These refs will mirror the state, so the animate loop can read them
    const isPlayingRef = useRef(isPlaying);
    const isPathLoadedRef = useRef(isPathLoaded);
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

    // --- Scene Setup ---
    const rafRef = useRef<number>(0);
    const resizeObserverRef = useRef<ResizeObserver | null>(null);

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

    const setContainerRef = useCallback((node: View | null) => {
        if (!node) {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            if (resizeObserverRef.current) resizeObserverRef.current.disconnect();
            if (sceneRef.current && rendererRef.current) {
                cleanupScene(sceneRef.current, rendererRef.current);
            }
            sceneRef.current = null;
            rendererRef.current = null;
            return;
        }

        if (sceneRef.current) return;

        // Cast the View to a Div for Three.js
        const container = node as unknown as HTMLDivElement;

        const { scene, camera, renderer, controls } = initScene(container);

        sceneRef.current = scene;
        cameraRef.current = camera;
        rendererRef.current = renderer;
        controlsRef.current = controls;

        clockRef.current = new THREE.Clock();
        raycasterRef.current = new THREE.Raycaster();

        // Resize Logic
        const onResize = () => {
        if (!container || !camera || !renderer) return;
        const w = container.clientWidth;
        const h = container.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        };

        // Animation Loop
        const animate = () => {
        rafRef.current = requestAnimationFrame(animate);

        const clock = clockRef.current;
        if (!clock || !scene || !camera || !renderer) return;

        controls.update();
        renderer.render(scene, camera);

        if (isPlayingRef.current && isPathLoadedRef.current) {
            const delta = clock.getDelta();
            animationTimeRef.current += delta;
            const elapsedTime = animationTimeRef.current;

            for (let i = 0; i < pathLinesRef.current.length; i++) {
            const pathLine = pathLinesRef.current[i];
            const ball = ballsRef.current[i];
            const animationDuration = animationDurationsRef.current[i];
            const pts = pathPointsArrayRef.current[i];
            const norms = pathNormalsArrayRef.current[i];

            if (!pathLine || !ball || !animationDuration || !pts || !norms)
                continue;

            const pathProgress = elapsedTime / animationDuration;

            // Stop if finished
            if (pathProgress > 1.0) {
                // Check if this was the longest path to stop global playing
                if (
                animationDuration >= Math.max(...animationDurationsRef.current)
                ) {
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

            // Update Network Params
            if (
                networkViewIdRef.current !== null &&
                networkViewIdRef.current === i
            ) {
                const timeStep = Math.floor(
                pathProgress * (parametersArrayRef.current[i].length - 1),
                );
                if (timeStep < parametersArrayRef.current[i].length) {
                setCurrentParams(
                    parametersArrayRef.current[networkViewIdRef.current][timeStep],
                );
                }
            }
            }
        }
        };

        // Start everything
        animate();

        const resizeObserver = new ResizeObserver(onResize);
        resizeObserver.observe(container);
        resizeObserverRef.current = resizeObserver;

        // Initial resize to ensure canvas isn't 0x0
        onResize();
    }, []);

    /**
     * Fetches landscape data and builds the mesh.
     */
    const loadAndBuildLandscape = useCallback(async () => {
        const scene = sceneRef.current;
        if (!scene) {
            console.error('Scene not initialised yet');
            return;
        }
        setIsLandscapeLoading(true);
        // handleRemoveAllPaths();
        disposeObject(meshRef.current);
        meshRef.current = null;
        let raw_data = null;
        if (data === 'CUSTOM') {
            raw_data = csv;
        }
        try {
        const paramString = {
            network: { activation, depth, width },
            method: method,
            data: data,
            loss: loss,
            rawdata: raw_data,
        };
        const resp = await api.post('/generatelandscape', paramString);
        const dict = resp.data;

        dataRef.current = data;
        csvRef.current = csv;
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

        const { mesh, geoWidth, geoHeight } = createLandscapeMesh(
            isLogPlot,
            dict,
            zValue,
        );
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
            center.z + cameraDist * 0.7, // Depth
            );
            cameraRef.current.updateProjectionMatrix();
            controlsRef.current.update();
        }
        setIsLandscapeLoaded(true);
        } catch (err) {
            alert('Failed to load landscape:' + err);
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
        sceneRef,
        // handleRemoveAllPaths,
    ]);

    const handleGenerateLandscapeButtonClick = useCallback(
        () => loadAndBuildLandscape(),
        [loadAndBuildLandscape],
    );

    return {
        isLandscapeLoading,
        isLandscapeLoaded,
        handleGenerateLandscapeButtonClick,
        containerRef: setContainerRef,
    }
};