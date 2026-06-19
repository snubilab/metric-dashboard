import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { UnitsBanner } from "./UnitsBanner";
import { LanguageProvider } from "../i18n/LanguageContext";

describe("UnitsBanner", () => {
  it("renders as a note landmark", () => {
    render(<UnitsBanner />);

    expect(screen.getByRole("note")).toBeInTheDocument();
  });

  it("states that the canvas is a 2D slice in English", () => {
    render(
      <LanguageProvider initialLang="en">
        <UnitsBanner />
      </LanguageProvider>,
    );

    expect(screen.getByRole("note")).toHaveTextContent(/2D slice/i);
  });

  it("states that clinical surfaces are 3D and measured in millimeters in English", () => {
    render(
      <LanguageProvider initialLang="en">
        <UnitsBanner />
      </LanguageProvider>,
    );

    const note = screen.getByRole("note");
    expect(note).toHaveTextContent(/3D/);
    expect(note).toHaveTextContent(/millimeter|mm/i);
  });

  it("states the honesty note in Korean by default", () => {
    render(<UnitsBanner />);

    const note = screen.getByRole("note");
    expect(note).toHaveTextContent(/2D 슬라이스/);
    expect(note).toHaveTextContent(/3D 표면/);
    expect(note).toHaveTextContent(/mm/);
  });

  it("does not render spacing detail when no spacing is provided", () => {
    render(<UnitsBanner />);

    expect(screen.queryByText(/mm\/px/i)).not.toBeInTheDocument();
  });

  it("renders pixel spacing in mm/px when spacing is provided", () => {
    render(<UnitsBanner spacingMm={[1, 1]} />);

    expect(screen.getByText(/1\.0\s*×\s*1\.0\s*mm\/px/)).toBeInTheDocument();
  });

  it("formats anisotropic spacing with one decimal place", () => {
    render(<UnitsBanner spacingMm={[0.7, 1.3]} />);

    expect(screen.getByText(/0\.7\s*×\s*1\.3\s*mm\/px/)).toBeInTheDocument();
  });
});
