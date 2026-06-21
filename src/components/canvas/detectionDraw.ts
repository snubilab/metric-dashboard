/**
 * Detection-specific pure scene painter.
 *
 * Maps the per-box roles produced by `classifyDetections` onto design tokens and
 * paints them, reusing the same primitives the segmentation canvas uses
 * (`paintShape`, `FILL_ALPHA`, `paintTagBadge`, `roundRectPath`, `readableTextOn`,
 * `placeTagBadges`, `resolveColor`). It does NOT call segmentation's `drawScene`:
 * detection has its own layer ontology (GT-matched / pred-TP / pred-FP / GT-FN /
 * pred-below) and its primitive is a `DetBox`, not a `Shape`.
 *
 * Role → token (spec.canvasPlan.matchColoring):
 *   - GT matched      -> --c-gt    solid stroke + translucent fill
 *   - GT FN           -> --c-text-dim DASHED stroke + translucent grey fill + 'FN' chip
 *   - pred TP         -> --c-gt    solid stroke + 'TP' chip
 *   - pred FP         -> --c-warn  solid stroke + translucent red fill + 'FP' chip
 *   - pred below      -> ghosted: low-alpha fill + thin dotted --c-text-dim stroke
 * Every ABOVE pred (TP/FP) also carries a 2dp confidence numeral chip.
 *
 * All drawing bails when `ctx` is null (jsdom returns null from getContext); the
 * role→token mapping (`roleColorVar`) stays pure for unit tests.
 *
 * @remarks Tokens only — never a hardcoded color/font.
 */

import type { DetBox, Grid } from "../../types/engine";
import type { Classification, GtRole, PredRole } from "../../engine/metrics/detClassify";
import {
  paintShape,
  paintTagBadge,
  placeTagBadges,
  resolveColor,
  TAG_CHIP_GAP,
  TAG_CHIP_H,
} from "./sceneDraw";

export interface DrawDetectionOptions {
  grid: Grid;
  gt: DetBox[];
  preds: DetBox[];
  /**
   * Per-box match roles at the live threshold, or `null` while still drawing
   * (either side empty). When null the painter shows plain layer identity —
   * GT in --c-gt, predictions in --c-pred-a — with no TP/FP/FN/ghost roles, so
   * a ground-truth box never reads as "FN" before any prediction exists.
   */
  classification: Classification | null;
}

/** Every role recognized by the painter. */
type Role = GtRole | PredRole;

/** Ghost fill alpha for below-threshold preds (kept very faint). */
const GHOST_FILL_ALPHA = 0.05;
/** Dash for a GT false negative (still-visible but un-claimed). */
const FN_DASH = [6, 4];
/** Dotted dash for a below-threshold ghost pred. */
const GHOST_DASH = [2, 4];

/**
 * The token custom-property name for a role's stroke/fill color. Pure: matched
 * and tp share --c-gt (the overlap reads as one matched blob), fp is --c-warn,
 * fn and below are the dim neutral.
 */
export function roleColorVar(role: Role): string {
  switch (role) {
    case "matched":
    case "tp":
      return "--c-gt";
    case "fp":
      return "--c-warn";
    case "fn":
    case "below":
      return "--c-text-dim";
  }
}

/** Wrap a `DetBox` as a box `Shape` so the Shape-typed `paintShape` accepts it. */
function asBoxShape(box: DetBox) {
  return { kind: "box", x: box.x, y: box.y, w: box.w, h: box.h } as const;
}

/**
 * Clear and paint the full detection scene at the live threshold: GT boxes
 * colored by their role, then predictions colored by their role, then the
 * de-collided role/confidence chips on top. Bails when `ctx` is null.
 */
