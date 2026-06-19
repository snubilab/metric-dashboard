/**
 * Topic taxonomy for the dashboard shell.
 *
 * `GROUPS` is the ordered list of metric families shown as sidebar headers, and
 * `GROUP_TOPIC_ORDER` fixes the in-group ordering of topic ids. Together they
 * define the single source of truth for navigation order; the registry sorts
 * its topics against these so the sidebar reads in a deliberate teaching order.
 */

import type { TopicGroup } from "../types/topic";

/** One navigation group: its stable id and the header label shown in the UI. */
export interface Group {
  id: TopicGroup;
  label: string;
}

/** Ordered metric families, top to bottom, as rendered in the sidebar. */
export const GROUPS: readonly Group[] = [
  { id: "discriminative", label: "Discriminative (classical)" },
  { id: "generative", label: "Generative" },
  { id: "language", label: "Language & multimodal" },
  { id: "clinical", label: "Clinical evaluation" },
];

/** In-group topic-id ordering, keyed by group id. */
export const GROUP_TOPIC_ORDER: Record<TopicGroup, readonly string[]> = {
  discriminative: ["classification", "regression", "segmentation", "detection"],
  generative: ["synthesis"],
  language: ["report-generation", "vlm"],
  clinical: ["risk-prediction", "reader-study"],
};
