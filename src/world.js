/**
 * 仙侠探索游戏 - 世界场景构建
 * 地形 / 悬空浮岛 / 远山 / 水面 / 竹林
 */
import * as THREE from 'three';
import { generateHeightMap, fbm, PRNG, XIANXIA_COLORS, hexColor } from './utils.js';

const TERRAIN_SIZE = 200;
const TERRAIN_SEGMENTS = 200;

// ---- Terrain ----
export function createTerrain(prng) {
  const geometry = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, TERRAIN_SEGMENTS - 1, TERRAIN_SEGMENTS - 1);
  geometry.rotateX(-Math.PI / 2);

  const heightData = generateHeightMap(TERRAIN_SEGMENTS, TERRAIN_SEGMENTS, 0.005, prng);
  const positions = geometry.attributes.position.array;

  for (let i = 0; i < positions.length; i += 3) {
    const xIdx = Math.floor((i / 3) % TERRAIN_SEGMENTS);
    const zIdx = Math.floor((i / 3) / TERRAIN_SEGMENTS);
    const h = heightData[zIdx * TERRAIN_SEGMENTS + xIdx];

    // Shape terrain: valley in center, mountains at edges
    const cx = xIdx / TERRAIN_SEGMENTS - 0.5;
    const cz = zIdx / TERRAIN_SEGMENTS - 0.5;
    const distFromCenter = Math.sqrt(cx * cx + cz * cz) * 2;

    // Valley floor with gentle hills, rising dramatically at edges
    let elevation;
    if (distFromCenter < 0.3) {
      // Central valley - flat with subtle waves
      elevation = h * 1.5;
    } else if (distFromCenter < 0.7) {
      // Rolling hills
      elevation = h * 8 + distFromCenter * 6;
    } else {
      // Mountain ring
      elevation = h * 15 + distFromCenter * 12;
    }

    // Add a flat lake bed in the center
    if (distFromCenter < 0.15 && elevation < 0.5) {
      elevation = -0.3;
    }

    positions[i + 1] = elevation;
  }

  geometry.computeVertexNormals();
  geometry.attributes.position.needsUpdate = true;

  // Vertex colors based on height for xianxia feel
  const colors = new Float32Array(positions.length);
  for (let i = 0; i < positions.length; i += 3) {
    const y = positions[i + 1];
    let r, g, b;
    if (y < 0) {
      // Water/lake bed - dark
      r = 0.08; g = 0.12; b = 0.18;
    } else if (y < 0.5) {
      // Low ground - deep green
      r = 0.05; g = 0.18; b = 0.08;
    } else if (y < 2) {
      // Grassland
      const t = (y - 0.5) / 1.5;
      r = 0.08 + t * 0.04;
      g = 0.22 + t * 0.1;
      b = 0.08;
    } else if (y < 6) {
      // Hills - transition to rock
      const t = (y - 2) / 4;
      r = 0.12 + t * 0.2;
      g = 0.28 + t * 0.05;
      b = 0.10 + t * 0.1;
    } else if (y < 15) {
      // Mountain slope
      const t = (y - 6) / 9;
      r = 0.25 + t * 0.15;
      g = 0.30 + t * 0.05;
      b = 0.18 + t * 0.08;
    } else {
      // Snow-capped peaks
      const t = Math.min(1, (y - 15) / 5);
      r = 0.4 + t * 0.5;
      g = 0.35 + t * 0.5;
      b = 0.25 + t * 0.55;
    }
    colors[i] = r;
    colors[i + 1] = g;
    colors[i + 2] = b;
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.MeshLambertMaterial({
    vertexColors: true,
    flatShading: false,
    side: THREE.DoubleSide,
  });

  const terrain = new THREE.Mesh(geometry, material);
  terrain.receiveShadow = true;
  terrain.castShadow = true;
  terrain.name = 'terrain';

  return { mesh: terrain, heightData, geometry };
}

