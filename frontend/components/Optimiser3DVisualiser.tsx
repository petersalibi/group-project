import React, {
  useRef,
  useEffect,
  useState,
  useImperativeHandle,
  forwardRef,
} from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Text } from './text';
import { useTheme } from './theme-provider';
import * as THREE from 'three';
import api from '../src/api';

import {
  initScene,
  cleanupScene,
  handleResize,
  createLandscapeMesh,
} from '../utils/threejs-utils';

export interface OptimiserVisualiserHandle {
  step: () => void;
  toggleRun: () => boolean;
  reset: () => void;
}

interface Props {
  optimizer: 'GD' | 'SGD' | 'RMSprop' | 'Adam';
  learningRate: number;
  curveRef: React.RefObject<HTMLCanvasElement>;
  forcesRef: React.RefObject<HTMLCanvasElement>;
}

type PathNode = { x: number; z: number; y: number; loss: number };

const Z_SCALE = 2.5;

const Optimiser3DVisualiser = forwardRef<OptimiserVisualiserHandle, Props>(
  ({ optimizer, learningRate, curveRef, forcesRef }, ref) => {
    const { theme } = useTheme();

    const containerRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<any>(null);

    const [isRunning, setIsRunning] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({ w1: 0, w2: 0, loss: 0, steps: 0 });

    // Store API Data
    const dictRef = useRef<any>(null);

    // Optimizer Memory & Path State (Coordinates are in Mesh Space [-1, 1])
    const optStateRef = useRef({ m1: 0, m2: 0, v1: 0, v2: 0, t: 0 });
    const posRef = useRef({ x: 0.8, z: -0.8 }); // Start top-right
    const pathRef = useRef<PathNode[]>([]);
    const propsRef = useRef({ optimizer, learningRate });

    useEffect(() => {
      if (propsRef.current.optimizer !== optimizer)
        optStateRef.current = { m1: 0, m2: 0, v1: 0, v2: 0, t: 0 };
      propsRef.current = { optimizer, learningRate };
    }, [optimizer, learningRate]);

    // --- API DATA INTERPOLATION MATH ---
    const getInterpolatedLoss = (x: number, z: number) => {
      const dict = dictRef.current;
      if (!dict || !dict.surface) return 0;

      const M = dict.surface.length; // Rows
      const N = dict.surface[0].length; // Cols

      // Map coordinates [-1, 1] to UV [0, 1]
      const u = Math.max(0, Math.min(1, (x + 1) / 2));
      const v = Math.max(0, Math.min(1, (z + 1) / 2));

      const col = u * (N - 1);
      // Note: Z=1 (bottom of mesh) maps to row=0 in the API array due to how createLandscapeMesh builds
      const row = (1 - v) * (M - 1);

      const c0 = Math.floor(col);
      const c1 = Math.min(c0 + 1, N - 1);
      const r0 = Math.floor(row);
      const r1 = Math.min(r0 + 1, M - 1);

      const tc = col - c0;
      const tr = row - r0;

      const v00 = dict.surface[r0][c0];
      const v10 = dict.surface[r0][c1];
      const v01 = dict.surface[r1][c0];
      const v11 = dict.surface[r1][c1];

      const top = v00 * (1 - tc) + v10 * tc;
      const bottom = v01 * (1 - tc) + v11 * tc;

      return top * (1 - tr) + bottom * tr;
    };

    const getGradient = (x: number, z: number) => {
      const eps = 1e-4;
      const L = getInterpolatedLoss(x, z);
      return {
        dx: (getInterpolatedLoss(x + eps, z) - L) / eps,
        dz: (getInterpolatedLoss(x, z + eps) - L) / eps,
      };
    };

    // Maps the API Loss value to the physical Y height in the 3D Scene
    const getWorldY = (lossVal: number) => {
      const dict = dictRef.current;
      if (!dict) return 0;
      const zs = dict.surface.flat();
      const minZ = Math.min(...zs);
      const maxZ = Math.max(...zs);
      const range = maxZ - minZ || 1;
      const t = Math.max(0, Math.min(1, (lossVal - minZ) / range));
      return t * 0.4 * Z_SCALE; // 0.4 is the baseZScale hardcoded in createLandscapeMesh
    };

    // --- 1. FETCH API AND BUILD 3D SCENE ---
    useEffect(() => {
      if (!containerRef.current) return;
      const container = containerRef.current;
      const { scene, camera, renderer, controls } = initScene(container);

      camera.position.set(1.5, 1.2, 2.0); // Closer camera for the [-1, 1] mesh
      controls.target.set(0, 0, 0);
      controls.update();

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
      scene.add(ambientLight);
      const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
      dirLight.position.set(10, 20, 10);
      scene.add(dirLight);

      let isMounted = true;
      let animationId: number;

      const loadLandscape = async () => {
        setIsLoading(true);
        try {
          const payload = {
            network: { activation: 'Tanh', depth: 4, width: 5 },
            method: 'RANDOMDIRS',
            data: 'SINREGRESSION',
            loss: 'MSELoss',
            rawdata: null,
            args: null,
          };

          const resp = await api.post('/generatelandscape', payload);
          if (!isMounted) return;
          dictRef.current = resp.data;

          const { mesh } = createLandscapeMesh(false, resp.data, Z_SCALE);
          if (mesh.userData.wireframe) mesh.userData.wireframe.visible = false;
          scene.add(mesh);

          // Build Optimizer Elements
          const marker = new THREE.Mesh(
            new THREE.SphereGeometry(0.04, 16, 16),
            new THREE.MeshBasicMaterial({ color: '#ffffff' }),
          );
          scene.add(marker);
          const line = new THREE.Line(
            new THREE.BufferGeometry(),
            new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 }),
          );
          scene.add(line);

          // Force Arrows
          const gradArrow = new THREE.ArrowHelper(
            new THREE.Vector3(1, 0, 0),
            new THREE.Vector3(),
            0,
            0xef4444,
            0.05,
            0.03,
          );
          const momArrow = new THREE.ArrowHelper(
            new THREE.Vector3(1, 0, 0),
            new THREE.Vector3(),
            0,
            0x3b82f6,
            0.05,
            0.03,
          );
          const stepArrow = new THREE.ArrowHelper(
            new THREE.Vector3(1, 0, 0),
            new THREE.Vector3(),
            0,
            0x10b981,
            0.05,
            0.03,
          );
          scene.add(gradArrow);
          scene.add(momArrow);
          scene.add(stepArrow);

          // Initialize Position
          const l0 = getInterpolatedLoss(posRef.current.x, posRef.current.z);
          const y0 = getWorldY(l0);
          pathRef.current = [
            { x: posRef.current.x, z: posRef.current.z, y: y0, loss: l0 },
          ];
          marker.position.set(posRef.current.x, y0 + 0.04, posRef.current.z);

          sceneRef.current = {
            scene,
            camera,
            renderer,
            controls,
            mesh,
            marker,
            line,
            gradArrow,
            momArrow,
            stepArrow,
          };
          setStats({
            w1: posRef.current.x,
            w2: posRef.current.z,
            loss: l0,
            steps: 0,
          });
          drawCurve();
        } catch (err) {
          console.error('Failed to load landscape:', err);
        } finally {
          if (isMounted) setIsLoading(false);
        }
      };

      loadLandscape();

      // --- RAYCASTER INTERACTION ---
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();

      const onPointerDown = (e: PointerEvent) => {
        if (!sceneRef.current || !sceneRef.current.mesh) return;
        const rect = container.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(sceneRef.current.mesh);

        if (intersects.length > 0) {
          const pt = intersects[0].point;
          posRef.current = { x: pt.x, z: pt.z };
          optStateRef.current = { m1: 0, m2: 0, v1: 0, v2: 0, t: 0 };

          const l0 = getInterpolatedLoss(pt.x, pt.z);
          pathRef.current = [{ x: pt.x, z: pt.z, y: pt.y, loss: l0 }];

          sceneRef.current.marker.position.set(pt.x, pt.y + 0.04, pt.z);
          sceneRef.current.line.geometry.setFromPoints([]);
          sceneRef.current.gradArrow.setLength(0.001);
          sceneRef.current.momArrow.setLength(0.001);
          sceneRef.current.stepArrow.setLength(0.001);

          setStats({ w1: pt.x, w2: pt.z, loss: l0, steps: 0 });
          drawCurve();
        }
      };
      container.addEventListener('pointerdown', onPointerDown);

      const animate = () => {
        animationId = requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      };
      animate();

      const onResize = () => handleResize(container, camera, renderer, null);
      window.addEventListener('resize', onResize);

      return () => {
        isMounted = false;
        cancelAnimationFrame(animationId);
        window.removeEventListener('resize', onResize);
        container.removeEventListener('pointerdown', onPointerDown);
        cleanupScene(scene, renderer);
      };
    }, []);

    // --- 2. OPTIMIZER MATH & ARROW UPDATES ---
    const stepOptimizer = () => {
      if (!sceneRef.current || !dictRef.current) return;
      const { marker, line, gradArrow, momArrow, stepArrow } = sceneRef.current;
      const { optimizer: opt, learningRate: lr } = propsRef.current;
      let { x, z } = posRef.current;

      const { dx, dz } = getGradient(x, z);
      const state = optStateRef.current;
      const eps = 1e-8;

      let rawStepX = dx,
        rawStepZ = dz;
      let momX = 0,
        momZ = 0;
      let stepX = 0,
        stepZ = 0;

      if (opt === 'GD') {
        stepX = dx;
        stepZ = dz;
      } else if (opt === 'SGD') {
        const NOISE = 0.5;
        stepX = dx + (Math.random() * 2 - 1) * NOISE;
        stepZ = dz + (Math.random() * 2 - 1) * NOISE;
      } else if (opt === 'RMSprop') {
        state.v1 = 0.9 * state.v1 + 0.1 * dx * dx;
        state.v2 = 0.9 * state.v2 + 0.1 * dz * dz;
        stepX = dx / (Math.sqrt(state.v1) + eps);
        stepZ = dz / (Math.sqrt(state.v2) + eps);
      } else if (opt === 'Adam') {
        state.t += 1;
        state.m1 = 0.9 * state.m1 + 0.1 * dx;
        state.m2 = 0.9 * state.m2 + 0.1 * dz;
        state.v1 = 0.999 * state.v1 + 0.001 * dx * dx;
        state.v2 = 0.999 * state.v2 + 0.001 * dz * dz;

        const m1_hat = state.m1 / (1 - Math.pow(0.9, state.t));
        const m2_hat = state.m2 / (1 - Math.pow(0.9, state.t));
        const v1_hat = state.v1 / (1 - Math.pow(0.999, state.t));
        const v2_hat = state.v2 / (1 - Math.pow(0.999, state.t));

        momX = state.m1;
        momZ = state.m2;
        stepX = m1_hat / (Math.sqrt(v1_hat) + eps);
        stepZ = m2_hat / (Math.sqrt(v2_hat) + eps);
      }

      // Update Position (Clamped to mesh bounds [-1, 1])
      x = Math.max(-1, Math.min(1, x - lr * stepX));
      z = Math.max(-1, Math.min(1, z - lr * stepZ));
      posRef.current = { x, z };

      const newLoss = getInterpolatedLoss(x, z);
      const newY = getWorldY(newLoss);
      pathRef.current.push({ x, z, y: newY, loss: newLoss });
      if (pathRef.current.length > 500) pathRef.current.shift();

      // Map path to Three Vector3 array for rendering
      const vecPath = pathRef.current.map(
        (p) => new THREE.Vector3(p.x, p.y + 0.02, p.z),
      );

      // Update 3D Visuals
      const currentVec = new THREE.Vector3(x, newY + 0.04, z);
      marker.position.copy(currentVec);
      line.geometry.setFromPoints(vecPath);

      // Update 3D Arrows (Scaled down visually so they don't clip through the camera)
      const updateArrow = (
        arrow: any,
        ax: number,
        az: number,
        scale: number,
      ) => {
        const len = Math.sqrt(ax * ax + az * az);
        if (len > 0.001) {
          arrow.setDirection(new THREE.Vector3(-ax, 0, -az).normalize());
          arrow.setLength(Math.min(0.4, len * scale));
          arrow.position.copy(currentVec);
          arrow.visible = true;
        } else {
          arrow.visible = false;
        }
      };
      updateArrow(gradArrow, rawStepX, rawStepZ, 0.05);
      updateArrow(momArrow, momX, momZ, 0.05);
      updateArrow(stepArrow, stepX, stepZ, 0.05);

      setStats({
        w1: x,
        w2: z,
        loss: newLoss,
        steps: pathRef.current.length - 1,
      });
      drawCurve();
      drawForces(rawStepX, rawStepZ, momX, momZ, stepX, stepZ);
    };

    // --- 3. 2D CANVAS DRAWING (Delegated to Left Panel) ---
    const drawCurve = () => {
      if (!curveRef.current || !dictRef.current) return;
      const ctx = curveRef.current.getContext('2d');
      if (!ctx) return;

      const w = curveRef.current.width;
      const h = curveRef.current.height;
      ctx.clearRect(0, 0, w, h);

      const path = pathRef.current;
      if (path.length === 0) return;

      // Y Axis represents Loss (From 0 to the Max Loss of the landscape)
      const zs = dictRef.current.surface.flat();
      const maxLoss = Math.max(...zs);
      const minLoss = Math.min(...zs);

      const mapX = (index: number) => (index / Math.max(100, path.length)) * w;
      const mapY = (loss: number) =>
        h - 10 - ((loss - minLoss) / (maxLoss - minLoss || 1)) * (h - 20);

      ctx.lineWidth = 2;
      ctx.strokeStyle = theme.colors.frenchBlue || '#3b82f6';
      ctx.beginPath();
      path.forEach((p, i) => {
        if (i === 0) {
          ctx.moveTo(mapX(i), mapY(p.loss));
        } else {
          ctx.lineTo(mapX(i), mapY(p.loss));
        }
      });
      ctx.stroke();

      // Draw Current Dot
      const lastP = path[path.length - 1];
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(mapX(path.length - 1), mapY(lastP.loss), 4, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawForces = (
      g1: number,
      g2: number,
      m1: number,
      m2: number,
      s1: number,
      s2: number,
    ) => {
      if (!forcesRef.current) return;
      const ctx = forcesRef.current.getContext('2d');
      if (!ctx) return;

      const w = forcesRef.current.width;
      const h = forcesRef.current.height;
      const cx = w / 2;
      const cy = h / 2;
      ctx.clearRect(0, 0, w, h);

      // Crosshairs
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(w, cy);
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, h);
      ctx.stroke();

      const drawArrow = (dx: number, dy: number, color: string) => {
        if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) return;
        const scale = 5;
        const ex = cx - dx * scale;
        const ey = cy - dy * scale;

        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(ex, ey);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(ex, ey, 3, 0, Math.PI * 2);
        ctx.fill();
      };

      drawArrow(g1, g2, '#ef4444'); // Grad
      drawArrow(m1, m2, '#3b82f6'); // Mom
      drawArrow(s1, s2, '#10b981'); // Step
    };

    // --- PLAY/PAUSE LOOP ---
    useEffect(() => {
      let raf: number;
      const loop = () => {
        stepOptimizer();
        raf = requestAnimationFrame(loop);
      };
      if (isRunning) raf = requestAnimationFrame(loop);
      return () => cancelAnimationFrame(raf);
    }, [isRunning]);

    // --- EXPOSE CONTROLS TO PARENT ---
    useImperativeHandle(ref, () => ({
      step: () => stepOptimizer(),
      toggleRun: () => {
        setIsRunning(!isRunning);
        return !isRunning;
      },
      reset: () => {
        setIsRunning(false);
        optStateRef.current = { m1: 0, m2: 0, v1: 0, v2: 0, t: 0 };
        posRef.current = { x: 0.8, z: -0.8 };

        const l0 = getInterpolatedLoss(0.8, -0.8);
        const y0 = getWorldY(l0);
        pathRef.current = [{ x: 0.8, z: -0.8, y: y0, loss: l0 }];

        if (sceneRef.current) {
          sceneRef.current.marker.position.set(0.8, y0 + 0.04, -0.8);
          sceneRef.current.line.geometry.setFromPoints([]);
          sceneRef.current.gradArrow.setLength(0.001);
          sceneRef.current.momArrow.setLength(0.001);
          sceneRef.current.stepArrow.setLength(0.001);
        }
        setStats({ w1: 0.8, w2: -0.8, loss: l0, steps: 0 });
        drawCurve();
        drawForces(0, 0, 0, 0, 0, 0);
      },
    }));

    return (
      <View
        style={{
          flex: 1,
          width: '100%',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          ref={containerRef}
          style={{ width: '100%', height: '100%', background: '#000' }}
        />

        {/* GUI OVERLAY */}
        <View
          style={{
            position: 'absolute',
            top: 16,
            left: 16,
            padding: 12,
            backgroundColor: 'rgba(0,0,0,0.8)',
            borderRadius: 8,
            borderWidth: 1,
            borderColor: theme.colors.border,
            zIndex: 1,
          }}
        >
          <Text
            style={{
              fontSize: 10,
              color: theme.colors.mutedForeground,
              marginBottom: 8,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            Click landscape to teleport
          </Text>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <View>
              <Text
                style={{ fontSize: 9, color: theme.colors.mutedForeground }}
              >
                PROJECTION X
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: '#fff',
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                }}
              >
                {stats.w1.toFixed(3)}
              </Text>
            </View>
            <View>
              <Text
                style={{ fontSize: 9, color: theme.colors.mutedForeground }}
              >
                PROJECTION Y
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: '#fff',
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                }}
              >
                {stats.w2.toFixed(3)}
              </Text>
            </View>
          </View>
          <View
            style={{
              height: 1,
              backgroundColor: 'rgba(255,255,255,0.1)',
              marginVertical: 8,
            }}
          />
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <View>
              <Text
                style={{ fontSize: 9, color: theme.colors.mutedForeground }}
              >
                MSE LOSS
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: '#ef4444',
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                }}
              >
                {stats.loss.toFixed(4)}
              </Text>
            </View>
            <View>
              <Text
                style={{ fontSize: 9, color: theme.colors.mutedForeground }}
              >
                STEPS
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: theme.colors.frenchBlue,
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                }}
              >
                {stats.steps}
              </Text>
            </View>
          </View>

          {/* LEGEND */}
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#ef4444',
                }}
              />
              <Text style={{ fontSize: 9, color: '#fff' }}>Gradient</Text>
            </View>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#3b82f6',
                }}
              />
              <Text style={{ fontSize: 9, color: '#fff' }}>Momentum</Text>
            </View>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#10b981',
                }}
              />
              <Text style={{ fontSize: 9, color: '#fff' }}>Step</Text>
            </View>
          </View>
        </View>

        {/* LOADING OVERLAY */}
        {isLoading && (
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: 'rgba(0,0,0,0.6)',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 20,
              },
            ]}
          >
            <ActivityIndicator size='large' color={theme.colors.frenchBlue} />
            <Text style={{ marginTop: 12, fontWeight: 'bold', color: '#fff' }}>
              Generating Topology...
            </Text>
          </View>
        )}
      </View>
    );
  },
);

Optimiser3DVisualiser.displayName = 'Optimiser3DVisualiser';
export default Optimiser3DVisualiser;