export function drawDetectionScene(
  ctx: CanvasRenderingContext2D | null,
  canvas: HTMLElement,
  opts: DrawDetectionOptions,
): void {
  if (!ctx) return;

  const { grid, gt, preds, classification } = opts;
  const width = (canvas as HTMLCanvasElement).width;
  const height = (canvas as HTMLCanvasElement).height;
  const scaleX = width / grid.width;
  const scaleY = height / grid.height;

  ctx.clearRect(0, 0, width, height);

  // Identity mode (still drawing): GT in --c-gt, predictions in --c-pred-a, no
  // match roles — so a ground-truth box never reads as a false negative before
  // there is any prediction to miss it.
  if (!classification) {
    const gtColor = resolveColor(canvas, "--c-gt");
    const predColor = resolveColor(canvas, "--c-pred-a");
    gt.forEach((box) => paintShape(ctx, asBoxShape(box), gtColor, scaleX, scaleY, []));
    preds.forEach((box) => paintShape(ctx, asBoxShape(box), predColor, scaleX, scaleY, []));
    paintChips(ctx, canvas, opts, scaleX, scaleY);
    return;
  }

  // GT boxes: matched -> solid green; fn -> dashed dim grey.
  gt.forEach((box, i) => {
    const role = classification.gtRoles[i] ?? "fn";
    const color = resolveColor(canvas, roleColorVar(role));
    const dash = role === "fn" ? FN_DASH : [];
    paintShape(ctx, asBoxShape(box), color, scaleX, scaleY, dash);
  });

  // Prediction boxes: tp -> green; fp -> red; below -> ghosted dotted dim.
  preds.forEach((box, i) => {
    const role = classification.predRoles[i] ?? "below";
    const color = resolveColor(canvas, roleColorVar(role));
    if (role === "below") {
      // Ghost: very faint fill, but a FULL-opacity dotted dim outline so a
      // demoted prediction stays clearly visible (≈5.5:1) — the dotted pattern,
      // not faintness, signals "excluded by the threshold, not counted". A dim
      // confidence chip (added in paintChips) labels why it dropped out.
      ctx.beginPath();
      ctx.rect(box.x * scaleX, box.y * scaleY, box.w * scaleX, box.h * scaleY);
      ctx.globalAlpha = GHOST_FILL_ALPHA;
      ctx.fillStyle = color;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.75;
      ctx.setLineDash(GHOST_DASH);
      ctx.stroke();
      ctx.setLineDash([]);
      return;
    }
    paintShape(ctx, asBoxShape(box), color, scaleX, scaleY, []);
  });

  paintChips(ctx, canvas, opts, scaleX, scaleY);
}

/**
 * Lay out and paint the role chips (and confidence numeral chips on ABOVE preds)
 * with the shared de-collision pass so stacked chips never share a yBottom.
 */
function paintChips(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLElement,
  opts: DrawDetectionOptions,
  scaleX: number,
  scaleY: number,
): void {
  const { gt, preds, classification } = opts;
  const font = `700 13px ${resolveColor(canvas, "--font-ui") || "system-ui, sans-serif"}`;
  const ring = resolveColor(canvas, "--c-bg") || "#fff";
  ctx.font = font;

  interface ChipRequest {
    text: string;
    color: string;
    cx: number;
    yBottom: number;
    halfW: number;
  }
  const requests: ChipRequest[] = [];

  const pushChip = (text: string, colorVar: string, box: DetBox) => {
    const color = resolveColor(canvas, colorVar);
    const cx = (box.x + box.w / 2) * scaleX;
    const yBottom = box.y * scaleY - 2;
    const halfW = (Math.ceil(ctx.measureText(text).width) + 10) / 2;
    requests.push({ text, color, cx, yBottom, halfW });
  };

  if (!classification) {
    // Identity chips while drawing: label GT boxes, and any drawn predictions by
    // their confidence — never TP/FP/FN before there is something to compare.
    gt.forEach((box) => pushChip("GT", "--c-gt", box));
    preds.forEach((box) => pushChip((box.confidence ?? 0).toFixed(2), "--c-pred-a", box));
  } else {
    // FN chips on un-matched GT.
    gt.forEach((box, i) => {
      if ((classification.gtRoles[i] ?? "fn") === "fn") pushChip("FN", roleColorVar("fn"), box);
    });

    // Role + confidence chips on ABOVE preds (tp/fp). A ghost gets ONLY a dim
    // confidence chip (no TP/FP count chip) so the threshold demotion is legible:
    // the student reads its confidence and sees it fell below the slider.
    preds.forEach((box, i) => {
      const role = classification.predRoles[i] ?? "below";
      const conf = box.confidence ?? 0;
      if (role === "below") {
        pushChip(conf.toFixed(2), roleColorVar("below"), box);
        return;
      }
      pushChip(role === "tp" ? "TP" : "FP", roleColorVar(role), box);
      pushChip(conf.toFixed(2), roleColorVar(role), box);
    });
  }

  const positions = placeTagBadges(
    requests.map(({ cx, yBottom, halfW }) => ({ cx, yBottom, halfW })),
    TAG_CHIP_H,
    TAG_CHIP_GAP,
  );
  requests.forEach((req, i) => {
    const pos = positions[i];
    paintTagBadge(ctx, req.text, pos.cx, pos.yBottom, req.color, ring, font);
  });
}
