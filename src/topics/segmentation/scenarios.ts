/**
 * Clinically grounded segmentation scenarios.
 *
 * Each scenario pairs a real clinical situation with a hand-built engine state
 * whose geometry is constructed so the stated teaching point is literally true
 * when the engine metrics are computed. They are the worked examples behind the
 * learn content: the cases where "which metric you trust" changes the verdict.
 *
 * Conventions: 256x256 grid, 1mm isotropic spacing, default degenerate policy.
 * GT is the reference; Prediction A is the model under discussion, and where a
 * second model is illuminating, Prediction B contrasts it.
 */

import type { DegeneratePolicy, Vec2 } from "../../types/engine";
import type { Scenario } from "../../types/topic";

/** Shared 256x256, 1mm isotropic grid. */
const GRID = { width: 256, height: 256, spacingMm: [1, 1] as Vec2 };

/** Reasonable default degenerate-case policy. */
const POLICY: DegeneratePolicy = { emptyDice: "one", emptyDistance: "undefined" };

export const segmentationScenarios: Scenario[] = [
  {
    id: "missed-met",
    title: "Missed small brain metastasis on screening MRI",
    clinical: {
      situation:
        "A whole-brain screening MRI carries one dominant metastasis and a tiny " +
        "second lesion. The model segments the large lesion closely but " +
        "completely misses the small one.",
      modality: "Contrast-enhanced brain MRI",
      atStake:
        "An untreated metastasis can grow, bleed, or seed further disease before " +
        "the next scan.",
      consequence:
        "Voxel Dice stays high and the report passes review, yet a treatable " +
        "lesion was never flagged.",
    },
    state: {
      grid: GRID,
      gt: [
        { kind: "circle", cx: 90, cy: 128, r: 34 },
        { kind: "circle", cx: 200, cy: 60, r: 5 },
      ],
      predictions: [
        { id: "A", shapes: [{ kind: "circle", cx: 90, cy: 128, r: 34 }] },
        {
          id: "B",
          shapes: [
            { kind: "circle", cx: 90, cy: 128, r: 34 },
            { kind: "circle", cx: 200, cy: 60, r: 5 },
          ],
        },
      ],
      policy: POLICY,
      nsdToleranceMm: 2,
    },
    teachingPoint:
      "Voxel Dice stays above 0.85 because the big lesion dominates the voxel " +
      "count, yet lesion sensitivity is only 0.5 — one of two lesions found. " +
      "Lesion-wise metrics expose the missed metastasis that voxel Dice hides.",
    reference: "BraTS-METS 2023 (lesion-wise Dice + lesion-wise HD95 + FP/FN penalty).",
  },
  {
    id: "stray-fp",
    title: "Stray false-positive blob wrecks HD95",
    clinical: {
      situation:
        "The model segments a liver lesion almost perfectly but also fires a " +
        "small spurious blob far away in the field of view.",
      modality: "Contrast-enhanced abdominal CT",
      atStake:
        "A boundary metric is supposed to certify margin accuracy for the real " +
        "lesion.",
      consequence:
        "Dice barely moves, so an overlap-only report looks clean — but HD95 " +
        "jumps to the distance of the stray blob, signalling an untrustworthy mask.",
    },
    state: {
      grid: GRID,
      gt: [{ kind: "circle", cx: 100, cy: 128, r: 40 }],
      predictions: [
        {
          id: "A",
          shapes: [
            { kind: "circle", cx: 100, cy: 128, r: 40 },
            { kind: "circle", cx: 224, cy: 32, r: 10 },
          ],
        },
        { id: "B", shapes: [{ kind: "circle", cx: 100, cy: 128, r: 40 }] },
      ],
      policy: POLICY,
      nsdToleranceMm: 2,
    },
    teachingPoint:
      "The stray blob adds only a handful of voxels, so Dice stays above 0.8, " +
      "but HD95 explodes past 20mm because the worst-case boundary distance now " +
      "reaches the far-away blob. Always pair Dice with a boundary metric.",
    reference: "Taha & Hanbury 2015; HD is very sensitive to outliers.",
  },
  {
    id: "over-segmentation",
    title: "Over-segmentation: high sensitivity, low precision",
    clinical: {
      situation:
        "A tumor model is tuned to never miss disease, so it paints a much " +
        "larger region than the true tumor, swallowing healthy tissue.",
      modality: "Brain MRI (tumor segmentation)",
      atStake:
        "If this mask drives radiotherapy planning, healthy brain inside the " +
        "over-drawn margin would be irradiated.",
      consequence:
        "Sensitivity is near-perfect, but precision collapses — most predicted " +
        "voxels are false positives.",
    },
    state: {
      grid: GRID,
      gt: [{ kind: "circle", cx: 128, cy: 128, r: 20 }],
      predictions: [
        { id: "A", shapes: [{ kind: "circle", cx: 128, cy: 128, r: 44 }] },
        { id: "B", shapes: [{ kind: "circle", cx: 128, cy: 128, r: 22 }] },
      ],
      policy: POLICY,
      nsdToleranceMm: 2,
    },
    teachingPoint:
      "Prediction A covers the whole GT (sensitivity ≈ 1) but its area is far " +
      "larger, so precision is low. Sensitivity alone rewards over-segmentation; " +
      "it must be read together with precision.",
    reference: "Metrics Reloaded — sensitivity vs precision trade-off.",
  },
  {
    id: "small-lesion-instability",
    title: "Small-lesion Dice instability",
    clinical: {
      situation:
        "Two readers segment the same tiny lacunar infarct with a one-voxel " +
        "boundary disagreement. On a large organ this would be invisible.",
      modality: "Brain MRI (small ischemic lesion)",
      atStake:
        "Dice is being used as a pass/fail gate on segmentation quality.",
      consequence:
        "On the small lesion the identical small offset drops Dice dramatically, " +
        "while the same offset barely dents Dice on a large structure.",
    },
    state: {
      grid: GRID,
      gt: [{ kind: "circle", cx: 128, cy: 128, r: 5 }],
      predictions: [
        { id: "A", shapes: [{ kind: "circle", cx: 132, cy: 128, r: 5 }] },
        { id: "B", shapes: [{ kind: "circle", cx: 129, cy: 128, r: 5 }] },
      ],
      policy: POLICY,
      nsdToleranceMm: 2,
    },
    teachingPoint:
      "A 4-pixel shift on a 5-pixel-radius lesion already pushes Dice well below " +
      "1.0; the same absolute shift on a large organ would be negligible. Dice is " +
      "unstable for very small structures.",
    reference: "Metrics Reloaded — small-structure instability of Dice.",
  },
  {
    id: "liver-margin",
    title: "Liver tumor margin for surgical planning",
    clinical: {
      situation:
        "A liver-tumor mask overlaps the truth well overall, but one lobe of the " +
        "boundary bulges outward where the surgeon needs an accurate resection margin.",
      modality: "Contrast-enhanced abdominal CT (surgical planning)",
      atStake:
        "The resection margin is read directly off the boundary; a local bulge " +
        "means cutting too much or too little.",
      consequence:
        "Dice is high enough to look acceptable, yet HD95 reveals a clinically " +
        "meaningful local boundary error along the margin.",
    },
    state: {
      grid: GRID,
      gt: [{ kind: "circle", cx: 128, cy: 128, r: 45 }],
      predictions: [
        {
          id: "A",
          shapes: [
            { kind: "circle", cx: 128, cy: 128, r: 45 },
            { kind: "box", x: 168, y: 110, w: 40, h: 36 },
          ],
        },
        { id: "B", shapes: [{ kind: "circle", cx: 128, cy: 128, r: 45 }] },
      ],
      policy: POLICY,
      nsdToleranceMm: 2,
    },
    teachingPoint:
      "The bulging margin adds a contiguous slab of voxels, so Dice stays high, " +
      "but HD95 climbs to the depth of the bulge. For surgical margins, a boundary " +
      "metric is non-negotiable — Dice alone certifies the wrong thing.",
    reference: "Medical Segmentation Decathlon / KiTS23 — Dice + surface metric.",
  },
  {
    id: "rank-agree-magnitude-disagree",
    title: "Rank agrees, magnitude disagrees (Dice vs HD95)",
    clinical: {
      situation:
        "Two candidate models are compared. On Dice they are nearly tied, so a " +
        "Dice-only leaderboard would call it a coin flip.",
      modality: "Abdominal CT (organ segmentation)",
      atStake:
        "Model selection for deployment hinges on which summary metric the " +
        "committee trusts.",
      consequence:
        "Model A and B share almost identical Dice, but their HD95 differ by a " +
        "wide margin because B has a far-flung boundary spur.",
    },
    state: {
      grid: GRID,
      gt: [{ kind: "circle", cx: 128, cy: 128, r: 40 }],
      predictions: [
        {
          id: "A",
          shapes: [
            { kind: "circle", cx: 128, cy: 128, r: 40 },
            { kind: "box", x: 168, y: 122, w: 8, h: 12 },
          ],
        },
        {
          id: "B",
          shapes: [
            { kind: "circle", cx: 128, cy: 128, r: 40 },
            { kind: "box", x: 232, y: 122, w: 8, h: 12 },
          ],
        },
      ],
      policy: POLICY,
      nsdToleranceMm: 2,
    },
    teachingPoint:
      "Both predictions add a tiny equal-area spur, so their Dice gap is " +
      "negligible — yet B's spur sits much farther out, so its HD95 is far " +
      "larger. Identical overlap ranking can hide a large boundary-quality gap.",
    reference: "Metrics Reloaded — overlap and boundary metrics answer different questions.",
  },
  {
    id: "empty-negative-case",
    title: "Empty case: no lesion, but one false positive",
    clinical: {
      situation:
        "A genuinely normal scan has no target lesion at all, yet the model emits " +
        "a single spurious detection.",
      modality: "Brain MRI (screening, negative case)",
      atStake:
        "Empty ground-truth cases are where degenerate-metric policy decisions " +
        "bite: Dice, HD95, and NSD are all undefined in the usual formula.",
      consequence:
        "How the metric is scored (one / zero / NaN for Dice; undefined / diagonal " +
        "/ fixed for distances) is a policy choice, not a fact about the model.",
    },
    state: {
      grid: GRID,
      gt: [],
      predictions: [
        { id: "A", shapes: [{ kind: "circle", cx: 128, cy: 128, r: 6 }] },
        { id: "B", shapes: [] },
      ],
      policy: POLICY,
      nsdToleranceMm: 2,
    },
    teachingPoint:
      "With empty GT and a false-positive prediction, every overlap and distance " +
      "metric hits a degenerate branch. Toggle the empty-Dice and empty-distance " +
      "policies in the Playground to see the reported numbers change with no " +
      "change to the masks — the policy must be stated explicitly.",
    reference: "Metrics Reloaded — handling of empty / negative cases and degenerate metrics.",
  },
  {
    id: "broken-vessel-topology",
    title: "Broken vessel topology (clDice teaser)",
    clinical: {
      situation:
        "A vessel-segmentation model produces a mask with high voxel overlap, but " +
        "the centerline is broken — a branch is disconnected into two pieces.",
      modality: "CT angiography (tubular structure)",
      atStake:
        "For vessels and airways, connectivity matters: a broken centerline can " +
        "imply an occlusion that is not really there.",
      consequence:
        "Dice and IoU look fine because most voxels overlap, yet the topology is " +
        "wrong — exactly what overlap metrics cannot see.",
    },
    state: {
      grid: GRID,
      gt: [{ kind: "box", x: 60, y: 124, w: 136, h: 8 }],
      predictions: [
        {
          id: "A",
          shapes: [
            { kind: "box", x: 60, y: 124, w: 60, h: 8 },
            { kind: "box", x: 132, y: 124, w: 64, h: 8 },
          ],
        },
        { id: "B", shapes: [{ kind: "box", x: 60, y: 124, w: 136, h: 8 }] },
      ],
      policy: POLICY,
      nsdToleranceMm: 2,
    },
    teachingPoint:
      "Prediction A drops a small gap in the middle of the vessel. Voxel Dice is " +
      "barely affected, but the structure is now two disconnected pieces. Topology- " +
      "aware metrics such as clDice / centerline Dice are designed to catch exactly " +
      "this break that overlap metrics miss.",
    reference: "Shit et al., clDice (CVPR 2021) — topology-preserving tubular metric.",
  },
];
