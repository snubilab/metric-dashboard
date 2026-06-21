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
 * GT and predictions are distinct by BOTH color and style, so a matched GT never
 * merges with its prediction into one same-colored blob (the old design did):
 *   - GT (matched OR FN) -> --c-gt     DASHED, hollow outline — the "truth template"
 *   - pred TP            -> --c-pred-a  solid stroke + translucent blue fill + 'TP' chip
 *   - pred FP            -> --c-warn   solid stroke + translucent red fill + 'FP' chip
 *   - GT FN              -> an 'FN' chip in --c-warn on the dashed GT outline
 *   - pred below         -> ghosted: faint fill + dotted --c-text-dim stroke
 * A correct hit reads as a FILLED BLUE prediction box sitting inside a GREEN DASHED
 * GT outline. Every ABOVE pred (TP/FP) also carries a 2dp confidence numeral chip.
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
  /**
   * Whether to paint the per-box role/confidence chips. Defaults to true (the
   * interactive Playground always labels boxes). A dense read-only preview sets
   * this false so chips don't pile up and clip at the canvas edge.
   */
  showChips?: boolean;
}

/** Every role recognized by the painter. */
type Role = GtRole | PredRole;

/** Ghost fill alpha for below-threshold preds (kept very faint). */
const GHOST_FILL_ALPHA = 0.05;
/** Dash for every GT box — the "truth template" is always a dashed outline. */
const GT_DASH = [6, 4];
/** Dotted dash for a below-threshold ghost pred. */
const GHOST_DASH = [2, 4];

/**
 * The token custom-property name for a role's chip/marker color. Pure. GT-matched
 * stays --c-gt; a correct prediction (tp) is --c-pred-a (blue, matching the PRED
 * layer); both error roles (fp = false alarm, fn = missed lesion) are --c-warn; a
 * threshold-demoted prediction (below) is the dim neutral.
 */
export function roleColorVar(role: Role): string {
  switch (role) {
    case "matched":
      return "--c-gt";
    case "tp":
      return "--c-pred-a";
    case "fp":
    case "fn":
      return "--c-warn";
    case "below":
      return "--c-text-dim";
  }
}

/** Wrap a `DetBox` as a box `Shape` so the Shape-typed `paintShape` accepts it. */
function asBoxShape(box: DetBox) {
  return { kind: "box", x: box.x, y: box.y, w: box.w, h: box.h } as const;
}

/** Stroke a hollow (no-fill) box outline in the given dash — used for every GT box. */
function strokeBox(
  ctx: CanvasRenderingContext2D,
  box: DetBox,
  color: string,
  dash: number[],
  scaleX: number,
  scaleY: number,
): void {
  ctx.beginPath();
  ctx.rect(box.x * scaleX, box.y * scaleY, box.w * scaleX, box.h * scaleY);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.setLineDash(dash);
  ctx.stroke();
  ctx.setLineDash([]);
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

  // GT is ALWAYS the dashed, hollow "truth template" — a green outline with no
  // fill — so it stays visually distinct from the filled prediction boxes and
  // never merges with a same-colored prediction. Matched and FN GT look the same;
  // the FN chip (added in paintChips) marks a miss.
  const gtColor = resolveColor(canvas, "--c-gt");
  gt.forEach((box) => strokeBox(ctx, box, gtColor, GT_DASH, scaleX, scaleY));

  // Identity mode (still drawing): predictions in --c-pred-a, no match roles — so
  // a ground-truth box never reads as a false negative before a prediction exists.
  if (!classification) {
    const predColor = resolveColor(canvas, "--c-pred-a");
    preds.forEach((box) => paintShape(ctx, asBoxShape(box), predColor, scaleX, scaleY, []));
    if (opts.showChips !== false) paintChips(ctx, canvas, opts, scaleX, scaleY);
    return;
  }

  // Compare mode: predictions are FILLED — blue when correct (TP, matching the PRED
  // layer color), red when a false positive (FP); a below-threshold pred ghosts.
  const tpColor = resolveColor(canvas, "--c-pred-a");
  const fpColor = resolveColor(canvas, "--c-warn");
  const ghostColor = resolveColor(canvas, "--c-text-dim");
  preds.forEach((box, i) => {
    const role = classification.predRoles[i] ?? "below";
    if (role === "below") {
      // Ghost: very faint fill, but a FULL-opacity dotted dim outline so a
      // demoted prediction stays clearly visible (≈5.5:1) — the dotted pattern,
      // not faintness, signals "excluded by the threshold, not counted". A dim
      // confidence chip (added in paintChips) labels why it dropped out.
      ctx.beginPath();
      ctx.rect(box.x * scaleX, box.y * scaleY, box.w * scaleX, box.h * scaleY);
      ctx.globalAlpha = GHOST_FILL_ALPHA;
      ctx.fillStyle = ghostColor;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = ghostColor;
      ctx.lineWidth = 1.75;
      ctx.setLineDash(GHOST_DASH);
      ctx.stroke();
      ctx.setLineDash([]);
      return;
    }
    paintShape(ctx, asBoxShape(box), role === "tp" ? tpColor : fpColor, scaleX, scaleY, []);
  });

  if (opts.showChips !== false) paintChips(ctx, canvas, opts, scaleX, scaleY);
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
