import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';

/**
 * Creates the scene, camera, renderer, lights, and controls.
 */
export function initScene(container: HTMLElement) {
  const width = container.clientWidth;
  const height = container.clientHeight;
  const scene = new THREE.Scene();

  // Camera
  const camera = new THREE.PerspectiveCamera(
    45,
    width / height,
    0.1,
    1000,
  );
  camera.position.set(0, -3, 5);
  camera.updateProjectionMatrix();

  // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, height);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.domElement.style.position = 'absolute';
  renderer.domElement.style.top = '0';
  renderer.domElement.style.left = '0';
  renderer.domElement.style.zIndex = '1';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  container.appendChild(renderer.domElement);

  // Controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.update();

  scene.add(new THREE.AmbientLight(0xffffff, 3.0));

  const overheadLight = new THREE.DirectionalLight(0xffffff, 2.5); // High intensity (2.5)
  overheadLight.position.set(0, 200, 0);
  overheadLight.castShadow = true;
  
  // Optimize shadow map for overhead view
  overheadLight.shadow.mapSize.width = 2048; 
  overheadLight.shadow.mapSize.height = 2048;
  overheadLight.shadow.camera.near = 0.5;
  overheadLight.shadow.camera.far = 50;
  // Increase shadow camera size to cover the whole landscape from above
  overheadLight.shadow.camera.left = -20;
  overheadLight.shadow.camera.right = 20;
  overheadLight.shadow.camera.top = 20;
  overheadLight.shadow.camera.bottom = -20;

  scene.add(overheadLight);

  const underLight = new THREE.DirectionalLight(0xffffff, 1.5);
  underLight.position.set(0, -20, 0);

  scene.add(underLight);

  return { scene, camera, renderer, controls };
}

/**
 * Creates the landscape mesh from API data.
 */
