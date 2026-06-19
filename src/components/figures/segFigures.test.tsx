import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ComponentType } from "react";
import { LanguageProvider } from "../../i18n/LanguageContext";
import type { Lang } from "../../i18n/LanguageContext";
import DiceFigure from "./DiceFigure";
import IouFigure from "./IouFigure";
import SensitivityFigure from "./SensitivityFigure";
import PrecisionFigure from "./PrecisionFigure";
import HausdorffFigure from "./HausdorffFigure";
import SurfaceDistanceFigure from "./SurfaceDistanceFigure";
import NsdFigure from "./NsdFigure";
import VolumeFigure from "./VolumeFigure";
import LesionWiseFigure from "./LesionWiseFigure";

/** Each SEG figure paired with the name used in test descriptions. */
const FIGURES: { name: string; Figure: ComponentType }[] = [
  { name: "DiceFigure", Figure: DiceFigure },
  { name: "IouFigure", Figure: IouFigure },
  { name: "SensitivityFigure", Figure: SensitivityFigure },
  { name: "PrecisionFigure", Figure: PrecisionFigure },
  { name: "HausdorffFigure", Figure: HausdorffFigure },
  { name: "SurfaceDistanceFigure", Figure: SurfaceDistanceFigure },
  { name: "NsdFigure", Figure: NsdFigure },
  { name: "VolumeFigure", Figure: VolumeFigure },
  { name: "LesionWiseFigure", Figure: LesionWiseFigure },
];

const LANGS: Lang[] = ["ko", "en"];

/** Hangul syllables / jamo — used to detect Korean leaking into English mode. */
const HANGUL = /[ᄀ-ᇿ가-힣]/;

/** True when any element under `root` paints with the --c-warn token. */
function hasWarnElement(root: ParentNode): boolean {
  const all = root.querySelectorAll("*");
  for (const el of Array.from(all)) {
    const fill = el.getAttribute("fill") ?? "";
    const stroke = el.getAttribute("stroke") ?? "";
    if (fill.includes("var(--c-warn)") || stroke.includes("var(--c-warn)")) {
      return true;
    }
  }
  return false;
}

/** All text rendered inside the misleading panel (joined for content checks). */
function misleadingText(container: ParentNode): string {
  const panel = container.querySelector('[data-role="misleading"]');
  return panel?.textContent ?? "";
}

describe("SEG figures (two-panel)", () => {
  for (const { name, Figure } of FIGURES) {
    for (const lang of LANGS) {
      it(`${name} renders an accessible two-panel <svg> in ${lang}`, () => {
        const { container } = render(
          <LanguageProvider initialLang={lang}>
            <Figure />
          </LanguageProvider>,
        );

        // Root is an <svg> exposed as an image with a meaningful label.
        const svg = container.querySelector("svg");
        expect(svg).not.toBeNull();
        expect(svg).toHaveAttribute("role", "img");
        const label = svg?.getAttribute("aria-label") ?? "";
        expect(label.length).toBeGreaterThan(0);

        // The misleading panel is marked for callers / assistive tech.
        const misleading = container.querySelector('[data-role="misleading"]');
        expect(misleading).not.toBeNull();

        // The misleading panel is drawn with the warn token.
        expect(hasWarnElement(container)).toBe(true);
      });
    }
  }

  // The misleading "trap" captions used to be hardcoded Korean in both modes.
  // They must now follow the active language.
  for (const { name, Figure } of FIGURES) {
    it(`${name} localizes its misleading caption (no Korean leaks into en)`, () => {
      const ko = misleadingText(
        render(
          <LanguageProvider initialLang="ko">
            <Figure />
          </LanguageProvider>,
        ).container,
      );
      const en = misleadingText(
        render(
          <LanguageProvider initialLang="en">
            <Figure />
          </LanguageProvider>,
        ).container,
      );

      expect(ko.length).toBeGreaterThan(0);
      expect(en.length).toBeGreaterThan(0);
      // English mode must contain real English text, not the Korean trap string.
      expect(HANGUL.test(en)).toBe(false);
      // Korean mode still shows Korean; the two languages differ.
      expect(HANGUL.test(ko)).toBe(true);
      expect(ko).not.toBe(en);
    });
  }
});
