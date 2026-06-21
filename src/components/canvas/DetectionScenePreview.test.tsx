import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LanguageProvider } from "../../i18n/LanguageContext";
import { DetectionScenePreview } from "./DetectionScenePreview";
import { makeGrid } from "../../engine/raster/grid";
import type { DetBox } from "../../types/engine";

const grid = makeGrid(16, 16, [1, 1]);

const gt: DetBox[] = [{ x: 4, y: 4, w: 4, h: 4 }];
const preds: DetBox[] = [{ x: 4, y: 4, w: 4, h: 4, confidence: 0.9 }];

describe("DetectionScenePreview", () => {
  it("renders a canvas with the given ariaLabel", () => {
    render(
      <LanguageProvider initialLang="en">
        <DetectionScenePreview grid={grid} gt={gt} preds={preds} ariaLabel="Detection preview" />
      </LanguageProvider>,
    );
    expect(screen.getByRole("img", { name: "Detection preview" })).toBeInTheDocument();
    expect(document.querySelector("canvas")).toBeInTheDocument();
  });

  it("does not throw under jsdom (getContext null → null-bail holds)", () => {
    expect(() =>
      render(
        <LanguageProvider initialLang="ko">
          <DetectionScenePreview
            grid={grid}
            gt={gt}
            preds={preds}
            iouThreshold={0.5}
            threshold={0.3}
            ariaLabel="미리보기"
          />
        </LanguageProvider>,
      ),
    ).not.toThrow();
  });
});
