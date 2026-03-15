import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../components/theme-provider';
import { Text } from '../../components/text';
import { Slider } from '../../components/slider';
import {
  Network,
  Layers,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  ScanLine,
} from 'lucide-react-native';
import * as THREE from 'three';

import { NetworkArchitecture } from '../../components/network-architecture';
import api from '../../src/api';
import {
  initScene,
  cleanupScene,
  handleResize,
  createLandscapeMesh,
} from '../../utils/threejs-utils';

type LandscapeDict = {
  surface: number[][];
  x_axis: number[];
  y_axis: number[];
};

type LandscapeTransform = {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  xRange: number;
  yRange: number;
  centerX: number;
  centerY: number;
  zMin: number;
  zRange: number;
  baseZScale: number;
  xToWorldScale: number;
  yToWorldScale: number;
};

const directionMap: { [key: number]: string } = {
  0: '+X',
  1: '-X',
  2: '+Z',
  3: '-Z',
  4: '-Y',
  5: '+Y',
  6: 'diag(-X,+Y,-Z)',
  7: 'diag(-X,-Y,-Z)',
  8: 'diag(-X,+Y,+Z)',
  9: 'diag(-X,-Y,+Z)',
  10: 'diag(+X,+Y,-Z)',
  11: 'diag(+X,-Y,-Z)',
  12: 'diag(+X,+Y,+Z)',
  13: 'diag(+X,-Y,+Z)',
};

const LANDSCAPE_Z_SCALE = 3.5;
const VECTOR_CAMERA_DISTANCE = 4.5;

const buildLandscapeTransform = (
  landscape: LandscapeDict,
): LandscapeTransform => {
  const xMin = landscape.x_axis[0];
  const xMax = landscape.x_axis[landscape.x_axis.length - 1];
  const yMin = landscape.y_axis[0];
  const yMax = landscape.y_axis[landscape.y_axis.length - 1];
  const xRange = Math.max(1e-6, xMax - xMin);
  const yRange = Math.max(1e-6, yMax - yMin);

  const zs = landscape.surface.flat();
  const zMin = Math.min(...zs);
  const zMax = Math.max(...zs);
  const zRange = Math.max(1e-6, zMax - zMin);

  return {
    xMin,
    xMax,
    yMin,
    yMax,
    xRange,
    yRange,
    centerX: (xMin + xMax) / 2,
    centerY: (yMin + yMax) / 2,
    zMin,
    zRange,
    baseZScale: 0.4,
    xToWorldScale: 2 / xRange,
    yToWorldScale: (2 * LANDSCAPE_Z_SCALE) / yRange,
  };
};

const mapDataPointToMeshWorld = (
  x: number,
  y: number,
  z: number,
  tf: LandscapeTransform,
) => {
  const xPct = (x - tf.xMin) / tf.xRange;
  const yPct = (y - tf.yMin) / tf.yRange;
  const localX = xPct * 2 - 1;
  const localY = yPct * 2 - 1;
  const localZ = ((z - tf.zMin) / tf.zRange) * tf.baseZScale;

  return new THREE.Vector3(localX, -localZ, localY * LANDSCAPE_Z_SCALE);
};

const makeDirections = () => {
  const axisDirections = [
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(-1, 0, 0),
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0, -1, 0),
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(0, 0, -1),
  ];

  const octantDiagonals: THREE.Vector3[] = [];
  [-1, 1].forEach((sx) => {
    [-1, 1].forEach((sy) => {
      [-1, 1].forEach((sz) => {
        octantDiagonals.push(new THREE.Vector3(sx, sy, sz).normalize());
      });
    });
  });

  return [...axisDirections, ...octantDiagonals];
};
const directions = makeDirections();

const makeAxisLabel = (
  text: '+X' | '-X' | '+Y' | '-Y' | '+Z' | '-Z',
  color: string,
) => {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = color;
  ctx.font = 'bold 72px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(0.24, 0.24, 0.24);
  return sprite;
};

