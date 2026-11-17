import crypto from 'node:crypto';

/** Random helper. Pass a numeric seed for reproducible output (tests, seed data); omit for crypto randomness. */
export function makeRng(seed) {
  let f;
  if (seed == null) f = () => crypto.randomInt(0, 2 ** 31) / 2 ** 31;
  else {
    let a = seed >>> 0;
    f = () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const r = {
    f,
    int: (a, b) => a + Math.floor(f() * (b - a + 1)),
    pick: (arr) => arr[Math.floor(f() * arr.length)],
    chance: (p) => f() < p,
    shuffle: (arr) => {
      const x = [...arr];
      for (let i = x.length - 1; i > 0; i--) {
        const j = Math.floor(f() * (i + 1));
        [x[i], x[j]] = [x[j], x[i]];
      }
      return x;
    },
  };
  return r;
}
