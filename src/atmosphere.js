/**
 * 仙侠探索游戏 - 氛围系统
 * 光照(昼夜循环) / 体积雾 / 天空 / 粒子(流萤/落花/灵气)
 */
import * as THREE from 'three';
import { XIANXIA_COLORS, hexColor, getTimeOfDay, lerp } from './utils.js';

// ---- Sky Sphere with gradient ----
export function createSky() {
  const geo = new THREE.SphereGeometry(95, 64, 32);

  // Gradient from horizon to zenith
  const positions = geo.attributes.position.array;
  const colors = new Float32Array(positions.length);

  for (let i = 0; i < positions.length; i += 3) {
    const y = positions[i + 1];
    const normalizedY = y / 95; // -1 to 1

    let r, g, b;
    if (normalizedY > 0.3) {
      // Upper sky - deep blue to purple
      const t = (normalizedY - 0.3) / 0.7;
      r = lerp(0.2, 0.08, t);
      g = lerp(0.35, 0.08, t);
      b = lerp(0.55, 0.18, t);
    } else if (normalizedY > 0) {
      // Lower sky - misty blue-white
      const t = normalizedY / 0.3;
      r = lerp(0.8, 0.2, t);
      g = lerp(0.75, 0.35, t);
      b = lerp(0.65, 0.55, t);
    } else {
      // Below horizon - dark
      r = 0.03; g = 0.04; b = 0.06;
    }

    colors[i] = r;
    colors[i + 1] = g;
    colors[i + 2] = b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.MeshBasicMaterial({
    vertexColors: true,
    side: THREE.BackSide,
  });
  return new THREE.Mesh(geo, mat);
}

// ---- Directional Sun Light ----
export function createSunLight() {
  const sun = new THREE.DirectionalLight(0xffeedd, 2.5);
  sun.position.set(50, 60, 20);
  sun.castShadow = true;
  sun.shadow.mapSize.width = 2048;
  sun.shadow.mapSize.height = 2048;
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 200;
  sun.shadow.camera.left = -60;
  sun.shadow.camera.right = 60;
  sun.shadow.camera.top = 60;
  sun.shadow.camera.bottom = -60;
  sun.shadow.bias = -0.0001;
  return sun;
}

// ---- Ambient Light ----
export function createAmbientLight() {
  return new THREE.AmbientLight(0x334466, 0.8);
}

// ---- Hemisphere Light (sky/ground) ----
export function createHemisphereLight() {
  return new THREE.HemisphereLight(
    0xaaccff, // sky
    0x223322, // ground
    0.6
  );
}

// ---- Volumetric Fog (scene.fog) ----
export function setupFog(scene) {
  // Light mist - density reduced to avoid darkening
  scene.fog = new THREE.FogExp2(0xc8d8e8, 0.00015);
}

// ---- Firefly / Spirit particle system ----
export function createFireflies(count = 200, spread = 50) {
  const positions = new Float32Array(count * 3);
  const velocities = [];

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * spread;
    positions[i * 3 + 1] = Math.random() * 8 + 0.5;
    positions[i * 3 + 2] = (Math.random() - 0.5) * spread;
    velocities.push({
      vx: (Math.random() - 0.5) * 0.02,
      vy: (Math.random() - 0.5) * 0.03,
      vz: (Math.random() - 0.5) * 0.02,
      phase: Math.random() * Math.PI * 2,
      baseY: positions[i * 3 + 1],
    });
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  // Circular sprite texture
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  gradient.addColorStop(0, 'rgba(180, 240, 255, 0.9)');
  gradient.addColorStop(0.3, 'rgba(140, 220, 255, 0.5)');
  gradient.addColorStop(0.7, 'rgba(100, 200, 240, 0.1)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 32, 32);
  const texture = new THREE.CanvasTexture(canvas);

  const mat = new THREE.PointsMaterial({
    map: texture,
    color: hexColor(XIANXIA_COLORS.spiritGlow),
    size: 0.6,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
    opacity: 0.8,
  });

  const points = new THREE.Points(geo, mat);
  points.name = 'fireflies';
  points.userData = { velocities, count, positions };
  return points;
}

// ---- Falling Cherry Blossom Petals ----
export function createFallingPetals(count = 150, spread = 30) {
  const positions = new Float32Array(count * 3);
  const petalData = [];

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * spread;
    positions[i * 3 + 1] = Math.random() * 20;
    positions[i * 3 + 2] = (Math.random() - 0.5) * spread;
    petalData.push({
      vy: -(Math.random() * 0.02 + 0.005),
      vx: (Math.random() - 0.5) * 0.015,
      vz: (Math.random() - 0.5) * 0.015,
      wobbleAmp: Math.random() * 0.03 + 0.01,
      wobbleSpeed: Math.random() * 2 + 1,
      maxY: 20,
      minY: 0,
      spread,
    });
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(250, 180, 190, 0.8)';
  ctx.beginPath();
  ctx.ellipse(8, 8, 6, 3, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 200, 210, 0.5)';
  ctx.beginPath();
  ctx.ellipse(9, 7, 4, 2, 0.3, 0, Math.PI * 2);
  ctx.fill();
  const texture = new THREE.CanvasTexture(canvas);

  const mat = new THREE.PointsMaterial({
    map: texture,
    color: hexColor(XIANXIA_COLORS.cherryBlossom),
    size: 0.5,
    blending: THREE.NormalBlending,
    depthWrite: false,
    transparent: true,
    opacity: 0.7,
  });

  const points = new THREE.Points(geo, mat);
  points.name = 'fallingPetals';
  points.userData = { petalData, count, positions };
  return points;
}

// ---- Cloud wisps (floating low fog patches) ----
export function createCloudWisps(count = 30, spread = 60) {
  const group = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const w = 3 + Math.random() * 12;
    const h = 0.4 + Math.random() * 1.2;
    const geo = new THREE.PlaneGeometry(w, h);
    const mat = new THREE.MeshBasicMaterial({
      color: hexColor(XIANXIA_COLORS.cloud),
      transparent: true,
      opacity: 0.15 + Math.random() * 0.2,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const wisp = new THREE.Mesh(geo, mat);
    wisp.position.set(
      (Math.random() - 0.5) * spread,
      3 + Math.random() * 12,
      (Math.random() - 0.5) * spread
    );
    wisp.rotation.set(Math.random() * Math.PI * 0.3, Math.random() * Math.PI * 2, 0);
    wisp.userData = {
      speed: 0.02 + Math.random() * 0.06,
      angle: Math.random() * Math.PI * 2,
      baseY: wisp.position.y,
      radius: Math.random() * spread * 0.5 + 5,
    };
    group.add(wisp);
  }
  group.name = 'cloudWisps';
  return group;
}

// ---- Update animations for particles ----
export function updateFireflies(points, time) {
  const positions = points.geometry.attributes.position.array;
  const vels = points.userData.velocities;

  for (let i = 0; i < points.userData.count; i++) {
    const v = vels[i];
    const idx = i * 3;

    positions[idx] += v.vx + Math.sin(time * 0.5 + v.phase) * 0.01;
    positions[idx + 1] = v.baseY + Math.sin(time * 1.3 + v.phase) * 1.5;
    positions[idx + 2] += v.vz + Math.cos(time * 0.7 + v.phase) * 0.01;

    // Wrap around if out of bounds
    if (Math.abs(positions[idx]) > 30) positions[idx] *= -0.9;
    if (Math.abs(positions[idx + 2]) > 30) positions[idx + 2] *= -0.9;
  }
  points.geometry.attributes.position.needsUpdate = true;
}

export function updatePetals(points, time) {
  const positions = points.geometry.attributes.position.array;
  const pdatas = points.userData.petalData;

  for (let i = 0; i < points.userData.count; i++) {
    const p = pdatas[i];
    const idx = i * 3;

    positions[idx + 1] += p.vy;
    positions[idx] += p.vx + Math.sin(time * p.wobbleSpeed + i) * p.wobbleAmp;
    positions[idx + 2] += p.vz + Math.cos(time * p.wobbleSpeed + i) * p.wobbleAmp;

    // Reset when petal falls below ground
    if (positions[idx + 1] < p.minY) {
      positions[idx + 1] = p.maxY;
      positions[idx] = (Math.random() - 0.5) * p.spread;
      positions[idx + 2] = (Math.random() - 0.5) * p.spread;
    }
  }
  points.geometry.attributes.position.needsUpdate = true;
}

export function updateCloudWisps(group, time) {
  for (const wisp of group.children) {
    const d = wisp.userData;
    wisp.position.x += Math.cos(d.angle) * d.speed;
    wisp.position.z += Math.sin(d.angle) * d.speed;
    wisp.position.y = d.baseY + Math.sin(time * 0.3 + d.angle) * 1.5;
  }
}

// ---- Update sun position for day/night cycle ----
export function updateDayNightCycle(sun, scene, time) {
  const tod = getTimeOfDay(time);
  const sunAngle = tod * Math.PI * 2;

  // Sun orbits around the scene
  const sunRadius = 80;
  const sunY = Math.sin(sunAngle - Math.PI * 0.15) * sunRadius;
  const sunX = Math.cos(sunAngle) * sunRadius;
  sun.position.set(sunX, Math.max(sunY, -30), Math.sin(sunAngle) * sunRadius * 0.5);

  // Sun intensity: bright at noon, dim at night
  const intensity = Math.max(0.05, Math.sin(sunAngle));
  sun.intensity = intensity * 2.5;

  // Color shift: gold at dawn/dusk, white at noon, dark at night
  const colorT = (Math.sin(sunAngle) + 1) / 2; // 0 at midnight, 1 at noon
  const r = lerp(0.2, 1.0, colorT);
  const g = lerp(0.15, 0.95, colorT);
  const b = lerp(0.2, 0.85, colorT);
  // Add warmth near horizon
  const warmth = 1 - Math.abs(Math.cos(sunAngle));
  sun.color.setRGB(
    lerp(r, 1.0, warmth * 0.5),
    lerp(g, 0.7, warmth * 0.5),
    lerp(b, 0.5, warmth * 0.6)
  );

  // Update fog color for time of day
  if (scene.fog) {
    const fogColor = new THREE.Color(
      lerp(0.06, 0.88, colorT),
      lerp(0.08, 0.8, colorT),
      lerp(0.12, 0.7, colorT)
    );
    scene.fog.color = fogColor;
    scene.background = fogColor;
  }
}