function bilinearInterpolate(
  x: number,
  y: number,
  xAxis: number[],
  yAxis: number[],
  surface: number[][],
) {
  const xMin = xAxis[0];
  const xMax = xAxis[xAxis.length - 1];
  const yMin = yAxis[0];
  const yMax = yAxis[yAxis.length - 1];
  if (x < xMin || x > xMax || y < yMin || y > yMax) return null;

  const findBracket = (arr: number[], v: number) => {
    let i = 0;
    while (i < arr.length - 2 && arr[i + 1] < v) i++;
    return i;
  };

  const i = findBracket(xAxis, x);
  const j = findBracket(yAxis, y);

  const x0 = xAxis[i];
  const x1 = xAxis[i + 1];
  const y0 = yAxis[j];
  const y1 = yAxis[j + 1];

  const q11 = surface[j][i];
  const q21 = surface[j][i + 1];
  const q12 = surface[j + 1][i];
  const q22 = surface[j + 1][i + 1];

  const tx = x1 === x0 ? 0 : (x - x0) / (x1 - x0);
  const ty = y1 === y0 ? 0 : (y - y0) / (y1 - y0);

  const a = q11 * (1 - tx) + q21 * tx;
  const b = q12 * (1 - tx) + q22 * tx;
  return a * (1 - ty) + b * ty;
}

