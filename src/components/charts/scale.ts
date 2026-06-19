/**
 * Dependency-free scale helpers for the SVG charts.
 *
 * A "scale" is a pure function mapping a value in a data domain to a pixel
 * position in a screen range. Ranges may be inverted (range[0] > range[1]) to
 * match SVG's top-left origin, where larger data values sit higher (smaller y).
 */

/** An inclusive [min, max] pair. */
export type Domain = readonly [number, number];

/** An inclusive [start, end] pixel pair; end may be smaller than start. */
export type Range = readonly [number, number];

/**
 * Build a linear scale mapping `domain` onto `range`.
 *
 * @param domain Data-space [min, max].
 * @param range Pixel-space [start, end] (may be inverted).
 * @returns A function mapping a domain value to its pixel position.
 */
export function linearScale(domain: Domain, range: Range): (x: number) => number {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const span = d1 - d0;
  if (span === 0) {
    return () => r0;
  }
  const slope = (r1 - r0) / span;
  return (x: number) => r0 + (x - d0) * slope;
}

/**
 * Build a base-10 logarithmic scale mapping `domain` onto `range`.
 *
 * @param domain Data-space [min, max]; min MUST be strictly positive.
 * @param range Pixel-space [start, end] (may be inverted).
 * @returns A function mapping a domain value to its pixel position.
 * @throws If the domain minimum is not strictly greater than zero.
 */
export function logScale(domain: Domain, range: Range): (x: number) => number {
  const [d0, d1] = domain;
  if (d0 <= 0) {
    throw new Error("logScale requires a strictly positive domain minimum");
  }
  const linear = linearScale([Math.log10(d0), Math.log10(d1)], range);
  return (x: number) => linear(Math.log10(x));
}

/** Round a raw step up to the nearest "nice" 1 / 2 / 5 * 10^k value. */
function niceStep(rawStep: number): number {
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const normalized = rawStep / magnitude;
  let nice: number;
  if (normalized <= 1) {
    nice = 1;
  } else if (normalized <= 2) {
    nice = 2;
  } else if (normalized <= 5) {
    nice = 5;
  } else {
    nice = 10;
  }
  return nice * magnitude;
}

/**
 * Compute human-friendly, evenly spaced axis ticks covering [min, max].
 *
 * The step is rounded to a 1/2/5 * 10^k value so labels read cleanly; the
 * returned ticks are ascending and span at least the requested range.
 *
 * @param min Lower bound of the data range.
 * @param max Upper bound of the data range.
 * @param count Approximate desired number of intervals.
 * @returns Ascending tick values (rounded to avoid float dust).
 */
export function niceTicks(min: number, max: number, count: number): number[] {
  if (max === min) {
    return [min];
  }
  const step = niceStep((max - min) / count);
  const start = Math.floor(min / step) * step;
  const end = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  // Decimal places implied by the step, used to round away float noise.
  const decimals = Math.max(0, -Math.floor(Math.log10(step)));
  const factor = Math.pow(10, decimals);
  for (let v = start; v <= end + step / 2; v += step) {
    ticks.push(Math.round(v * factor) / factor);
  }
  return ticks;
}
