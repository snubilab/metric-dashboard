/**
 * Image Detection topic registration.
 *
 * Bundles the learn content, the seeded DetectionBoard playground, and the
 * clinically grounded scenarios into a single Topic for the dashboard registry.
 */

import type { Topic } from "../../types/topic";
import { detectionLearn } from "./content";
import DetectionPlayground from "./Playground";
import { detectionScenarios } from "./scenarios";

export const detectionTopic: Topic = {
  id: "detection",
  group: "discriminative",
  title: "Image Detection",
  status: "available",
  learn: detectionLearn,
  Playground: DetectionPlayground,
  scenarios: detectionScenarios,
};

export default detectionTopic;
