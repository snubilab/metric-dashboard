/**
 * Learn content for the image-segmentation topic.
 *
 * Ported faithfully from the "Segmentation metrics" sections of the
 * SegAndDect reference deck (Metrics Reloaded; Medical Segmentation Decathlon,
 * KiTS23, MRBrainS, BraTS / BraTS-METS). Each metric is one `MetricSection`
 * carrying its meaning, features, and caveats, a KaTeX `formula` where one
 * applies, and — for the headline metrics — a `miniSim` config that drives the
 * matching interactive widget through the `MiniSim` dispatcher.
 *
 * The mini-sim `initialState` objects are deliberately small but valid engine
 * states (256x256 grid, 1mm isotropic spacing, a GT shape and one prediction
 * shape, default degenerate policy) so each widget has geometry to seed from.
 */

import type { EngineState } from "../../types/engine";
import type { LearnContent, MiniSimConfig } from "../../types/topic";

/** Default 256x256, 1mm isotropic grid shared by every mini-sim initial state. */
const GRID = { width: 256, height: 256, spacingMm: [1, 1] as [number, number] };

/** Reasonable default degenerate-case policy used across the learn mini-sims. */
const POLICY = { emptyDice: "one", emptyDistance: "undefined" } as const;

/**
 * Build a small valid engine state with a GT circle and a prediction circle.
 *
 * @param gtR - Ground-truth circle radius (pixels).
 * @param predOffset - Horizontal offset (pixels) applied to the prediction.
 * @param predR - Prediction circle radius (pixels); defaults to the GT radius.
 * @returns A 256x256 engine state suitable for seeding a mini-sim.
 */
function circleState(gtR: number, predOffset: number, predR = gtR): EngineState {
  const cx = 128;
  const cy = 128;
  return {
    grid: GRID,
    gt: [{ kind: "circle", cx, cy, r: gtR }],
    predictions: [
      { id: "A", shapes: [{ kind: "circle", cx: cx + predOffset, cy, r: predR }] },
    ],
    policy: POLICY,
    nsdToleranceMm: 2,
  };
}

/** Mini-sim config helper: kind + spotlight metric + a seeded initial state. */
function miniSim(kind: string, spotlightMetric: string, initialState: EngineState): MiniSimConfig {
  return { kind, spotlightMetric, initialState };
}

