import type { Grid, Mask } from "../../types/engine";

/**
 * 1D squared Euclidean distance transform (Felzenszwalb & Huttenlocher 2012).
 *
 * Computes, for each position q in [0, n), the lower envelope of the parabolas
 * `scale2 * (q - p)^2 + f[p]` seeded at every position p, where `f` holds the
 * cost at each seed (0 for foreground, +Infinity elsewhere).
 *
 * @param f      input cost array (squared distances so far) of length >= n
 * @param n      number of samples along this axis
 * @param scale2 squared physical spacing for this axis (sx^2 or sy^2)
 * @returns      new array of length n with the transformed squared distances
 */
function dt1d(f: Float64Array, n: number, scale2: number): Float64Array {
  const d = new Float64Array(n);
  const v = new Int32Array(n); // locations of parabola vertices
  const z = new Float64Array(n + 1); // boundaries between parabolas
  let k = -1; // index of rightmost parabola in the lower envelope

  // Seed the lower envelope only with finite-cost parabolas. Infinite-cost
  // seeds (non-foreground) never define the envelope, and including them would
  // produce NaN intersections (Inf - Inf) that corrupt the boundary array.
  for (let q = 0; q < n; q++) {
    if (f[q] === Infinity) {
      continue;
    }
    if (k < 0) {
      k = 0;
      v[0] = q;
      z[0] = -Infinity;
      z[1] = Infinity;
      continue;
    }
    let s = intersection(f, v[k], q, scale2);
    while (s <= z[k]) {
      k--;
      s = intersection(f, v[k], q, scale2);
    }
    k++;
    v[k] = q;
    z[k] = s;
    z[k + 1] = Infinity;
  }

  // No finite seed: every distance stays at +Infinity.
  if (k < 0) {
    d.fill(Infinity);
    return d;
  }

  k = 0;
  for (let q = 0; q < n; q++) {
    while (z[k + 1] < q) {
      k++;
    }
    const dist = q - v[k];
    d[q] = scale2 * dist * dist + f[v[k]];
  }

  return d;
}

/**
 * Horizontal coordinate where the parabolas seeded at p and q intersect.
 */
function intersection(f: Float64Array, p: number, q: number, scale2: number): number {
  return (f[q] - f[p] + scale2 * (q * q - p * p)) / (2 * scale2 * (q - p));
}

/**
 * Euclidean distance transform.
 *
 * Returns, for every pixel, the Euclidean distance in millimeters to the
 * nearest foreground pixel (foreground = mask value 1). Distance is 0 on
 * foreground pixels. Anisotropic `spacingMm` ([sx, sy]) is respected by
 * scaling each separable axis pass by its squared physical spacing.
 *
 * An all-background mask yields +Infinity for every pixel, which is acceptable.
 *
 * @param g    grid describing dimensions and pixel spacing
 * @param mask foreground mask (length width*height, values 0|1)
 * @returns    Float64Array of distances in millimeters (length width*height)
 */
export function edt(g: Grid, mask: Mask): Float64Array {
  const { width, height } = g;
  const [sx, sy] = g.spacingMm;
  const sx2 = sx * sx;
  const sy2 = sy * sy;

  // Squared-distance field: 0 on foreground, +Infinity elsewhere.
  const field = new Float64Array(width * height);
  for (let i = 0; i < field.length; i++) {
    field[i] = mask[i] === 1 ? 0 : Infinity;
  }

  // Pass along columns (x-axis): one 1D transform per row.
  const row = new Float64Array(width);
  for (let y = 0; y < height; y++) {
    const base = y * width;
    for (let x = 0; x < width; x++) {
      row[x] = field[base + x];
    }
    const transformed = dt1d(row, width, sx2);
    for (let x = 0; x < width; x++) {
      field[base + x] = transformed[x];
    }
  }

  // Pass along rows (y-axis): one 1D transform per column.
  const col = new Float64Array(height);
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      col[y] = field[y * width + x];
    }
    const transformed = dt1d(col, height, sy2);
    for (let y = 0; y < height; y++) {
      field[y * width + x] = transformed[y];
    }
  }

  // Final distances in millimeters.
  const out = new Float64Array(width * height);
  for (let i = 0; i < out.length; i++) {
    out[i] = Math.sqrt(field[i]);
  }
  return out;
}
