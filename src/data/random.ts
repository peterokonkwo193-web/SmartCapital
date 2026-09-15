function hashSeed(seed: string): number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

export function mulberry32(seedStr: string): () => number {
  let a = hashSeed(seedStr);
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function walkSeries(seed: string, length: number, start: number, volatility: number): number[] {
  const rand = mulberry32(seed);
  const series: number[] = [start];
  for (let i = 1; i < length; i++) {
    const drift = (rand() - 0.485) * volatility;
    const next = Math.max(series[i - 1] * (1 + drift), start * 0.15);
    series.push(next);
  }
  return series;
}
