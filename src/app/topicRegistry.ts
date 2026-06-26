/**
 * The dashboard's topic registry.
 *
 * Pairs the fully implemented topics (Segmentation, Detection) with the
 * coming-soon stubs for the families not yet built, then exposes `orderedTopics`
 * which sorts every topic into the deliberate teaching order defined by
 * `GROUPS` (family order) and `GROUP_TOPIC_ORDER` (within-family order).
 */

import type { Topic, TopicGroup } from "../types/topic";
import classificationTopic from "../topics/classification";
import regressionTopic from "../topics/regression";
import segmentationTopic from "../topics/segmentation";
import detectionTopic from "../topics/detection";
import { GROUPS, GROUP_TOPIC_ORDER } from "./groups";

/** Builds a coming-soon stub topic: id, group, and title only. */
function stub(id: string, group: TopicGroup, title: string): Topic {
  return { id, group, title, status: "coming-soon" };
}

/** The coming-soon families not yet implemented, in no particular order. */
const STUB_TOPICS: readonly Topic[] = [
  stub("synthesis", "generative", "Image Synthesis"),
  stub("report-generation", "language", "LLM — Report Generation"),
  stub("vlm", "language", "VLM"),
  stub("risk-prediction", "clinical", "Risk Prediction"),
  stub("reader-study", "clinical", "Reader Study"),
];

/** Every topic the dashboard knows about (unordered). */
export const TOPICS: readonly Topic[] = [
  classificationTopic,
  regressionTopic,
  segmentationTopic,
  detectionTopic,
  ...STUB_TOPICS,
];

/** Group-order rank for a topic's group; lower sorts first. */
function groupRank(group: TopicGroup): number {
  return GROUPS.findIndex((g) => g.id === group);
}

/** In-group rank for a topic id; unknown ids sort to the end. */
function topicRank(group: TopicGroup, id: string): number {
  const order = GROUP_TOPIC_ORDER[group];
  const index = order.indexOf(id);
  return index === -1 ? order.length : index;
}

/**
 * Return every topic sorted by group order, then by in-group topic order.
 *
 * @returns A new array of topics in deliberate teaching order.
 */
export function orderedTopics(): Topic[] {
  return [...TOPICS].sort((a, b) => {
    const byGroup = groupRank(a.group) - groupRank(b.group);
    if (byGroup !== 0) {
      return byGroup;
    }
    return topicRank(a.group, a.id) - topicRank(b.group, b.id);
  });
}
