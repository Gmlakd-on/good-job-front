/** Procedural stone texture — Perlin-like noise tiling 512x512 */

// Simple 2D noise (hash-based, not true Perlin but visually close and fast)
function hash(x: number, y: number, seed: number): number {
  let h = seed + x * 374761393 + y * 668265263;
  h = (h ^ (h >> 13)) * 1274126177;
  h = h ^ (h >> 16);
  return (h & 0x7fffffff) / 0x7fffffff;
}

function smoothNoise(x: number, y: number, seed: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;

  // Smoothstep
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);

  const n00 = hash(ix, iy, seed);
  const n10 = hash(ix + 1, iy, seed);
  const n01 = hash(ix, iy + 1, seed);
  const n11 = hash(ix + 1, iy + 1, seed);

  const nx0 = n00 + sx * (n10 - n00);
  const nx1 = n01 + sx * (n11 - n01);

  return nx0 + sy * (nx1 - nx0);
}

function fbm(x: number, y: number, seed: number, octaves: number = 5): number {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;
  let maxValue = 0;

  for (let i = 0; i < octaves; i++) {
    value += amplitude * smoothNoise(x * frequency, y * frequency, seed + i * 1000);
    maxValue += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }

  return value / maxValue;
}

/** Generate a stone surface texture into an offscreen canvas */
export function generateStoneTexture(width: number, height: number): ImageData {
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d")!;
  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;

  const scale = 0.015; // Noise scale

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const nx = x * scale;
      const ny = y * scale;

      // Base stone color noise
      const n = fbm(nx, ny, 42, 6);

      // Add some veins/cracks
      const vein = Math.abs(Math.sin(nx * 3 + n * 8)) * 0.15;

      // Map to stone colors: #7d7568 → #9e9486
      const base = n * 0.3 + 0.45 + vein;
      const r = Math.floor(125 + base * 33);
      const g = Math.floor(117 + base * 31);
      const b = Math.floor(104 + base * 30);

      const idx = (y * width + x) * 4;
      data[idx] = Math.min(255, r);
      data[idx + 1] = Math.min(255, g);
      data[idx + 2] = Math.min(255, b);
      data[idx + 3] = 255;
    }
  }

  return imageData;
}

/** Generate a simple normal map from the stone texture for lighting */
export function generateNormalMap(texture: ImageData): ImageData {
  const { width, height, data: src } = texture;
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d")!;
  const normals = ctx.createImageData(width, height);
  const dst = normals.data;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const l = src[((y * width + Math.max(0, x - 1)) * 4)]; // left
      const r2 = src[((y * width + Math.min(width - 1, x + 1)) * 4)]; // right
      const u = src[(Math.max(0, y - 1) * width + x) * 4]; // up
      const d = src[(Math.min(height - 1, y + 1) * width + x) * 4]; // down

      const dx = (r2 - l) / 255;
      const dy = (d - u) / 255;

      dst[idx] = Math.floor((dx * 0.5 + 0.5) * 255);
      dst[idx + 1] = Math.floor((dy * 0.5 + 0.5) * 255);
      dst[idx + 2] = 200; // Z component
      dst[idx + 3] = 255;
    }
  }

  return normals;
}
