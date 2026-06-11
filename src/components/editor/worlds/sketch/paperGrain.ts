/** Procedural paper grain texture for sketch world */

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
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);

  const n00 = hash(ix, iy, seed);
  const n10 = hash(ix + 1, iy, seed);
  const n01 = hash(ix, iy + 1, seed);
  const n11 = hash(ix + 1, iy + 1, seed);

  return (n00 + sx * (n10 - n00)) + sy * ((n01 + sx * (n11 - n01)) - (n00 + sx * (n10 - n00)));
}

export interface PaperGrainData {
  colorData: ImageData;
  heightMap: Float32Array; // 0~1: high = bump, low = valley
  width: number;
  height: number;
}

/** Generate paper grain texture with height map */
export function generatePaperGrain(width: number, height: number): PaperGrainData {
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d")!;
  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;
  const heightMap = new Float32Array(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const hidx = y * width + x;

      // Multi-octave noise for paper grain
      const n1 = smoothNoise(x * 0.08, y * 0.08, 89);
      const n2 = smoothNoise(x * 0.2, y * 0.2, 189);
      const n3 = smoothNoise(x * 0.5, y * 0.5, 289);

      const grainHeight = n1 * 0.5 + n2 * 0.3 + n3 * 0.2;
      heightMap[hidx] = grainHeight;

      // Paper color: #f8f4ee with subtle grain variation
      const brightness = 0.95 + grainHeight * 0.05;
      const r = Math.floor(248 * brightness);
      const g = Math.floor(244 * brightness);
      const b = Math.floor(238 * brightness);

      data[idx] = Math.min(255, r);
      data[idx + 1] = Math.min(255, g);
      data[idx + 2] = Math.min(255, b);
      data[idx + 3] = 255;
    }
  }

  return { colorData: imageData, heightMap, width, height };
}

/** Check if a pencil particle should deposit at this position */
export function shouldDeposit(
  heightMap: Float32Array,
  mapWidth: number,
  mapHeight: number,
  x: number,
  y: number,
  pressure: number
): boolean {
  // Wrap coordinates for tiling
  const mx = ((Math.floor(x) % mapWidth) + mapWidth) % mapWidth;
  const my = ((Math.floor(y) % mapHeight) + mapHeight) % mapHeight;
  const h = heightMap[my * mapWidth + mx];

  // threshold = 1 - pressure: high pressure deposits everywhere
  const threshold = 1 - pressure;
  return h > threshold * 0.6; // Bumps are more likely to catch graphite
}
