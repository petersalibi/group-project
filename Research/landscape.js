import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'; // Used for camera control

// Create scene
const container = document.getElementById('container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f0f0);

// Create camera
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, -3, 3);

// Create renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

// Add controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.update();

// Add lights
const light = new THREE.DirectionalLight(0xffffff, 1.5);
light.position.set(1, 1, 1);
scene.add(light);
scene.add(new THREE.AmbientLight(0xffffff, 0.8));

let mesh = null;

// Load JSON of {x, y, z} points
async function loadAndBuild(url) {
  const res = await fetch(url);
  const data = await res.json();

  // Convert to arrays
  const xs = data.map(p => p.x);
  const ys = data.map(p => p.y);
  const zs = data.map(p => p.z);

  // Deduce grid resolution
  const uniqueX = [...new Set(xs)].sort((a, b) => a - b);
  const uniqueY = [...new Set(ys)].sort((a, b) => a - b);
  const nx = uniqueX.length;
  const ny = uniqueY.length;

  // Sort and map Z values into grid layout
  const zGrid = Array.from({ length: nx }, () => Array(ny).fill(0));
  data.forEach(p => {
    const i = uniqueX.indexOf(p.x);
    const j = uniqueY.indexOf(p.y);
    if (i >= 0 && j >= 0) zGrid[i][j] = p.z;
  });

  // Compute width/height of the plane
  const width = uniqueX[uniqueX.length - 1] - uniqueX[0];
  const height = uniqueY[uniqueY.length - 1] - uniqueY[0];
  const widthSegments = nx - 1;
  const heightSegments = ny - 1;

  if (mesh) {
    scene.remove(mesh);
    mesh.geometry.dispose();
    mesh.material.dispose();
  }

  const geometry = new THREE.PlaneGeometry(width, height, widthSegments, heightSegments);
  const positions = geometry.attributes.position;
  const vertexCount = positions.count;

  // Compute min/max for coloring
  const minZ = Math.min(...zs);
  const maxZ = Math.max(...zs);
  const range = (maxZ - minZ) || 1;
  const zScale = Math.min(width, height) * 0.2;
  const colors = new Float32Array(vertexCount * 3);

  let v = 0;
  for (let j = 0; j <= heightSegments; j++) {
    for (let i = 0; i <= widthSegments; i++) {
      // Set Z (loss) position
      const lossVal = zGrid[i][j];
      positions.setZ(v, ((lossVal - minZ) / range) * zScale);
      // Set color based on Z value
      const norm = (lossVal - minZ) / range;
      const col = new THREE.Color();
      col.setHSL((1 - norm) * 0.7, 0.8, 0.5);
      // Set RGB values
      colors[v * 3] = col.r;
      colors[v * 3 + 1] = col.g;
      colors[v * 3 + 2] = col.b;
      v++;
    }
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    side: THREE.DoubleSide,
    flatShading: false,
  });

  // Create mesh
  mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;

  // Apply Z scale from input
  const zscale = parseFloat(document.getElementById('scale').value) || 1.0;
  mesh.scale.set(1, 1, zscale);
  scene.add(mesh);

  // Adjust camera position
  const diag = Math.sqrt(width * width + height * height);
  camera.position.set(0, diag * 0.8, diag * 1.1);
  controls.target.set(0, 0, 0);
  controls.update();
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

animate();

document.getElementById('fileSelect').addEventListener('change', (e) => {
  loadAndBuild(e.target.value);
});

document.getElementById('scale').addEventListener('input', (e) => {
  const s = parseFloat(e.target.value);
  if (mesh) mesh.scale.z = s;
});

loadAndBuild(document.getElementById('fileSelect').value);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
