import type { DegeneratePolicy, Mask } from "../../types/engine";
import { resolveEmptyDice } from "../policy";
import { confusion } from "./confusion";

/**
 * Sørensen-Dice coefficient: 2TP / (2TP + FP + FN).
 *
 * @returns The Dice score, or the empty-case policy value when both masks are empty.
 */
export function dice(gt: Mask, pred: Mask, policy: DegeneratePolicy): number {
  const { tp, fp, fn } = confusion(gt, pred);
  const denominator = 2 * tp + fp + fn;
  if (denominator === 0) {
    return resolveEmptyDice(policy);
  }
  return (2 * tp) / denominator;
}

/**
 * Intersection over Union (Jaccard index): TP / (TP + FP + FN).
 *
 * @returns The IoU score, or the empty-case policy value when both masks are empty.
 */
export function iou(gt: Mask, pred: Mask, policy: DegeneratePolicy): number {
  const { tp, fp, fn } = confusion(gt, pred);
  const denominator = tp + fp + fn;
  if (denominator === 0) {
    return resolveEmptyDice(policy);
  }
  return tp / denominator;
}

/**
 * Sensitivity (recall, TPR): TP / (TP + FN).
 *
 * @returns The sensitivity, or the empty-case policy value when there are no positives in GT.
 */
export function sensitivity(gt: Mask, pred: Mask, policy: DegeneratePolicy): number {
  const { tp, fn } = confusion(gt, pred);
  const denominator = tp + fn;
  if (denominator === 0) {
    return resolveEmptyDice(policy);
  }
  return tp / denominator;
}

/**
 * Precision (PPV): TP / (TP + FP).
 *
 * @returns The precision, or the empty-case policy value when there are no positives in pred.
 */
export function precision(gt: Mask, pred: Mask, policy: DegeneratePolicy): number {
  const { tp, fp } = confusion(gt, pred);
  const denominator = tp + fp;
  if (denominator === 0) {
    return resolveEmptyDice(policy);
  }
  return tp / denominator;
}
