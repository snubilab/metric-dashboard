import { describe, it, expect } from "vitest";
import { splitMetricText } from "./metricTextLinks";

describe("splitMetricText", () => {
  it("links HD95/NSD/ASSD individually inside a slash list", () => {
    const segs = splitMetricText("경계 지표(HD95/NSD/ASSD)와 짝지으세요");
    const linked = segs.filter((s) => s.sectionId);
    expect(linked.map((s) => [s.text, s.sectionId])).toEqual([
      ["HD95", "hd95"],
      ["NSD", "nsd"],
      ["ASSD", "assd"],
    ]);
    // The plain text around/between tokens is preserved in order.
    expect(segs.map((s) => s.text).join("")).toBe("경계 지표(HD95/NSD/ASSD)와 짝지으세요");
  });

  it("maps Dice/IoU to their sections and keeps surrounding prose", () => {
    const segs = splitMetricText("Pair Dice with IoU.");
    expect(segs).toEqual([
      { text: "Pair " },
      { text: "Dice", sectionId: "dice" },
      { text: " with " },
      { text: "IoU", sectionId: "iou" },
      { text: "." },
    ]);
  });

  it("does not match HD inside HD95, nor Dice inside clDice/Surface Dice", () => {
    expect(splitMetricText("HD95").map((s) => s.sectionId)).toEqual(["hd95"]);
    expect(splitMetricText("clDice").map((s) => [s.text, s.sectionId])).toEqual([
      ["clDice", "cldice"],
    ]);
    expect(splitMetricText("Surface Dice").map((s) => [s.text, s.sectionId])).toEqual([
      ["Surface Dice", "nsd"],
    ]);
  });

  it("matches a token with a Korean particle attached (HD95를)", () => {
    expect(splitMetricText("HD95를 보라")).toEqual([
      { text: "HD95", sectionId: "hd95" },
      { text: "를 보라" },
    ]);
  });

  it("returns a single plain segment when there is no metric token", () => {
    expect(splitMetricText("no metric tokens here")).toEqual([
      { text: "no metric tokens here" },
    ]);
  });

  it("links report-generation metric names to their own sections", () => {
    const segs = splitMetricText("BLEU, ROUGE, METEOR, BERTScore, RaTEscore, GREEN, CRIMSON");
    const linked = segs.filter((s) => s.sectionId);
    expect(linked.map((s) => [s.text, s.sectionId])).toEqual([
      ["BLEU", "bleu"],
      ["ROUGE", "rouge-l"],
      ["METEOR", "meteor"],
      ["BERTScore", "bertscore"],
      ["RaTEscore", "ratescore"],
      ["GREEN", "green"],
      ["CRIMSON", "crimson"],
    ]);
  });
});
