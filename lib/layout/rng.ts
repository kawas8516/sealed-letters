/** Small deterministic PRNG (mulberry32) so handwriting jitter is stable. */
export function createRng(seed: number) {
  let t = seed >>> 0;
  return function next() {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/** Stable pseudo-random value in [0, 1) for a (seed, key) pair. */
export function hash01(seed: number, key: number): number {
  return createRng(seed * 9973 + key * 7919 + 17)();
}

/** Stable pseudo-random value in [-1, 1). */
export function hashSigned(seed: number, key: number): number {
  return hash01(seed, key) * 2 - 1;
}