// ---- Floating Island ----
export function createFloatingIsland(x, y, z, scale = 1) {
  const group = new THREE.Group();

  // Rock body - elongated with crystalline bottom
  const bodyGeo = new THREE.CylinderGeometry(1, 0.4, 3, 16, 8);
  const bodyMat = new THREE.MeshLambertMaterial({
    color: hexColor(XIANXIA_COLORS.mountain),
    flatShading: true,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = -2;
  body.scale.set(2 * scale, 1 * scale, 1.5 * scale);
  group.add(body);

  // Top surface - flat grassy platform
  const topGeo = new THREE.CylinderGeometry(2.2, 2.0, 0.3, 16);
  const topMat = new THREE.MeshLambertMaterial({
    color: hexColor(XIANXIA_COLORS.jadeDark),
  });
  const top = new THREE.Mesh(topGeo, topMat);
  top.position.y = -0.35;
  top.scale.set(scale, scale, scale);
  group.add(top);

  // Small tree or pagoda placeholder on top
  const treeTrunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.12, 1.0, 8),
    new THREE.MeshLambertMaterial({ color: 0x6b4423 })
  );
  treeTrunk.position.y = 0.3;
  treeTrunk.scale.set(scale, scale, scale);
  group.add(treeTrunk);

  const treeCrown = new THREE.Mesh(
    new THREE.ConeGeometry(0.4, 0.8, 8),
    new THREE.MeshLambertMaterial({ color: hexColor(XIANXIA_COLORS.cherryBlossom) })
  );
  treeCrown.position.y = 1.0;
  treeCrown.scale.set(scale, scale, scale);
  group.add(treeCrown);

  // Floating crystal shards below
  for (let i = 0; i < 5; i++) {
    const shard = new THREE.Mesh(
      new THREE.ConeGeometry(0.15, 0.8, 6),
      new THREE.MeshLambertMaterial({
        color: hexColor(XIANXIA_COLORS.spiritGlow),
        emissive: hexColor(XIANXIA_COLORS.spiritGlow),
        emissiveIntensity: 0.4,
        transparent: true,
        opacity: 0.7,
      })
    );
    shard.position.y = -3.2 - Math.random() * 1.5;
    shard.position.x = (Math.random() - 0.5) * 3 * scale;
    shard.position.z = (Math.random() - 0.5) * 2 * scale;
    shard.rotation.z = (Math.random() - 0.5) * 0.4;
    shard.scale.set(scale, scale, scale);
    group.add(shard);
  }

  group.position.set(x, y, z);
  group.name = 'floatingIsland';
  return group;
}

// ---- Distant Mountains (backdrop ring) ----
export function createDistantMountains() {
  const group = new THREE.Group();
  const count = 36;
  const radius = 90;

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const h = 10 + Math.random() * 30;
    const w = 4 + Math.random() * 8;
    const dist = radius + Math.random() * 15;

    const geo = new THREE.ConeGeometry(w, h, 8, 4);
    const mat = new THREE.MeshLambertMaterial({
      color: new THREE.Color().setHSL(0.58, 0.08, 0.35 + Math.random() * 0.2),
      flatShading: true,
    });
    const mountain = new THREE.Mesh(geo, mat);
    mountain.position.set(
      Math.cos(angle) * dist,
      -2 + h / 2 * 0.3,
      Math.sin(angle) * dist
    );
    mountain.rotation.z = (Math.random() - 0.5) * 0.2;
    mountain.castShadow = true;
    group.add(mountain);
  }
  group.name = 'distantMountains';
  return group;
}

// ---- Water Surface ----
export function createWater() {
  const geo = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE);
  const mat = new THREE.MeshPhongMaterial({
    color: hexColor(XIANXIA_COLORS.water),
    specular: hexColor(XIANXIA_COLORS.spiritGlow),
    shininess: 80,
    transparent: true,
    opacity: 0.75,
    side: THREE.DoubleSide,
  });
  const water = new THREE.Mesh(geo, mat);
  water.rotation.x = -Math.PI / 2;
  water.position.y = -0.25;
  water.name = 'water';
  water.receiveShadow = true;
  return water;
}

