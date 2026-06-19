import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PRCurve } from "./PRCurve";
import { FROCCurve } from "./FROCCurve";
import { RelationPlot } from "./RelationPlot";

describe("PRCurve", () => {
  const points = [
    { recall: 0, precision: 1 },
    { recall: 0.5, precision: 0.9 },
    { recall: 1, precision: 0.6 },
  ];

  it("renders an svg containing a polyline for the raw curve", () => {
    const { container } = render(<PRCurve points={points} />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(container.querySelector("polyline, path")).toBeInTheDocument();
  });

  it("labels both axes", () => {
    const { getByText } = render(<PRCurve points={points} />);
    expect(getByText("Recall")).toBeInTheDocument();
    expect(getByText("Precision")).toBeInTheDocument();
  });

  it("draws the raw curve in the Pred-A color token", () => {
    const { container } = render(<PRCurve points={points} />);
    const curve = container.querySelector('[data-series="raw"]');
    expect(curve).toBeInTheDocument();
    expect(curve?.getAttribute("stroke")).toContain("--c-pred-a");
  });

  it("overlays a dashed envelope when provided", () => {
    const envelope = [
      { recall: 0, precision: 1 },
      { recall: 1, precision: 0.7 },
    ];
    const { container } = render(<PRCurve points={points} envelope={envelope} />);
    const env = container.querySelector('[data-series="envelope"]');
    expect(env).toBeInTheDocument();
    expect(env?.getAttribute("stroke-dasharray")).toBeTruthy();
    expect(env?.getAttribute("stroke")).toContain("--c-text-dim");
  });

  it("renders an operating-point dot in the warn color when provided", () => {
    const { container } = render(
      <PRCurve points={points} operatingPoint={{ recall: 0.5, precision: 0.9 }} />,
    );
    const dot = container.querySelector('[data-role="operating-point"]');
    expect(dot).toBeInTheDocument();
    expect(dot?.getAttribute("fill")).toContain("--c-warn");
  });

  it("does not render an operating-point dot when omitted", () => {
    const { container } = render(<PRCurve points={points} />);
    expect(container.querySelector('[data-role="operating-point"]')).toBeNull();
  });
});

describe("FROCCurve", () => {
  const points = [
    { fpPerScan: 0.125, sensitivity: 0.4 },
    { fpPerScan: 1, sensitivity: 0.7 },
    { fpPerScan: 8, sensitivity: 0.95 },
  ];

  it("renders an svg containing a polyline for the curve", () => {
    const { container } = render(<FROCCurve points={points} />);
    expect(container.querySelector("svg")).toBeInTheDocument();
    expect(container.querySelector("polyline, path")).toBeInTheDocument();
  });

  it("labels both axes", () => {
    const { getByText } = render(<FROCCurve points={points} />);
    expect(getByText("False positives per scan")).toBeInTheDocument();
    expect(getByText("Sensitivity")).toBeInTheDocument();
  });

  it("draws the curve in the GT color token", () => {
    const { container } = render(<FROCCurve points={points} />);
    const curve = container.querySelector('[data-series="froc"]');
    expect(curve).toBeInTheDocument();
    expect(curve?.getAttribute("stroke")).toContain("--c-gt");
  });

  it("renders the default LUNA16 operating-point markers", () => {
    const { container } = render(<FROCCurve points={points} />);
    const markers = container.querySelectorAll('[data-role="operating-point-marker"]');
    expect(markers.length).toBe(7);
  });

  it("renders custom operating-point markers when provided", () => {
    const { container } = render(
      <FROCCurve points={points} operatingPoints={[0.5, 1, 2]} />,
    );
    const markers = container.querySelectorAll('[data-role="operating-point-marker"]');
    expect(markers.length).toBe(3);
  });
});

describe("RelationPlot", () => {
  it("renders an svg containing a path/polyline for the Dice-IoU curve", () => {
    const { container } = render(<RelationPlot />);
    expect(container.querySelector("svg")).toBeInTheDocument();
    expect(container.querySelector("polyline, path")).toBeInTheDocument();
  });

  it("labels both axes", () => {
    const { getByText } = render(<RelationPlot />);
    expect(getByText("IoU")).toBeInTheDocument();
    expect(getByText("Dice")).toBeInTheDocument();
  });

  it("draws the relation curve in the Pred-A color token", () => {
    const { container } = render(<RelationPlot />);
    const curve = container.querySelector('[data-series="relation"]');
    expect(curve).toBeInTheDocument();
    expect(curve?.getAttribute("stroke")).toContain("--c-pred-a");
  });

  it("renders a current-value dot in the warn color when provided", () => {
    const { container } = render(<RelationPlot current={0.6} />);
    const dot = container.querySelector('[data-role="current-point"]');
    expect(dot).toBeInTheDocument();
    expect(dot?.getAttribute("fill")).toContain("--c-warn");
  });

  it("does not render a current-value dot when omitted", () => {
    const { container } = render(<RelationPlot />);
    expect(container.querySelector('[data-role="current-point"]')).toBeNull();
  });
});
