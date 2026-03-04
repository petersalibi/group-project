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
  updateMeshColors,
  createOrUpdatePathLine,
  createBall,
  createGhostObjects,
  handleResize,
  cleanupScene,
} from '../utils/threejs-utils';
import { usePathVisualisations } from './path-visualisations';
import { gradientPresets } from '../constants/constants';
import { PathConfigInterface } from '../components/path-config';

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
  dir1: number;
  dir2: number;
  data: string;
  csv: string;
  loss: string;
  pathConfigs: PathConfigInterface[];
  onPathConfigChange;
  setLog;
}

export function useVisualisation(props: UseVisualisationProps) {
    const {
        activation,
        depth,
        width,
        method,
        dir1,
        dir2,
        data,
        csv,
        loss,
        pathConfigs,
        onPathConfigChange,
        setLog
    } = props;

    // --- UI State ---
    const [zValue, setZValue] = useState(1);
    const [logPlot, setLogPlot] = useState(true);
    const [isRotating, setIsRotating] = useState(false);
    const [datasetInputs, setDatasetInputs] = useState<number | null>(null);
    const [datasetOutputs, setDatasetOutputs] = useState<number | null>(null);
    const [isLandscapeLoading, setIsLandscapeLoading] = useState<boolean>(false);
    const [isLandscapeLoaded, setIsLandscapeLoaded] = useState<boolean>(false);
    const [minMaxLoss, setMinMaxLoss] = useState([0, 0]);

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
    const regenPathRef = useRef<number[][] | null>(null);

    // --- Three.js refs ---
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);
    const meshRef = useRef<THREE.Mesh | null>(null);
    const raycasterRef = useRef<THREE.Raycaster | null>(null);
    const clockRef = useRef<THREE.Clock | null>(null);
    const rafRef = useRef<number>(0);
    const landscapeColoursRef = useRef(gradientPresets[0].colors);

    // --- Scene Setup ---
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

    const {
        isPathLoading,
        isPathLoaded,
        isPlaying,
        progress,
        currentFrame,
        totalFrames,
        isPlacingMode,
        placingPathId,
        currentParams,
        viewId,
        currentLoss,
        lossChange,
        fidelity,
        markersRef,
        parametersArrayRef,
        fidelityArrayRef,
        handleLoadAllPathsButtonClick,
        loadRegenPath,
        handleRemovePath,
        handleClearPaths,
        togglePlayPause,
        handleSkipBack,
        handleSkipForward,
        togglePlacingMode,
        onViewPath,
    } = usePathVisualisations({
        activation,
        depth,
        width,
        data,
        csv,
        loss,
        setLog,
        minMaxLoss,
        zScale: zValue,
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
        dictRef,
    })

    const setCameraControls = () => {
        if (cameraRef.current && controlsRef.current && meshRef.current) {
            const box = new THREE.Box3().setFromObject(meshRef.current);
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

        // Animation Loop
        const animate = () => {
            rafRef.current = requestAnimationFrame(animate);

            if (!scene || !camera || !renderer) return;

            controls.update();
            renderer.render(scene, camera);
        };

        animate();

        // Resize Logic
        const onResize = () => {
            if (!container || !camera || !renderer) return;
            const w = container.clientWidth;
            const h = container.clientHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        };

        const resizeObserver = new ResizeObserver(onResize);
        resizeObserver.observe(container);
        resizeObserverRef.current = resizeObserver;

        // Initial resize to ensure canvas isn't 0x0
        onResize();
    }, []);

    /**
     * Fetches landscape data and builds the mesh.
     */
    const loadAndBuildLandscape = useCallback(async (
        overrideMethod?: string,
        overrideArgs?: any
    ) => {
        const scene = sceneRef.current;
        if (!scene) {
        console.error('Scene not initialised yet');
        return;
        }
        
        setIsLandscapeLoading(true);
        disposeObject(meshRef.current);
        handleClearPaths();
        meshRef.current = null;
        
        let raw_data = null;
        if (data === 'CUSTOM') raw_data = csv;
        
        // Determine which method and args to use
        const targetMethod = overrideMethod || method;
        let targetArgs = overrideArgs;
        
        // If no override args were passed and it's TWOPARAMETERS, use dir1/dir2
        if (!targetArgs && targetMethod === 'TWOPARAMETERS') {
            targetArgs = [dir1, dir2];
        }

        try {
        const paramString = {
            network: { activation, depth, width },
            method: targetMethod,
            data: data,
            loss: loss,
            rawdata: raw_data,
            args: targetArgs,
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
        originRef.current = dict.theta_0;
        xDirRef.current = dict.x_direction;
        yDirRef.current = dict.y_direction;
        if (dict.pca_trajectories) regenPathRef.current = dict.pca_trajectories;

        const { mesh, geoWidth, geoHeight } = createLandscapeMesh(
            logPlot,
            dict,
            zValue,
        );
        scene.add(mesh);
        meshRef.current = mesh;

        const lossGrid: number[][] = logPlot ? dict.surface_log : dict.surface;
        const minLoss = Math.min(...lossGrid.flat());
        const maxLoss = Math.max(...lossGrid.flat());
        setMinMaxLoss([minLoss, maxLoss]);

        setCameraControls();
        setIsLandscapeLoaded(true);

        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { hour12: false });
        const newLogEntry = `[${timeString}] Landscape generated with parameters: activation=${activation}, loss=${loss}, method=${targetMethod}, depth=${depth}, width=${width}`;
        setLog(prevLog => [...prevLog, newLogEntry]);

        } catch (err) {
        alert('Failed to load landscape: ' + err);
        setIsLandscapeLoaded(false);
        } finally {
        setIsLandscapeLoading(false);
        }
    }, [
        activation, depth, width, method, dir1, dir2, data, csv, loss, logPlot, zValue, setLog
    ]);

    const handleZChange = useCallback((val: number) => {
        setZValue(val);
        if (meshRef.current) {

            meshRef.current.scale.z = val;
            meshRef.current.updateMatrixWorld();

            // Update placed markers
            if (markersRef.current) {
                const downDir = new THREE.Vector3(0, -1, 0);
                const dropRaycaster = new THREE.Raycaster();

                Object.values(markersRef.current).forEach((marker: any) => {
                    if (!marker || !marker.ball || !marker.ball.visible) return;

                    // Grab the 2D floor coordinates of the existing marker
                    const currentX = marker.ball.position.x;
                    const currentZ = marker.ball.position.z; 

                    // Shoot a ray from high above that exact spot straight down
                    dropRaycaster.set(new THREE.Vector3(currentX, 100, currentZ), downDir);
                    
                    const intersects = dropRaycaster.intersectObject(meshRef.current);
                    
                    if (intersects.length > 0) {
                        const hit = intersects[0];
                        
                        TEMP_HIT_VECTOR.copy(hit.point).add(LINE_TOP_OFFSET);
                        marker.ball.position.copy(TEMP_HIT_VECTOR);
                        
                        (marker.line.geometry as THREE.BufferGeometry).setFromPoints([hit.point, TEMP_HIT_VECTOR]);
                        marker.line.computeLineDistances();
                    }
                });
            }
            }
    }, [isPathLoaded, markersRef] );

    const handleLogPlotToggle = useCallback(() => {
        if (!sceneRef.current) return;
        setIsLandscapeLoading(true);
        disposeObject(meshRef.current);
        meshRef.current = null;

        const { mesh, geoWidth, geoHeight } = createLandscapeMesh(!logPlot, dictRef.current, zValue);
        sceneRef.current.add(mesh);
        meshRef.current = mesh;
        updateMeshColors(mesh, landscapeColoursRef.current);

        setLogPlot((prev) => !prev);
        setIsLandscapeLoading(false);

    }, [zValue, logPlot]);

    const handleRotate = useCallback(() => {
        if (!controlsRef.current) return;

        controlsRef.current.autoRotate = !controlsRef.current.autoRotate;
        controlsRef.current.autoRotateSpeed = 3.0; 
        setIsRotating(controlsRef.current.autoRotate);

    }, []);

    const handleRefresh = useCallback(() => {
        if (!sceneRef.current) return;

        setCameraControls();

    }, []);

    const handleColorSelect = useCallback((themeId: string) => {
        const mesh = meshRef.current;
        const preset = gradientPresets.find(p => p.id === themeId); 
        const colors = preset ? preset.colors : null;
        if (mesh && colors) {
            updateMeshColors(mesh, colors);
            landscapeColoursRef.current = colors;
        }
    }, []);

    const handleGenerateLandscapeButtonClick = useCallback(() => {
        loadAndBuildLandscape(); 
    }, [loadAndBuildLandscape]);

    const handlePCAPress = useCallback(async (pathId: number) => {
        if (!parametersArrayRef.current || !parametersArrayRef.current[pathId]) {
            alert("No parameter data found for this path.");
            return;
        }

        const pathParameters = parametersArrayRef.current[pathId];

        // Save the original parameters before wiping the arrays
        const savedParams = parametersArrayRef.current[pathId];
        const savedFidelity = fidelityArrayRef.current[pathId];

        await loadAndBuildLandscape('PCAMINIMISER', pathParameters);

        if (regenPathRef.current) {
            loadRegenPath(savedParams, savedFidelity, regenPathRef.current);
            return true;
        }

    }, [loadAndBuildLandscape, parametersArrayRef, fidelityArrayRef, loadRegenPath]);

    return {
        isLandscapeLoading,
        isLandscapeLoaded,
        handleGenerateLandscapeButtonClick,
        logPlot,
        handleLogPlotToggle,
        zValue,
        handleZChange,
        isRotating,
        handleRotate,
        handleRefresh,
        handleColorSelect,
        containerRef: setContainerRef,
        isPathLoading,
        isPathLoaded,
        isPlaying,
        progress,
        currentFrame,
        totalFrames,
        isPlacingMode,
        placingPathId,
        currentParams,
        viewId,
        currentLoss,
        lossChange,
        fidelity,
        handleLoadAllPathsButtonClick,
        handlePCAPress,
        handleRemovePath,
        handleClearPaths,
        togglePlayPause,
        handleSkipBack,
        handleSkipForward,
        togglePlacingMode,
        onViewPath,
    }
};