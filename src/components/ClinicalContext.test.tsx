import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ClinicalContext as ClinicalContextData } from "../types/topic";
import { ClinicalContext } from "./ClinicalContext";
import { LanguageProvider } from "../i18n/LanguageContext";

const sampleContext: ClinicalContextData = {
  situation: "Pre-operative tumor delineation for resection planning",
  modality: "CT",
  atStake: "Surgical margin around eloquent cortex",
  consequence: "Over-resection risks permanent neurological deficit",
};

describe("ClinicalContext", () => {
  it("renders all four field values", () => {
    render(<ClinicalContext context={sampleContext} />);

    expect(screen.getByText(sampleContext.situation)).toBeInTheDocument();
    expect(screen.getByText(sampleContext.modality)).toBeInTheDocument();
    expect(screen.getByText(sampleContext.atStake)).toBeInTheDocument();
    expect(screen.getByText(sampleContext.consequence)).toBeInTheDocument();
  });

  it("renders the labeled rows in English", () => {
    render(
      <LanguageProvider initialLang="en">
        <ClinicalContext context={sampleContext} />
      </LanguageProvider>,
    );

    expect(screen.getByText("Situation")).toBeInTheDocument();
    expect(screen.getByText("Modality")).toBeInTheDocument();
    expect(screen.getByText("At stake")).toBeInTheDocument();
    expect(screen.getByText("Consequence")).toBeInTheDocument();
  });

  it("renders the labeled rows in Korean by default", () => {
    render(<ClinicalContext context={sampleContext} />);

    expect(screen.getByText("상황")).toBeInTheDocument();
    expect(screen.getByText("영상 방식")).toBeInTheDocument();
    expect(screen.getByText("관건")).toBeInTheDocument();
    expect(screen.getByText("임상적 영향")).toBeInTheDocument();
  });

  it("renders the modality as a distinct pill element", () => {
    render(<ClinicalContext context={sampleContext} />);

    const modality = screen.getByText(sampleContext.modality);
    expect(modality).toHaveStyle({ borderRadius: "var(--radius-sm)" });
    expect(modality).toHaveStyle({ background: "var(--c-surface-2)" });
  });
});
