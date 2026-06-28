/**
 * 仙侠探索游戏 - 噪声与工具函数
 * 使用分形噪声生成地形、天空盒渐变等
 */

// Simple seeded pseudo-random (for reproducible terrain)
export class PRNG {
  constructor(seed = 42) {
    this.seed = seed;
  }
  next() {
    this.seed = (this.seed * 16807 + 0) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }
}

// Perlin-style value noise (simplified)
export function valueNoise(x, z, prng) {
  const xi = Math.floor(x);
  const zi = Math.floor(z);
  const fx = x - xi;
  const fz = z - zi;

  // Smoothstep
  const sx = fx * fx * (3.0 - 2.0 * fx);
  const sz = fz * fz * (3.0 - 2.0 * fz);

  const seed = xi * 374761393 + zi * 668265263;
  const rng = new PRNG(seed + (prng ? prng.seed : 42));

  const n00 = rng.next() * 2 - 1;
  const n10 = rng.next() * 2 - 1;
  const n01 = rng.next() * 2 - 1;
  const n11 = rng.next() * 2 - 1;

  const ix0 = n00 + sx * (n10 - n00);
  const ix1 = n01 + sx * (n11 - n01);

  return ix0 + sz * (ix1 - ix0);
}

// Fractal Brownian Motion for rich terrain
export function fbm(x, z, octaves = 6, lacunarity = 2.0, gain = 0.5, prng) {
  let value = 0;
  let amplitude = 1;
  let frequency = 1;
  let maxValue = 0;

  for (let i = 0; i < octaves; i++) {
    value += amplitude * valueNoise(x * frequency, z * frequency, prng);
    maxValue += amplitude;
    amplitude *= gain;
    frequency *= lacunarity;
  }

  return value / maxValue;
}

// Generate terrain height array
export function generateHeightMap(width, depth, scale = 0.01, prng) {
  const data = new Float32Array(width * depth);
  for (let z = 0; z < depth; z++) {
    for (let x = 0; x < width; x++) {
      data[z * width + x] = fbm(x * scale, z * scale, 5, 2.0, 0.5, prng);
    }
  }
  return data;
}

// Color palette for xianxia style
export const XIANXIA_COLORS = {
  jade:        0x4cc9b0,
  jadeDark:    0x2d8a72,
  jadeLight:   0x7ee8d4,
  mist:        0xd4e8f0,
  mistWarm:    0xe8dcc8,
  gold:        0xd4a843,
  goldLight:   0xf0d878,
  cloud:       0xf0ebe0,
  mountain:    0x3d5468,
  mountainFar: 0x5c7896,
  water:       0x2a6b7c,
  waterShallow:0x3a9688,
  sunRim:      0xffd700,
  cherryBlossom:0xf0a0b8,
  spiritGlow:  0x88ddff,
  lantern:     0xff6633,
  deepShadow:  0x1a2030,
};

// Helper to convert hex to THREE.Color
export function hexColor(hex) {
  return new THREE.Color(hex);
}

// Easing functions for smooth transitions
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

// Random range
export function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

// Get time of day cycle (returns 0-1, 0=midnight, 0.25=dawn, 0.5=noon, 0.75=dusk)
export function getTimeOfDay(elapsed) {
  const dayLength = 600; // 10 minutes per full cycle
  return (elapsed % dayLength) / dayLength;
}
