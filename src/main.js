/**
 * 仙侠探索游戏 - 主入口
 * 组装场景 / 启动游戏循环 / HUD
 */
import * as THREE from 'three';
import { PRNG } from './utils.js';
import {
  createTerrain,
  createFloatingIsland,
  createDistantMountains,
  createWater,
  createBambooGrove,
  createStonePath,
  createSpiritLantern,
  createPlaceholderMarker,
} from './world.js';
import {
  createSky,
  createFireflies,
  createFallingPetals,
  createCloudWisps,
  updateFireflies,
  updatePetals,
  updateCloudWisps,
} from './atmosphere.js';
import { FirstPersonController } from './controller.js';

// ============================================================
// INIT
// ============================================================
const container = document.getElementById('game-container');

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
// CRITICAL: shadows off on M1 GPU (known issue in some Three.js versions)
renderer.shadowMap.enabled = false;
// Use NoToneMapping — ACES darkens; we'll control brightness ourselves
renderer.toneMapping = THREE.NoToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;
container.appendChild(renderer.domElement);

console.log('🖥️ Renderer:', renderer.domElement.width, 'x', renderer.domElement.height);
console.log('🎨 WebGL:', renderer.getContext() ? '✓' : '✗ MISSING');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8899bb);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.5, 200);
camera.position.set(0, 8, 25);
camera.lookAt(0, 2, 0);

// ============================================================
// LIGHTING — very bright for visibility
// ============================================================
const sun = new THREE.DirectionalLight(0xffeedd, 3.5);
sun.position.set(50, 60, 20);
scene.add(sun);
console.log('☀️  Sun: intensity=3.5');

const ambient = new THREE.AmbientLight(0x7799bb, 2.5);
scene.add(ambient);
console.log('💡 Ambient: intensity=2.5');

const hemi = new THREE.HemisphereLight(0xaaccff, 0x446644, 1.0);
scene.add(hemi);
console.log('🌐 Hemisphere: intensity=1.0');

// Light fog for xianxia feel
scene.fog = new THREE.Fog(0x8899bb, 80, 160);

// ============================================================
// WORLD
// ============================================================
const prng = new PRNG(8888);

const { mesh: terrain, heightData } = createTerrain(prng);
scene.add(terrain);
console.log('🏔️  Terrain: ✓');

// Height query — must be at module scope because controller uses it
function getTerrainHeight(x, z) {
  const segs = 200;
  const size = 200;
  const ix = Math.floor((x / size + 0.5) * segs);
  const iz = Math.floor((z / size + 0.5) * segs);
  if (ix < 0 || ix >= segs || iz < 0 || iz >= segs) return 0;
  return heightData[iz * segs + ix];
}

scene.add(createDistantMountains());
console.log('🏔️  Mountains: ✓');

scene.add(createWater());
console.log('💧 Water: ✓');

scene.add(createFloatingIsland(8, 15, -10, 1.2));
scene.add(createFloatingIsland(-12, 20, 5, 0.8));
scene.add(createFloatingIsland(5, 25, 12, 0.7));
scene.add(createFloatingIsland(-8, 18, -15, 0.9));
console.log('🏝️  Floating islands: 4');

scene.add(createBambooGrove(20, 8, -10, -8));
scene.add(createBambooGrove(15, 6, 8, 10));
console.log('🎋 Bamboo: 2 groves');

const pathPoints = [
  { x: 0, z: 20 }, { x: -2, z: 10 }, { x: -4, z: 0 },
  { x: -2, z: -10 }, { x: -10, z: -8 },
];
scene.add(createStonePath(pathPoints, 30));
console.log('🪨 Stone path: ✓');

scene.add(createSpiritLantern(-10, 2.5, -8));
scene.add(createSpiritLantern(8, 3.0, 10));
scene.add(createSpiritLantern(-8, 3.5, 5));
scene.add(createSpiritLantern(3, 2.0, -5));
console.log('🏮 Lanterns: 4');

// ============================================================
// ATMOSPHERE
// ============================================================
scene.add(createSky());
console.log('🌌 Sky dome: ✓');

const fireflies = createFireflies(150, 50);
scene.add(fireflies);
const petals = createFallingPetals(80, 30);
scene.add(petals);
const cloudWisps = createCloudWisps(20, 60);
scene.add(cloudWisps);
console.log('✨ Particles: fireflies + petals + clouds');

// ============================================================
// AI PLACEHOLDER MARKERS
// ============================================================
scene.add(createPlaceholderMarker(5, getTerrainHeight(5, 5), 5, 0xff4444, 'pagoda'));
scene.add(createPlaceholderMarker(-15, getTerrainHeight(-15, -5), -5, 0x44ff44, 'spiritTree'));
scene.add(createPlaceholderMarker(0, getTerrainHeight(0, -15), -15, 0x4444ff, 'bridge'));
scene.add(createPlaceholderMarker(15, getTerrainHeight(15, 15), 15, 0xffaa00, 'gate'));
scene.add(createPlaceholderMarker(-5, getTerrainHeight(-5, 15), 15, 0xff44ff, 'temple'));
console.log('📍 Placeholder markers: 5');

// ============================================================
// PLAYER
// ============================================================
const controller = new FirstPersonController(camera, renderer.domElement);
console.log('🎮 Controls: WASD | Mouse | F=fly | Shift=boost | Space=up');

// ============================================================
// HUD UPDATE
// ============================================================
function updateHUD() {
  const state = controller.getState();
  const pos = state.position;
  const el = (id) => document.getElementById(id);
  const set = (id, val) => { const e = el(id); if (e) e.textContent = val; };
  set('coord-x', pos.x.toFixed(1));
  set('coord-y', pos.y.toFixed(1));
  set('coord-z', pos.z.toFixed(1));
  set('mode-display', state.isFlying ? '御风 · 飞行' : '步行');
  set('speed-display', state.isBoosting ? '⚡ 加速中' : (state.isMoving ? '🚶 移动中' : '🧘 静止'));
}

// ============================================================
// RESIZE
// ============================================================
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ============================================================
// GAME LOOP
// ============================================================
const clock = new THREE.Clock();
let frameCount = 0;

function animate() {
  requestAnimationFrame(animate);

  const deltaTime = Math.min(clock.getDelta(), 0.1);
  // Start at golden hour (300s into a 600s cycle = noon, brightest)
  const elapsed = performance.now() * 0.001 + 300;

  controller.update(deltaTime, getTerrainHeight);

  // Update particles
  updateFireflies(fireflies, elapsed);
  updatePetals(petals, elapsed);
  updateCloudWisps(cloudWisps, elapsed);

  // Floating islands bob
  const children = scene.children;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child.name === 'floatingIsland') {
      child.position.y += Math.sin(elapsed * 0.5 + child.position.x) * 0.003;
    }
  }

  // Spirit lantern pulse
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child.name === 'spiritLantern' && child.children.length >= 2) {
      child.children[1].scale.setScalar(1 + Math.sin(elapsed * 3 + child.position.x) * 0.15);
    }
  }

  renderer.render(scene, camera);
  frameCount++;

  if (frameCount === 1) {
    console.log('🎬 First frame rendered ✓');
    console.log('   Scene children:', scene.children.length);
    console.log('   Camera at:', camera.position.toArray().map(v => v.toFixed(1)));
    console.log('   Look for: green terrain, blue sky, orange-red markers');
  }

  if (frameCount % 15 === 0) updateHUD();
}

// ============================================================
// START
// ============================================================
console.log('🐉 仙侠探索世界启动');
animate();