export function createLandscapeMesh(isLogPlot: boolean, data: any, zValue: number) {
  const zGrid: number[][] = isLogPlot ? data.surface_log : data.surface;
  const xs: number[] = data.x_axis;
  const ys: number[] = data.y_axis;

  const nx = xs.length;
  const ny = ys.length;

  const geoWidth = xs[nx - 1] - xs[0];
  const geoHeight = ys[ny - 1] - ys[0];
  const widthSegments = nx - 1;
  const heightSegments = ny - 1;

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

  const RAINBOW = ['#9333ea', '#3b82f6', '#22d3ee', '#4ade80', '#eab308', '#ef4444'];
  const segmentCount = RAINBOW.length - 1;

  const colors = new Float32Array(vertexCount * 3);
  let v = 0;

  const _c1 = new THREE.Color();
  const _c2 = new THREE.Color();
  const _finalColor = new THREE.Color();

  for (let j = 0; j <= heightSegments; j++) {
    for (let i = 0; i <= widthSegments; i++) {
      const row = heightSegments - j;
      const col = i;
      const zVal = zGrid[row][col];
      positions.setZ(v, ((zVal - minZ) / range) * baseZScale);
      const t = Math.max(0, Math.min(1, (zVal - minZ) / range));
      
      // Map 0-1 to segments
      const scaledT = t * segmentCount;
      const index = Math.floor(scaledT);
      const localT = scaledT - index;

      // Get the two neighboring colors
      const hex1 = RAINBOW[Math.min(index, segmentCount)];
      const hex2 = RAINBOW[Math.min(index + 1, segmentCount)];
      
      // Interpolate
      _c1.set(hex1);
      _c2.set(hex2);
      _finalColor.copy(_c1).lerp(_c2, localT);

      // Apply
      colors[v * 3] = _finalColor.r;
      colors[v * 3 + 1] = _finalColor.g;
      colors[v * 3 + 2] = _finalColor.b;
      v++;
    }
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    side: THREE.DoubleSide,
    flatShading: false,
    metalness: 0.5,
    roughness: 0.5,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  mesh.castShadow = true;
  mesh.scale.set(1, 1, zValue);
  
  return { mesh, geoWidth, geoHeight };
}

/**
 * Helper to interpolate colors from a palette array based on a 0-1 value (t).
 */
function getColorAtT(t: number, colors: string[], target: THREE.Color) {
  // Clamp values
  if (t <= 0) return target.set(colors[0]);
  if (t >= 1) return target.set(colors[colors.length - 1]);

  const segmentCount = colors.length - 1;
  const scaledT = t * segmentCount;
  const index = Math.floor(scaledT);       // The lower color index
  const localT = scaledT - index;          // The interpolation factor between lower and upper

  const c1 = new THREE.Color(colors[index]);
  const c2 = new THREE.Color(colors[Math.min(index + 1, segmentCount)]);
  
  return target.copy(c1).lerp(c2, localT);
}

/**
 * Updates an existing mesh's vertex colors based on a new color palette.
 */
export function updateMeshColors(mesh: THREE.Mesh, palette: string[]) {
  if (!mesh || !mesh.geometry) return;

  const geom = mesh.geometry;
  const posAttr = geom.attributes.position;
  const count = posAttr.count;

  // Find the Min and Max height of the geometry
  let minH = Infinity;
  let maxH = -Infinity;

  for (let i = 0; i < count; i++) {
    const z = posAttr.getZ(i);
    if (z < minH) minH = z;
    if (z > maxH) maxH = z;
  }

  const range = maxH - minH || 1;

  if (!geom.attributes.color) {
    geom.setAttribute('color', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  }
  const colAttr = geom.attributes.color;
  const tempColor = new THREE.Color();

  // Iterate through vertices and color them
  for (let i = 0; i < count; i++) {
    const z = posAttr.getZ(i);
    const t = (z - minH) / range;

    getColorAtT(t, palette, tempColor);

    colAttr.setXYZ(i, tempColor.r, tempColor.g, tempColor.b);
  }

  colAttr.needsUpdate = true;

  if (!Array.isArray(mesh.material)) {
    if (!mesh.material.vertexColors) {
        mesh.material.vertexColors = true;
        mesh.material.needsUpdate = true;
    }
  }
}

/**
 * Projects a 2D path onto the 3D mesh using a raycaster.
 */
export function project2DPathTo3D(
  mesh: THREE.Mesh,
  path2D: THREE.Vector2[],
  raycaster: THREE.Raycaster,
) {
  const lineLiftAmount = 0.002;
  const newPathPoints: THREE.Vector3[] = [];
  const newPathNormals: THREE.Vector3[] = [];
  let totalLength = 0;

  const NORMAL_MATRIX = new THREE.Matrix3();
  const TEMP_WORLD_NORMAL = new THREE.Vector3();
  const TEMP_LIFT_OFFSET = new THREE.Vector3();
  const RAY_ORIGIN = new THREE.Vector3();
  const RAY_DIRECTION = new THREE.Vector3(0, -1, 0);

  NORMAL_MATRIX.getNormalMatrix(mesh.matrixWorld);

  for (const p of path2D) {
    RAY_ORIGIN.set(p.x, 100, -p.y); // Y-up in 3D, Z-down
    raycaster.set(RAY_ORIGIN, RAY_DIRECTION);
    const hit = raycaster.intersectObject(mesh)[0];

    if (hit) {
      TEMP_WORLD_NORMAL.copy(hit.face!.normal)
        .applyMatrix3(NORMAL_MATRIX)
        .normalize();
      TEMP_LIFT_OFFSET.copy(TEMP_WORLD_NORMAL).multiplyScalar(lineLiftAmount);
      const liftedPoint = hit.point.clone().add(TEMP_LIFT_OFFSET);

      if (newPathPoints.length > 0) {
        totalLength += liftedPoint.distanceTo(
          newPathPoints[newPathPoints.length - 1],
        );
      }
      newPathPoints.push(liftedPoint);
      newPathNormals.push(TEMP_WORLD_NORMAL.clone());
    } else {
      console.warn('Raycast did not hit the mesh for point:', p);
    }
  }

  // Create smooth 3D points for the line geometry
  const positions: number[] = [];
  if (newPathPoints.length >= 2) {
    const curve3D = new THREE.CatmullRomCurve3(
      newPathPoints,
      false,
      'centripetal',
    );
    const smooth3DPoints = curve3D.getPoints(1000);
    for (const p of smooth3DPoints) {
      positions.push(p.x, p.y, p.z);
    }
  }

  return { newPathPoints, newPathNormals, positions, totalLength };
}

/**
 * Creates or updates the visible path line.
 */
export function createOrUpdatePathLine(
  scene: THREE.Scene,
  positions: number[],
  existingLine: Line2 | null,
  color: string,
  canvasSize: { width: number; height: number } = { width: window.innerWidth, height: window.innerHeight }
) {
  if (existingLine) {
    (existingLine.geometry as LineGeometry).setPositions(positions);
    return existingLine;
  }

  const lineGeometry = new LineGeometry();
  lineGeometry.setPositions(positions);
  const lineMaterial = new LineMaterial({
    color: new THREE.Color(color).getHex(),
    linewidth: 5,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    depthWrite: false, // Prevents z-fighting with the terrain
    toneMapped: false,
  }) as any;
  lineMaterial.resolution = new THREE.Vector2(
    canvasSize.width,
    canvasSize.height,
  );
  const line2 = new Line2(lineGeometry as any, lineMaterial);
  (line2.geometry as any).instanceCount = 0;
  line2.renderOrder = 1;
  scene.add(line2);
  return line2;
}

/**
 * Creates the animated ball.
 */
export function createBall(
  scene: THREE.Scene,
  mesh: THREE.Mesh,
  pathPoints: THREE.Vector3[],
  pathNormals: THREE.Vector3[],
  color: string,
) {
  const TEMP_BBOX_SIZE = new THREE.Vector3();
  const TEMP_BALL_OFFSET = new THREE.Vector3();

  mesh.geometry.computeBoundingBox();
  mesh.geometry.boundingBox!.getSize(TEMP_BBOX_SIZE);
  const geoWidth = TEMP_BBOX_SIZE.x || 1;
  const geoHeight = TEMP_BBOX_SIZE.z || 1;
  const ballRadius = Math.hypot(geoWidth, geoHeight) * 0.01;

  const ballGeometry = new THREE.SphereGeometry(ballRadius, 32, 32);
  const ballMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(color),
    emissive: new THREE.Color(color),
    emissiveIntensity: 0.5,
    metalness: 0.1,
    roughness: 0.1,
    clearcoat: 1.0,
    clearcoatRoughness: 0.0,
    reflectivity: 1.0,
  });
  const ball = new THREE.Mesh(ballGeometry, ballMaterial);
  ball.castShadow = true;
  ball.receiveShadow = true;

  if (pathPoints.length > 0 && pathNormals.length > 0) {
    TEMP_BALL_OFFSET.copy(pathNormals[0]).multiplyScalar(ballRadius);
    ball.position.copy(pathPoints[0]).add(TEMP_BALL_OFFSET);
  }

  scene.add(ball);
  return ball;
}

