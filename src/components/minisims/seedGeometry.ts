/**
 * Seed geometry helpers for the segmentation mini-sims.
 *
 * Each widget seeds its internal geometry from `config.initialState` when that
 * state already carries the shapes the widget needs (a circle GT and a circle
 * prediction), and otherwise falls back to a sensible default circle. This keeps
 * the widgets driven by config while remaining robust to sparse configs.
 */

import type { EngineState, Shape } from "../../types/engine";

/** A circle described by center and radius, the lowest common denominator the widgets manipulate. */
export interface CircleSeed {
  cx: number;
  cy: number;
  r: number;
}

/** Find the first circle shape in a list, or undefined when none exists. */
export function firstCircle(shapes: Shape[]): CircleSeed | undefined {
  for (const s of shapes) {
    if (s.kind === "circle") {
      return { cx: s.cx, cy: s.cy, r: s.r };
    }
  }
  return undefined;
}

/** Seed a circle from the GT layer of a state, falling back to `fallback`. */
export function gtCircle(state: EngineState, fallback: CircleSeed): CircleSeed {
  return firstCircle(state.gt) ?? fallback;
}

/** Seed a circle from a prediction layer of a state, falling back to `fallback`. */
export function predCircle(
  state: EngineState,
  id: "A" | "B",
  fallback: CircleSeed,
): CircleSeed {
  const layer = state.predictions.find((p) => p.id === id);
  return (layer ? firstCircle(layer.shapes) : undefined) ?? fallback;
}

/** Build a circle Shape from a seed. */
export function circleShape({ cx, cy, r }: CircleSeed): Shape {
  return { kind: "circle", cx, cy, r };
}
