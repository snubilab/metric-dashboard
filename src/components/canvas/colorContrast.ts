/**
 * Tiny WCAG color helpers for the canvas tags.
 *
 * Canvas glyphs are painted onto translucent, overlapping data fills, so a tag's
 * legibility can't rely on the page background. We draw each tag as a solid chip
 * in the layer color and pick the glyph color (black or white) by maximizing
 * WCAG 2.x contrast against that chip — a decision worth isolating and testing.
 */

export type Rgb = [number, number, number];

/** Parse a hex (`#rgb`/`#rrggbb`) or `rgb()/rgba()` color to [r,g,b], or null. */
export function parseColor(input: string): Rgb | null {
  const s = input.trim();

  const hex = s.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  if (hex) {
    const h =
      hex[1].length === 3
        ? hex[1]
            .split("")
            .map((c) => c + c)
            .join("")
        : hex[1];
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  const rgb = s.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i);
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];

  return null;
}

/** sRGB → linear for one 0–255 channel (WCAG transfer function). */
function channelLuminance(c: number): number {
  const cs = c / 255;
  return cs <= 0.03928 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4);
}

/** WCAG relative luminance of an [r,g,b] color, 0 (black) … 1 (white). */
export function relativeLuminance([r, g, b]: Rgb): number {
  return (
    0.2126 * channelLuminance(r) +
    0.7152 * channelLuminance(g) +
    0.0722 * channelLuminance(b)
  );
}

/**
 * Black or white, whichever has the higher WCAG contrast ratio against `color`.
 * Unparseable colors fall back to black (the safer default on light surfaces).
 */
export function readableTextOn(color: string): "#000000" | "#ffffff" {
  const rgb = parseColor(color);
  if (!rgb) return "#000000";
  const l = relativeLuminance(rgb);
  const contrastWithWhite = 1.05 / (l + 0.05);
  const contrastWithBlack = (l + 0.05) / 0.05;
  return contrastWithWhite >= contrastWithBlack ? "#ffffff" : "#000000";
}
