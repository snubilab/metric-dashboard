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

/** Each SEG figure paired with the language it should be rendered in. */
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

describe("SEG figures", () => {
  for (const { name, Figure } of FIGURES) {
    for (const lang of LANGS) {
      it(`${name} renders an accessible <svg> in ${lang}`, () => {
        const { container } = render(
          <LanguageProvider initialLang={lang}>
            <Figure />
          </LanguageProvider>,
        );

        const svg = container.querySelector("svg");
        expect(svg).not.toBeNull();
        expect(svg).toHaveAttribute("role", "img");
        const label = svg?.getAttribute("aria-label") ?? "";
        expect(label.length).toBeGreaterThan(0);
      });
    }
  }
});
