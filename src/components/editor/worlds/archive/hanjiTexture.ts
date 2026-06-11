/** Procedural hanji (Korean paper) texture with fiber simulation */

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

/** Generate hanji paper texture with fiber direction */
export function generateHanjiTexture(width: number, height: number): {
  colorData: ImageData;
  fiberMap: Float32Array; // 0~1 fiber direction influence (for ink anisotropic spread)
} {
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d")!;
  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;
  const fiberMap = new Float32Array(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const fidx = y * width + x;

      // Base hanji color: #f4edbd ~ #e8dca5
      const n1 = smoothNoise(x * 0.02, y * 0.02, 137);
      const n2 = smoothNoise(x * 0.05, y * 0.05, 237);

      // Fiber pattern: horizontal/vertical crossing (choji-bup)
      const hFiber = Math.abs(Math.sin(y * 0.8 + n1 * 3)) * 0.3;
      const vFiber = Math.abs(Math.sin(x * 0.6 + n2 * 2.5)) * 0.2;
      const fiberStrength = hFiber + vFiber;

      fiberMap[fidx] = 0.5 + (hFiber - vFiber); // >0.5 = horizontal bias, <0.5 = vertical

      const base = n1 * 0.15 + 0.7;
      const fiber = fiberStrength * 0.08;

      // f4edbd base → slight variation
      const r = Math.floor(244 - (1 - base) * 12 + fiber * 30);
      const g = Math.floor(237 - (1 - base) * 17 + fiber * 20);
      const b = Math.floor(189 - (1 - base) * 20 + fiber * 15);

      data[idx] = Math.min(255, Math.max(0, r));
      data[idx + 1] = Math.min(255, Math.max(0, g));
      data[idx + 2] = Math.min(255, Math.max(0, b));
      data[idx + 3] = 255;
    }
  }

  return { colorData: imageData, fiberMap };
}