// ---- Bamboo Grove ----
export function createBambooGrove(count = 30, spread = 15, centerX = 0, centerZ = 0) {
  const group = new THREE.Group();

  for (let i = 0; i < count; i++) {
    const x = centerX + (Math.random() - 0.5) * spread * 2;
    const z = centerZ + (Math.random() - 0.5) * spread * 2;
    const h = 3 + Math.random() * 5;

    // Main stalk
    const stalkGeo = new THREE.CylinderGeometry(0.1, 0.15, h, 8);
    const stalkMat = new THREE.MeshLambertMaterial({
      color: new THREE.Color().setHSL(0.2, 0.6, 0.2 + Math.random() * 0.15),
    });
    const stalk = new THREE.Mesh(stalkGeo, stalkMat);
    stalk.position.set(x, h / 2, z);
    stalk.castShadow = true;
    group.add(stalk);

    // Leaf clusters
    const leafCount = Math.floor(3 + Math.random() * 4);
    for (let j = 0; j < leafCount; j++) {
      const leaf = new THREE.Mesh(
        new THREE.ConeGeometry(0.2, 0.6, 6),
        new THREE.MeshLambertMaterial({
          color: new THREE.Color().setHSL(0.22, 0.5, 0.25 + Math.random() * 0.2),
          side: THREE.DoubleSide,
        })
      );
      leaf.position.set(
        x + (Math.random() - 0.5) * 0.8,
        h * 0.6 + Math.random() * h * 0.4,
        z + (Math.random() - 0.5) * 0.8
      );
      leaf.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * 0.5);
      group.add(leaf);
    }
  }

  group.name = 'bambooGrove';
  return group;
}

// ---- Stone path / Bridge placeholder ----
export function createStonePath(waypoints, stoneCount = 20) {
  const group = new THREE.Group();
  for (let i = 0; i < waypoints.length - 1; i++) {
    const start = waypoints[i];
    const end = waypoints[i + 1];
    const steps = Math.floor(stoneCount / (waypoints.length - 1));
    for (let j = 0; j < steps; j++) {
      const t = j / steps;
      const x = start.x + (end.x - start.x) * t + (Math.random() - 0.5) * 0.6;
      const z = start.z + (end.z - start.z) * t + (Math.random() - 0.5) * 0.6;
      const stone = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.4, 0.15, 8),
        new THREE.MeshLambertMaterial({ color: 0x8a8a80 })
      );
      stone.position.set(x, 0.1, z);
      stone.castShadow = true;
      stone.receiveShadow = true;
      group.add(stone);
    }
  }
  group.name = 'stonePath';
  return group;
}

// ---- Spirit Lantern (particles placeholder) ----
export function createSpiritLantern(x, y, z) {
  const group = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 8, 8),
    new THREE.MeshBasicMaterial({
      color: hexColor(XIANXIA_COLORS.spiritGlow),
      transparent: true,
      opacity: 0.9,
    })
  );
  body.position.set(x, y, z);
  group.add(body);

  // Glow halo
  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(0.4, 8, 8),
    new THREE.MeshBasicMaterial({
      color: hexColor(XIANXIA_COLORS.spiritGlow),
      transparent: true,
      opacity: 0.25,
    })
  );
  halo.position.copy(body.position);
  group.add(halo);

  group.userData = { baseY: y };
  group.name = 'spiritLantern';
  return group;
}

// ---- Placeholder markers for AI-generated assets ----
// These mark where you'll place AI-generated 3D models later
export function createPlaceholderMarker(x, y, z, color = 0xff0000, label = '') {
  const group = new THREE.Group();
  group.name = `placeholder_${label}`;

  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.1, 3, 8),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5 })
  );
  pole.position.set(x, y + 1.5, z);
  group.add(pole);

  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 8, 8),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6 })
  );
  ball.position.set(x, y + 3.2, z);
  group.add(ball);

  return group;
}