export const segmentationLearn: LearnContent = {
  intro:
    "Semantic segmentation asks which pixels or voxels belong to the target " +
    "class — liver, kidney, tumor, vessel, or brain tissue. Evaluation focuses " +
    "on how much the predicted mask overlaps the ground truth, how accurate the " +
    "boundary is, whether small structures are missed, and whether the model " +
    "over-segments into background. Following Metrics Reloaded, the metrics " +
    "below group into overlap-based, boundary- and surface-based, volume-based, " +
    "and lesion-wise families. No single number is enough: medical benchmarks " +
    "pair an overlap metric with a boundary, surface, volume, or lesion-wise " +
    "metric because each family is blind to a different failure mode.",
  sections: [
    {
      id: "dice",
      title: "Dice coefficient (DSC)",
      formula: "\\mathrm{Dice} = \\frac{2\\,TP}{2\\,TP + FP + FN}",
      meaning:
        "Dice measures how much the predicted mask overlaps with the " +
        "ground-truth mask. It is the most common overlap metric in medical " +
        "image segmentation.",
      features: [
        "Widely used in medical image segmentation.",
        "Easy to interpret.",
        "Applicable to binary and multi-class segmentation.",
        "Often reported as class-wise Dice or mean Dice.",
      ],
      caveats: [
        "Dice summarizes region overlap; it does not directly measure boundary error.",
        "Dice can be unstable for very small structures: a few voxel errors swing it sharply.",
        "A large structure can have high Dice even when part of the boundary is inaccurate.",
      ],
      figure: "dice",
      complements:
        "Report with HD95/NSD: Dice summarizes overlap but is blind to boundary error.",
      miniSim: miniSim("dice-overlap", "dice", circleState(30, 0)),
    },
    {
      id: "iou",
      title: "IoU / Jaccard index",
      formula: "\\mathrm{IoU} = \\frac{TP}{TP + FP + FN}",
      meaning:
        "IoU measures the intersection between prediction and ground truth " +
        "divided by their union. It is common in general computer vision and " +
        "in object detection, where it defines box overlap.",
      features: [
        "Common in general computer vision and detection to define box overlap.",
        "Similar to Dice, but numerically lower for the same prediction.",
        "Related to Dice by Dice = 2·IoU / (1 + IoU), so the two rank predictions identically.",
      ],
      caveats: [
        "Because IoU is always ≤ Dice for the same mask, never compare an IoU against a Dice directly.",
        "Like Dice, IoU is a region-overlap metric and ignores where on the boundary the error sits.",
      ],
      figure: "iou",
      complements:
        "Equivalent ranking to Dice for a single case; pair with a boundary metric (HD95/NSD/ASSD) to see boundary error.",
      miniSim: miniSim("dice-iou-relation", "iou", circleState(30, 0)),
    },
    {
      id: "sensitivity",
      title: "Sensitivity / Recall",
      formula: "\\mathrm{Sensitivity} = \\mathrm{Recall} = \\frac{TP}{TP + FN}",
      meaning:
        "Sensitivity measures how much of the actual target region was " +
        "detected. It focuses on false negatives — the voxels the model missed.",
      features: [
        "Useful when missing a structure is costly.",
        "Important for small lesions, vessels, and screening-related segmentation tasks.",
        "High sensitivity means fewer false negatives.",
      ],
      caveats: [
        "Sensitivity alone does not show the false-positive burden.",
        "A model can inflate sensitivity simply by over-segmenting, so read it with precision.",
      ],
      figure: "sensitivity",
      complements:
        "Report with Precision: high sensitivity can hide over-segmentation (many FPs).",
    },
    {
      id: "precision",
      title: "Precision / PPV",
      formula: "\\mathrm{Precision} = \\mathrm{PPV} = \\frac{TP}{TP + FP}",
      meaning:
        "Precision measures how much of the predicted positive region is " +
        "actually correct. It focuses on false positives — over-segmentation " +
        "into background.",
      features: [
        "Useful for checking over-segmentation.",
        "Low precision means many false-positive voxels or regions.",
        "High precision means fewer false positives.",
      ],
      caveats: [
        "A conservative model may have high precision but low sensitivity.",
        "Precision and sensitivity are interpreted together, not in isolation.",
      ],
      figure: "precision",
      complements:
        "Report with Sensitivity/Recall: high precision can hide a conservative model that misses much of the target.",
    },
    {
      id: "hd",
      title: "Hausdorff distance (HD)",
      formula:
        "HD(A,B) = \\max\\left\\{ \\sup_{a \\in A} d(a,B),\\; \\sup_{b \\in B} d(b,A) \\right\\}",
      meaning:
        "The Hausdorff distance is the largest distance from one boundary to " +
        "the other. It captures the worst-case boundary mismatch between the " +
        "prediction and ground-truth surfaces.",
      features: [
        "Captures worst-case boundary mismatch.",
        "Useful when a single large local boundary error matters clinically.",
      ],
      caveats: [
        "Very sensitive to outliers.",
        "A single isolated false-positive region can make HD enormous.",
      ],
      figure: "hd",
      complements:
        "Report with Dice: boundary distance ignores how much region overlaps.",
    },
    {
      id: "hd95",
      title: "HD95 (95th-percentile Hausdorff)",
      formula: "HD_{95} = P_{95}\\big(\\{d(a,B)\\} \\cup \\{d(b,A)\\}\\big)",
      meaning:
        "HD95 uses the 95th percentile of boundary distances instead of the " +
        "maximum, so a single stray point no longer dominates the score.",
      features: [
        "More robust than standard HD.",
        "Commonly reported together with Dice in medical segmentation papers.",
        "Reduces the effect of extreme outliers while still flagging boundary error.",
      ],
      caveats: [
        "For 3D CT or MRI, distances must be computed in physical units (mm), not voxel counts.",
        "Still rises sharply when a stray false-positive blob lands far from the true boundary.",
      ],
      figure: "hd",
      complements:
        "Report with Dice: boundary distance ignores how much region overlaps.",
      miniSim: miniSim("hd95-stray-fp", "hd95", circleState(30, 0)),
    },
    {
      id: "assd",
      title: "ASD / ASSD (average surface distance)",
      meaning:
        "Average Surface Distance is the mean distance from one surface to the " +
        "other. Average Symmetric Surface Distance averages both directions — " +
        "prediction-to-GT and GT-to-prediction — for a single bidirectional " +
        "boundary error.",
      features: [
        "Captures average boundary mismatch rather than the worst point.",
        "Less dominated by a single extreme point than HD.",
        "ASSD considers both prediction-to-GT and GT-to-prediction distances.",
      ],
      caveats: [
        "A local large error can be diluted by averaging.",
        "Useful when overall boundary agreement matters more than a single worst point.",
      ],
      figure: "assd",
      complements:
        "Pairs with HD95 (worst-case boundary error) and Dice (region overlap): averaging dilutes a single large local error.",
    },
    {
      id: "nsd",
      title: "Surface Dice / Normalized Surface Dice (NSD)",
      formula:
        "\\mathrm{NSD} = \\frac{\\lvert\\{a : d(a,B) \\le \\tau\\}\\rvert + \\lvert\\{b : d(b,A) \\le \\tau\\}\\rvert}{\\lvert A \\rvert + \\lvert B \\rvert}",
      meaning:
        "Surface Dice measures the proportion of surface points lying within a " +
        "predefined tolerance distance τ of the other surface. With a 2mm " +
        "tolerance, boundary points within 2mm of the reference are acceptable.",
      features: [
        "Allows a task-specific tolerance.",
        "Useful when small boundary deviations are clinically acceptable.",
        "Often easier to interpret than raw HD or ASSD.",
        "Used in several medical benchmarks (Medical Segmentation Decathlon, KiTS23).",
      ],
      caveats: [
        "The tolerance value must be chosen carefully.",
        "The tolerance may differ by organ, lesion type, imaging modality, or clinical use.",
      ],
      figure: "nsd",
      complements:
        "Report with Dice; the tolerance τ must be clinically chosen so acceptable boundary deviations are not penalized.",
      miniSim: miniSim("nsd-tolerance", "nsd", circleState(30, 0)),
    },
    {
      id: "volume",
      title: "Volume difference",
      formula: "\\mathrm{RVD} = \\frac{V_{pred} - V_{gt}}{V_{gt}}",
      meaning:
        "Volume difference compares the predicted target volume against the " +
        "ground-truth volume — reported as an absolute difference or as a " +
        "relative (signed) ratio. It is the agreement-in-volume metric used in " +
        "brain-tissue benchmarks such as MRBrainS.",
      features: [
        "Direct measure of whether the model under- or over-estimates volume.",
        "Signed relative volume difference shows the direction of the error.",
        "Reported alongside Dice and HD95 when tissue volume is clinically relevant.",
      ],
      caveats: [
        "Volume agreement does not imply spatial agreement: a shifted mask can match in volume yet miss spatially.",
        "Relative volume difference is undefined when the ground-truth volume is zero.",
      ],
      figure: "volume",
      complements:
        "Report with Dice/HD95: equal volume can still be badly localized — a shifted mask matches in volume yet misses spatially.",
    },
    {
      id: "lesionwise",
      title: "Lesion-wise Dice & HD95",
      meaning:
        "Voxel-wise Dice can be dominated by large lesions. Lesion-wise " +
        "metrics split GT and prediction into connected components, match them " +
        "one-to-one, and evaluate Dice and HD95 per lesion — surfacing missed " +
        "small lesions and false-positive lesions that voxel averages hide. " +
        "This is the BraTS / BraTS-METS evaluation perspective.",
      features: [
        "Evaluates segmentation at the individual-lesion level.",
        "Adds lesion-level sensitivity and precision plus TP/FP/FN lesion counts.",
        "BraTS-METS adds explicit FP/FN lesion penalties.",
      ],
      caveats: [
        "A high voxel Dice can hide a completely missed small lesion (low lesion sensitivity).",
        "Matching depends on the criterion (IoU vs centroid) and threshold chosen.",
      ],
      figure: "lesionwise",
      complements:
        "Report with voxel Dice: voxel averages let large structures hide missed small lesions.",
      miniSim: miniSim("lesionwise-missed", "lesionSensitivity", missedMetState()),
    },
  ],
  complementarity: {
    intro:
      "The Metrics Reloaded thesis is that no single metric suffices: every " +
      "metric is blind to some failure mode, so report pairs that cover each " +
      "other's blind spots — an overlap metric alongside a boundary, surface, " +
      "volume, or lesion-wise metric.",
    pairs: [
      {
        blindSpot: "Boundary error — high overlap can still hide an inaccurate boundary.",
        blindMetric: "Dice / IoU",
        caughtBy: "HD95 / NSD / ASSD",
      },
      {
        blindSpot: "Worst-case outlier — a single stray region is averaged away.",
        blindMetric: "ASSD / Dice",
        caughtBy: "HD / HD95",
      },
      {
        blindSpot: "Missed small lesion — voxel averages let large structures dominate.",
        blindMetric: "Voxel Dice",
        caughtBy: "Lesion-wise sensitivity",
      },
      {
        blindSpot: "Over-segmentation / false positives — recall ignores the FP burden.",
        blindMetric: "Sensitivity",
        caughtBy: "Precision",
      },
      {
        blindSpot: "Volume error — equal overlap need not mean equal volume when shapes differ.",
        blindMetric: "Dice (when shapes differ)",
        caughtBy: "Volume difference",
      },
      {
        blindSpot: "Topology break — a broken or disconnected structure can still overlap well.",
        blindMetric: "Dice",
        caughtBy: "clDice / centerline Dice",
      },
    ],
    benchmarks: [
      {
        name: "Medical Segmentation Decathlon",
        task: "Multi-organ, multi-task segmentation",
        combination: "Dice + NSD",
        perspective: "Region overlap + surface agreement",
      },
      {
        name: "KiTS23",
        task: "Kidney, tumor, and cyst segmentation",
        combination: "Dice + Surface Dice",
        perspective: "Region overlap + surface quality",
      },
      {
        name: "MRBrainS",
        task: "Brain tissue segmentation",
        combination: "Dice + HD95 + volume",
        perspective: "Overlap + boundary + volume agreement",
      },
      {
        name: "BraTS 2023",
        task: "Brain tumor segmentation",
        combination: "Lesion-wise Dice + lesion-wise HD95",
        perspective: "Lesion-level overlap + lesion-level boundary",
      },
      {
        name: "BraTS-METS",
        task: "Brain metastasis segmentation",
        combination: "Lesion-wise Dice + lesion-wise HD95 + FP/FN penalty",
        perspective: "Multiple-lesion evaluation with explicit FP/FN penalty",
      },
    ],
  },
};

/**
 * Seed state for the lesion-wise mini-sim: a large lesion both models capture
 * plus a small lesion the prediction misses, so voxel Dice stays high while
 * lesion sensitivity is low.
 */
function missedMetState(): EngineState {
  return {
    grid: GRID,
    gt: [
      { kind: "circle", cx: 90, cy: 128, r: 34 },
      { kind: "circle", cx: 200, cy: 60, r: 5 },
    ],
    predictions: [{ id: "A", shapes: [{ kind: "circle", cx: 90, cy: 128, r: 34 }] }],
    policy: POLICY,
    nsdToleranceMm: 2,
  };
}
