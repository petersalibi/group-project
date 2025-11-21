import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';

/**
 * Creates the scene, camera, renderer, lights, and controls.
 */
export function initScene(container: HTMLElement) {
  // Scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a1a);

  // Camera
  const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000,
  );
  camera.position.set(0, -3, 5);
  camera.updateProjectionMatrix();

  // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.domElement.style.position = 'absolute';
  renderer.domElement.style.top = '0';
  renderer.domElement.style.left = '0';
  renderer.domElement.style.zIndex = '1';
  container.appendChild(renderer.domElement);

  // Controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0, 0);
  controls.update();

  // Lights
  scene.add(new THREE.AmbientLight(0xffffff, 0.3));
  const hemiLight = new THREE.HemisphereLight(0x4488ff, 0x000000, 0.5);
  scene.add(hemiLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
  directionalLight.position.set(2, 5, 3);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 1024;
  directionalLight.shadow.mapSize.height = 1024;
  scene.add(directionalLight);

  return { scene, camera, renderer, controls };
}

/**
 * Creates the landscape mesh from API data.
 */
export function createLandscapeMesh(data: any, zValue: number) {
  const zGrid: number[][] = data.surface;
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
    metalness: 0.2,
    roughness: 0.5,
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
  wireframeMesh.position.y = 0.001;
  mesh.add(wireframeMesh);

  mesh.scale.set(1, 1, zValue);
  return { mesh, geoWidth, geoHeight };
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
    window.innerWidth,
    window.innerHeight,
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
  camera: THREE.PerspectiveCamera,
  renderer: THREE.WebGLRenderer,
  pathLine: Line2 | null,
) {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);

  if (pathLine) {
    const mat = pathLine.material as any;
    if (mat && mat.resolution) {
      mat.resolution.set(window.innerWidth, window.innerHeight);
    }
  }
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
