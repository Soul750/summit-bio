/**
 * Deterministic PRNG (Mulberry32) so procedural rocks, foliage, and particles
 * are reproducible and never trigger hydration mismatches.
 */
export function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Simple 2D value noise + FBM in JS for sculpting deterministic mountain meshes
 * and matching summit elevation for the weeping tree and foreground rocks.
 */
function hash2(x: number, y: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return n - Math.floor(n);
}

export function noise2D(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);

  const a = hash2(ix, iy);
  const b = hash2(ix + 1, iy);
  const c = hash2(ix, iy + 1);
  const d = hash2(ix + 1, iy + 1);

  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

export function fbm2D(x: number, y: number, octaves = 4): number {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;
  for (let i = 0; i < octaves; i++) {
    value += amplitude * noise2D(x * frequency, y * frequency);
    frequency *= 2.04;
    amplitude *= 0.5;
  }
  return value;
}

/**
 * Ridged multifractal noise for sharp alpine crests and rocky ridges.
 */
export function ridgedFbm2D(x: number, y: number, octaves = 4): number {
  let value = 0;
  let amplitude = 0.55;
  let frequency = 1;
  for (let i = 0; i < octaves; i++) {
    const n = 1 - Math.abs(noise2D(x * frequency, y * frequency) * 2 - 1);
    value += amplitude * n * n;
    frequency *= 2.1;
    amplitude *= 0.48;
  }
  return value;
}