/**
 * Creates the ghost objects for placing mode.
 */
export function createGhostObjects(
  scene: THREE.Scene,
  ballRadius: number,
  color: string,
) {
  const ballGeometry = new THREE.SphereGeometry(ballRadius, 32, 32);
  const ballMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(color),
    emissive: new THREE.Color(color),
    emissiveIntensity: 0.5,
    metalness: 0.1,
    roughness: 0.1,
    clearcoat: 1.0,
    clearcoatRoughness: 0.0,
    reflectivity: 1.0,
  });
  const ghostBall = new THREE.Mesh(ballGeometry, ballMaterial);
  ghostBall.visible = false;
  scene.add(ghostBall);

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
  const ghostLine = new THREE.Line(lineGeom, lineMat);
  ghostLine.visible = false;
  scene.add(ghostLine);

  return { ghostBall, ghostLine };
}

/**
 * Handles window resize events for camera and line material.
 */
export function handleResize(
  container: HTMLElement,
  camera: THREE.PerspectiveCamera,
  renderer: THREE.WebGLRenderer,
  pathLines: Line2[] | Line2 | null,
) {
  const width = container.clientWidth;
  const height = container.clientHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio); 
  const lines = Array.isArray(pathLines) ? pathLines : (pathLines ? [pathLines] : []);
  
  lines.forEach(line => {
      const mat = line.material as any;
      if (mat && mat.resolution) {
        mat.resolution.set(width, height);
      }
  });
}

/**
 * Disposes all of a scene's children and related assets.
 */
export function cleanupScene(
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer,
) {
  try {
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry?.dispose();
        if (Array.isArray(object.material)) {
          object.material.forEach((material) => material.dispose());
        } else {
          object.material?.dispose();
        }
      } else if (object instanceof Line2) {
        (object.geometry as any)?.dispose();
        (object.material as any)?.dispose();
      }
    });
    scene.clear();
    renderer.dispose();
    if (renderer.domElement.parentElement) {
      renderer.domElement.parentElement.removeChild(renderer.domElement);
    }
  } catch (err) {
    console.warn('Error during scene cleanup:', err);
  }
}