export function ProjectionsLesson({ onTaskUpdate }: any) {
  const { theme, isDark } = useTheme();

  const [depth, setDepth] = useState(1);
  const [width, setWidth] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [landscapeData, setLandscapeData] = useState<LandscapeDict | null>(
    null,
  );
  const [selectedDirections, setSelectedDirections] = useState<number[]>([]);
  const [planeOffset, setPlaneOffset] = useState(0);

  const landscapeContainerRef = useRef<any>(null);
  const vectorBallContainerRef = useRef<any>(null);
  const intersectionContainerRef = useRef<any>(null);

  const sceneRef = useRef<any>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);

  const vectorSceneRef = useRef<any>(null);
  const directionSpheresRef = useRef<THREE.Mesh[]>([]);

  const intersectionSceneRef = useRef<any>(null);
  const intersectionLineRef = useRef<THREE.Line | null>(null);

  const slicePlaneRef = useRef<THREE.Mesh | null>(null);
  const sliceLine3DRef = useRef<THREE.Line | null>(null);
  const isLandscapeDraggingRef = useRef(false);
  const isVectorDraggingRef = useRef(false);

  // Calculate the normal vector of the projection plane based on the two selected directions
  const projectionPlaneNormal = useMemo(() => {
    if (selectedDirections.length !== 2) return null;
    const a = directions[selectedDirections[0]];
    const b = directions[selectedDirections[1]];
    if (!a || !b) return null;

    const n = new THREE.Vector3().crossVectors(a, b);
    if (n.lengthSq() < 1e-6) return null;

    n.normalize();

    return n;
  }, [selectedDirections]);

  const landscapeTransform = useMemo(
    () => (landscapeData ? buildLandscapeTransform(landscapeData) : null),
    [landscapeData],
  );

  const planeCenterWorld = useMemo(() => {
    if (!projectionPlaneNormal || !landscapeTransform) return null;

    const centerData = new THREE.Vector2(
      landscapeTransform.centerX,
      landscapeTransform.centerY,
    );

    return mapDataPointToMeshWorld(
      centerData.x,
      centerData.y,
      landscapeTransform.zMin + landscapeTransform.zRange * 0.5,
      landscapeTransform,
    ).addScaledVector(projectionPlaneNormal, planeOffset);
  }, [projectionPlaneNormal, landscapeTransform, planeOffset]);

  useEffect(() => {
    //if (selectedDirections.includes(9)) {
    //  setPlaneOffset((prev) => -prev);
    //}
  }, [selectedDirections]);

  const crossSection = useMemo(() => {
    if (!landscapeData || !projectionPlaneNormal || !landscapeTransform)
      return [];

    const { x_axis, y_axis, surface } = landscapeData;

    // Calculate the 2D direction of the slice on the landscape floor (XY plane)
    let normal2D = new THREE.Vector2(
      projectionPlaneNormal.x,
      projectionPlaneNormal.z, // Z in world space corresponds to Y in landscape data
    );
    console.log('Normal2D:', normal2D);

    if (normal2D.lengthSq() < 1e-6) return [];
    normal2D.normalize();

    // Perpendicular vector for the direction of the line
    const dir = new THREE.Vector2(-normal2D.y, normal2D.x);
    console.log('Dir:', dir);
    const span = Math.max(landscapeTransform.xRange, landscapeTransform.yRange);
    const tMax = span * 1.8;
    const samples = 260;

    // If selected directions are Z and X, flip the normal to get the correct orientation of the slice line
    if (
      (selectedDirections.includes(0) && selectedDirections.includes(2)) || // +X and +Z
      (selectedDirections.includes(0) && selectedDirections.includes(3)) || // +X and -Z
      (selectedDirections.includes(1) && selectedDirections.includes(2)) || // -X and +Z
      (selectedDirections.includes(1) && selectedDirections.includes(3)) // -X and -Z
      //(selectedDirections.includes(2) && selectedDirections.includes(6)) || // +Z and diag(-X,+Y,-Z)
      //(selectedDirections.includes(2) && selectedDirections.includes(7)) || // +Z and diag(-X,-Y,-Z)
      //(selectedDirections.includes(2) && selectedDirections.includes(8)) || // +Z and diag(-X,+Y,+Z)
      //(selectedDirections.includes(2) && selectedDirections.includes(9)) || // +Z and diag(-X,-Y,+Z)
      //(selectedDirections.includes(2) && selectedDirections.includes(10)) || // +Z and diag(+X,+Y,-Z)
      //(selectedDirections.includes(2) && selectedDirections.includes(11)) || // +Z and diag(+X,-Y,-Z)
      //(selectedDirections.includes(2) && selectedDirections.includes(12)) || // +Z and diag(+X,+Y,+Z)
      //(selectedDirections.includes(2) && selectedDirections.includes(13)) || // +Z and diag(+X,-Y,+Z)
      //(selectedDirections.includes(3) && selectedDirections.includes(12)) || // -Z and diag(+X,+Y,+Z)
      //(selectedDirections.includes(3) && selectedDirections.includes(13)) // -Z and diag(+X,-Y,+Z)
    ) {
      normal2D.negate();
    }

    const lineCenter = new THREE.Vector2(
      landscapeTransform.centerX,
      landscapeTransform.centerY,
    ).addScaledVector(normal2D, planeOffset);
    console.log('Line Center:', lineCenter);
    const points: { x: number; y: number; z: number; t: number }[] = [];
    for (let i = 0; i < samples; i++) {
      const t = -tMax + (i / (samples - 1)) * tMax * 2;

      // Calculate the world coordinates of the sample point along the slice line
      let px = lineCenter.x + dir.x * t;
      let py = lineCenter.y + dir.y * t;

      const z = bilinearInterpolate(px, py, x_axis, y_axis, surface);
      if (z == null) continue;
      points.push({ x: px, y: py, z, t });
    }
    return points;
  }, [
    landscapeData,
    projectionPlaneNormal,
    planeOffset,
    landscapeTransform,
    selectedDirections,
  ]);

  useEffect(() => {
    if (!landscapeContainerRef.current) return;
    const container = landscapeContainerRef.current as HTMLElement;
    const { scene, camera, renderer, controls } = initScene(container);

    camera.position.set(0, 4, 2);
    controls.target.set(0, 0, 0);
    controls.update();

    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

    sceneRef.current = { scene, camera, renderer, controls };

    const onLandscapeControlStart = () => {
      isLandscapeDraggingRef.current = true;
    };
    const onLandscapeControlEnd = () => {
      isLandscapeDraggingRef.current = false;
    };
    controls.addEventListener('start', onLandscapeControlStart);
    controls.addEventListener('end', onLandscapeControlEnd);

    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      if (isVectorDraggingRef.current && vectorSceneRef.current?.camera) {
        const vectorCamera = vectorSceneRef.current
          .camera as THREE.PerspectiveCamera;
        if (vectorCamera.position.lengthSq() > 1e-6) {
          const landscapeDist = Math.max(1e-6, camera.position.length());
          camera.position.copy(vectorCamera.position).setLength(landscapeDist);
          camera.up.copy(vectorCamera.up);
          controls.target.set(0, 0, 0);
        }
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => handleResize(container, camera, renderer, null);
    window.addEventListener('resize', onResize);

    return () => {
      controls.removeEventListener('start', onLandscapeControlStart);
      controls.removeEventListener('end', onLandscapeControlEnd);
      isLandscapeDraggingRef.current = false;
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', onResize);
      cleanupScene(scene, renderer);
    };
  }, []);

  useEffect(() => {
    if (!vectorBallContainerRef.current) return;
    const container = vectorBallContainerRef.current as HTMLElement;
    const { scene, camera, renderer, controls } = initScene(container);

    // Diagonal facing +X (X label), +Y (Z label), -Z (Y label)
    const dist = VECTOR_CAMERA_DISTANCE;
    const d = dist / Math.sqrt(3);
    camera.position.set(d, d, -d);
    controls.target.set(0, 0, 0);
    controls.enableRotate = true;
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.update();

    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    scene.add(
      new THREE.Mesh(
        new THREE.SphereGeometry(1.2, 24, 24),
        new THREE.MeshBasicMaterial({
          color: 0x9ca3af,
          wireframe: true,
          transparent: true,
          opacity: 0.25,
        }),
      ),
    );

    const axisLength = 1.45;
    const axisLines = new THREE.AxesHelper(axisLength);
    scene.add(axisLines);

    const xLabel = makeAxisLabel('+X', '#ef4444');
    const xLabelOpp = makeAxisLabel('-X', '#ef4444');
    const yLabel = makeAxisLabel('+Y', '#22c55e');
    const yLabelOpp = makeAxisLabel('-Y', '#22c55e');
    const zLabel = makeAxisLabel('+Z', '#3b82f6');
    const zLabelOpp = makeAxisLabel('-Z', '#3b82f6');
    if (xLabel) {
      xLabel.position.set(axisLength + 0.16, 0, 0);
      scene.add(xLabel);
    }
    if (xLabelOpp) {
      xLabelOpp.position.set(-(axisLength + 0.16), 0, 0);
      scene.add(xLabelOpp);
    }
    if (yLabel) {
      yLabel.position.set(0, 0, -(axisLength + 0.16));
      scene.add(yLabel);
    }
    if (yLabelOpp) {
      yLabelOpp.position.set(0, 0, axisLength + 0.16);
      scene.add(yLabelOpp);
    }
    if (zLabel) {
      zLabel.position.set(0, axisLength + 0.16, 0);
      scene.add(zLabel);
    }
    if (zLabelOpp) {
      zLabelOpp.position.set(0, -(axisLength + 0.16), 0);
      scene.add(zLabelOpp);
    }

    directionSpheresRef.current = [];
    directions.forEach((d, idx) => {
      const arrow = new THREE.ArrowHelper(
        d.clone().normalize(),
        new THREE.Vector3(0, 0, 0),
        1.1,
        0x60a5fa,
        0.16,
        0.08,
      );
      scene.add(arrow);

      const node = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 12, 12),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8 }),
      );
      node.position.copy(d.clone().multiplyScalar(1.25));
      node.userData.idx = idx;
      scene.add(node);
      directionSpheresRef.current.push(node);
    });

    vectorSceneRef.current = { scene, camera, renderer, controls };

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerDown = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(directionSpheresRef.current);
      if (!hits.length) return;
      const idx = hits[0].object.userData.idx as number;

      setSelectedDirections((prev) => {
        if (prev.includes(idx)) return prev.filter((v) => v !== idx);
        if (prev.length >= 2) return [prev[1], idx];
        return [...prev, idx];
      });
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);

    const onVectorControlStart = () => {
      isVectorDraggingRef.current = true;
    };
    const onVectorControlEnd = () => {
      isVectorDraggingRef.current = false;
    };
    controls.addEventListener('start', onVectorControlStart);
    controls.addEventListener('end', onVectorControlEnd);

    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      if (
        !isVectorDraggingRef.current &&
        sceneRef.current?.camera &&
        !isLandscapeDraggingRef.current
      ) {
        const landscapeCamera = sceneRef.current
          .camera as THREE.PerspectiveCamera;
        if (landscapeCamera.position.lengthSq() > 1e-6) {
          camera.position.copy(landscapeCamera.position).setLength(dist);
          camera.up.copy(landscapeCamera.up);
          camera.lookAt(0, 0, 0);
        }
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => handleResize(container, camera, renderer, null);
    window.addEventListener('resize', onResize);

    return () => {
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      controls.removeEventListener('start', onVectorControlStart);
      controls.removeEventListener('end', onVectorControlEnd);
      isVectorDraggingRef.current = false;
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', onResize);
      cleanupScene(scene, renderer);
    };
  }, []);

  // Update the colors of the direction spheres based on selection
  useEffect(() => {
    directionSpheresRef.current.forEach((m) => {
      const selected = selectedDirections.includes(m.userData.idx);
      const material = m.material as THREE.MeshStandardMaterial;
      material.color.set(selected ? 0x22c55e : 0x94a3b8);
      material.emissive.set(selected ? 0x14532d : 0x000000);
    });
  }, [selectedDirections]);

  // When the projection plane changes, update the slice line in the landscape scene and the corresponding line in the intersection scene
  useEffect(() => {
    if (!intersectionContainerRef.current) return;
    const container = intersectionContainerRef.current as HTMLElement;

    const width = container.clientWidth || 1;
    const height = container.clientHeight || 1;

    const VIEW_H = 2.8;
    const VIEW_W = VIEW_H; // always square — never rescale to aspect ratio

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(
      -VIEW_W,
      VIEW_W,
      VIEW_H,
      -VIEW_H,
      0.1,
      100,
    );
    camera.position.set(0, 0, 10);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 1));

    // Grid lines
    for (let x = -3; x <= 3; x++) {
      scene.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(x * (VIEW_W / 3), -VIEW_H, 0),
            new THREE.Vector3(x * (VIEW_W / 3), VIEW_H, 0),
          ]),
          new THREE.LineBasicMaterial({
            color: 0x334155,
            transparent: true,
            opacity: 0.4,
          }),
        ),
      );
    }
    for (let y = -3; y <= 3; y++) {
      scene.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-VIEW_W, y * (VIEW_H / 3), 0),
            new THREE.Vector3(VIEW_W, y * (VIEW_H / 3), 0),
          ]),
          new THREE.LineBasicMaterial({
            color: 0x334155,
            transparent: true,
            opacity: 0.4,
          }),
        ),
      );
    }

    // Axes
    scene.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-VIEW_W, 0, 0),
          new THREE.Vector3(VIEW_W, 0, 0),
        ]),
        new THREE.LineBasicMaterial({ color: 0x64748b }),
      ),
    );
    scene.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, -VIEW_H, 0),
          new THREE.Vector3(0, VIEW_H, 0),
        ]),
        new THREE.LineBasicMaterial({ color: 0x64748b }),
      ),
    );

    intersectionSceneRef.current = { scene, camera, renderer, VIEW_W, VIEW_H };

    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const w = container.clientWidth || 1;
      const h = container.clientHeight || 1;
      // Frustum stays square; only the renderer pixel size changes
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', onResize);
      cleanupScene(scene, renderer);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchLandscape = async () => {
      if (!sceneRef.current) return;
      setIsLoading(true);

      try {
        const payload = {
          network: { activation: 'Tanh', depth, width },
          method: 'RANDOMDIRS',
          data: 'SINREGRESSION',
          loss: 'MSELoss',
          rawdata: null,
          args: null,
        };

        const resp = await api.post('/generatelandscape', payload);
        if (!isMounted) return;

        const dict = resp.data;
        if (!dict?.surface || !dict.x_axis || !dict.y_axis) {
          throw new Error('Invalid data received from API');
        }
        setLandscapeData(dict);

        const { scene } = sceneRef.current;

        if (meshRef.current) {
          scene.remove(meshRef.current);
          meshRef.current.geometry.dispose();
          if (Array.isArray(meshRef.current.material)) {
            meshRef.current.material.forEach((m) => m.dispose());
          } else {
            meshRef.current.material.dispose();
          }
        }

        const { mesh } = createLandscapeMesh(false, dict, LANDSCAPE_Z_SCALE);
        if (mesh.userData.wireframe) mesh.userData.wireframe.visible = false;
        scene.add(mesh);
        meshRef.current = mesh;
      } catch (err) {
        console.error('Failed to load landscape:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchLandscape();
    return () => {
      isMounted = false;
    };
  }, [depth, width]);

  useEffect(() => {
    if (!sceneRef.current) return;
    const { scene } = sceneRef.current;

    if (slicePlaneRef.current) {
      scene.remove(slicePlaneRef.current);
      slicePlaneRef.current.geometry.dispose();
      (slicePlaneRef.current.material as THREE.Material).dispose();
      slicePlaneRef.current = null;
    }

    if (!projectionPlaneNormal || !planeCenterWorld) return;

    const squareSize = 4;

    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(squareSize, squareSize),
      new THREE.MeshBasicMaterial({
        color: 0x22c55e,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide,
      }),
    );
    plane.position.copy(planeCenterWorld);
    const q = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      projectionPlaneNormal,
    );
    plane.quaternion.copy(q);

    scene.add(plane);
    slicePlaneRef.current = plane;
  }, [projectionPlaneNormal, planeCenterWorld]);

  useEffect(() => {
    if (!sceneRef.current) return;
    const { scene } = sceneRef.current;

    if (sliceLine3DRef.current) {
      scene.remove(sliceLine3DRef.current);
      sliceLine3DRef.current.geometry.dispose();
      (sliceLine3DRef.current.material as THREE.Material).dispose();
      sliceLine3DRef.current = null;
    }

    if (
      crossSection.length < 2 ||
      !landscapeTransform ||
      !projectionPlaneNormal ||
      !planeCenterWorld
    )
      return;
  }, [
    crossSection,
    landscapeTransform,
    projectionPlaneNormal,
    planeCenterWorld,
  ]);

  useEffect(() => {
    if (!intersectionSceneRef.current || !landscapeTransform) return;
    const { scene, VIEW_W, VIEW_H } = intersectionSceneRef.current;

    if (intersectionLineRef.current) {
      scene.remove(intersectionLineRef.current);
      intersectionLineRef.current.geometry.dispose();
      (intersectionLineRef.current.material as THREE.Material).dispose();
      intersectionLineRef.current = null;
    }

    if (crossSection.length < 2) return;

    const { zMin, zRange } = landscapeTransform;

    const pts = crossSection.map((p) => {
      const x = p.t * VIEW_W;
      const y = ((p.z - zMin) / zRange) * (VIEW_H * 2) - VIEW_H;
      return new THREE.Vector3(x, y, 0);
    });

    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color: 0x22c55e }),
    );
    scene.add(line);
    intersectionLineRef.current = line;
  }, [crossSection, landscapeTransform]);

  const handleZoom = (direction: 'in' | 'out') => {
    if (!sceneRef.current) return;
    const { camera } = sceneRef.current;
    camera.position.multiplyScalar(direction === 'in' ? 0.8 : 1.2);
  };

  return (
    <View style={styles.mainContainer}>
      <View style={styles.groupContainer}>
        {/* LEFT PANEL */}
        <View style={(styles.subPanel, { width: 300 })}>
          <View
            style={[
              styles.subHeader,
              { borderBottomColor: theme.colors.border },
            ]}
          >
            <Network size={12} color={theme.colors.accent} />
            <Text style={styles.subTitle}>NETWORK + PROJECTION VECTORS</Text>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View
              style={[
                styles.wideGraphBox,
                {
                  backgroundColor: isDark
                    ? 'rgba(0,0,0,0.2)'
                    : 'rgba(0,0,0,0.03)',
                  padding: 16,
                  borderRadius: 8,
                  opacity: isLoading ? 0.5 : 1,
                },
              ]}
            >
              <NetworkArchitecture
                inputs={1}
                depth={depth}
                width={width}
                activation={'Tanh'}
                outputs={1}
                weights={[]}
              />
            </View>

            <View style={styles.controlGroup}>
              <View style={styles.sliderGroup}>
                <Text
                  style={[
                    styles.controlLabel,
                    { color: theme.colors.mutedForeground },
                  ]}
                >
                  NETWORK DEPTH (LAYERS): {depth}
                </Text>
                <Slider
                  style={{ flex: 1, height: 40, marginTop: 4 }}
                  value={depth}
                  min={1}
                  max={5}
                  step={1}
                  onValueChange={setDepth}
                  disabled={isLoading}
                  minimumTrackTintColor={theme.colors.accent}
                  thumbTintColor={theme.colors.foreground}
                />
              </View>

              <View style={styles.sliderGroup}>
                <Text
                  style={[
                    styles.controlLabel,
                    { color: theme.colors.mutedForeground },
                  ]}
                >
                  LAYER WIDTH (NEURONS): {width}
                </Text>
                <Slider
                  style={{ flex: 1, height: 40, marginTop: 4 }}
                  value={width}
                  min={1}
                  max={5}
                  step={1}
                  onValueChange={setWidth}
                  disabled={isLoading}
                  minimumTrackTintColor={theme.colors.accent}
                  thumbTintColor={theme.colors.foreground}
                />
              </View>
            </View>

            <View
              style={[styles.vectorBox, { borderColor: theme.colors.border }]}
            >
              <Text
                style={[
                  styles.controlLabel,
                  { marginBottom: 8, color: theme.colors.mutedForeground },
                ]}
              >
                3D VECTOR BALL (SELECT 2)
              </Text>
              <View
                ref={vectorBallContainerRef}
                style={{ height: 220, width: '100%' }}
              />
              <Text
                style={{
                  marginTop: 8,
                  fontSize: 11,
                  color: theme.colors.mutedForeground,
                }}
              >
                Selected:{' '}
                {selectedDirections.length
                  ? selectedDirections.map((v) => directionMap[v]).join(', ')
                  : 'None'}
              </Text>
            </View>

            <View style={styles.sliderGroup}>
              <Text
                style={[
                  styles.controlLabel,
                  { color: theme.colors.mutedForeground },
                ]}
              >
                PLANE OFFSET: {planeOffset.toFixed(2)}
              </Text>
              <Slider
                style={{ flex: 1, height: 40, marginTop: 4 }}
                value={planeOffset}
                min={-3}
                max={3}
                step={0.02}
                onValueChange={setPlaneOffset}
                disabled={selectedDirections.length !== 2 || isLoading}
                minimumTrackTintColor={theme.colors.accent}
                thumbTintColor={theme.colors.foreground}
              />
            </View>
          </ScrollView>
        </View>

        {/* MIDDLE PANEL */}
        <View
          style={[
            styles.subPanel,
            {
              flex: 1.2,
              backgroundColor: 'rgba(0,0,0,0.05)',
              position: 'relative',
            },
          ]}
        >
          <View
            style={[
              styles.subHeader,
              { borderBottomColor: theme.colors.border, zIndex: 10 },
            ]}
          >
            <Layers size={12} color={theme.colors.accent} />
            <Text style={styles.subTitle}>3D LOSS TOPOGRAPHY</Text>
            <View style={styles.headerControls}>
              <TouchableOpacity onPress={() => handleZoom('in')}>
                <ZoomIn size={16} color={theme.colors.foreground} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleZoom('out')}>
                <ZoomOut size={16} color={theme.colors.foreground} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setDepth(1);
                  setWidth(1);
                  setSelectedDirections([]);
                  setPlaneOffset(0);
                  if (sceneRef.current) {
                    sceneRef.current.camera.position.set(0, 4, 2);
                    sceneRef.current.controls.target.set(0, 0, 0);
                  }
                }}
              >
                <RefreshCw size={16} color={theme.colors.foreground} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.squareViewportWrap}>
            <View ref={landscapeContainerRef} style={styles.squareViewport} />
          </View>

          {isLoading && (
            <View style={[StyleSheet.absoluteFill, styles.loadingOverlay]}>
              <ActivityIndicator size='large' color={theme.colors.powderBlue} />
              <Text
                style={{ marginTop: 12, fontWeight: 'bold', color: '#fff' }}
              >
                Generating Topology...
              </Text>
            </View>
          )}
        </View>

        {/* RIGHT PANEL */}
        <View
          style={[
            styles.subPanel,
            { flex: 0.9, backgroundColor: 'rgba(0,0,0,0.04)' },
          ]}
        >
          <View
            style={[
              styles.subHeader,
              { borderBottomColor: theme.colors.border },
            ]}
          >
            <ScanLine size={12} color={theme.colors.accent} />
            <Text style={styles.subTitle}>INTERSECTION PROFILE</Text>
          </View>
          <View style={styles.squareViewportWrap}>
            <View
              ref={intersectionContainerRef}
              style={styles.squareViewport}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  groupContainer: { flex: 1, flexDirection: 'row', gap: 1 },
  subPanel: { flex: 1 },
  subHeader: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    gap: 8,
  },
  headerControls: {
    marginLeft: 'auto',
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  subTitle: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  scrollContent: { paddingHorizontal: 24, paddingVertical: 24 },
  wideGraphBox: { width: '100%', minHeight: 120, justifyContent: 'center' },
  controlGroup: { width: '100%', gap: 16 },
  controlLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  sliderGroup: { marginBottom: 8 },
  squareViewportWrap: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  squareViewport: {
    width: '100%',
    aspectRatio: 1,
    maxHeight: '100%',
  },
  vectorBox: {
    marginTop: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
  },
  loadingOverlay: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
});
