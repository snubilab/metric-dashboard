/**
 * Image Detection topic registration.
 *
 * Bundles the learn content, the seeded DetectionBoard playground, and the
 * clinically grounded scenarios into a single Topic for the dashboard registry.
 */

import type { Topic } from "../../types/topic";
import { detectionLearn } from "./content";
import { detectionLearnKo } from "./contentKo";
import DetectionPlayground from "./Playground";
import { detectionScenarios } from "./scenarios";
import { detectionScenariosKo } from "./scenariosKo";

export const detectionTopic: Topic = {
  id: "detection",
  group: "discriminative",
  title: "Image Detection",
  status: "available",
  learn: detectionLearn,
  learnKo: detectionLearnKo,
  Playground: DetectionPlayground,
  scenarios: detectionScenarios,
  scenariosKo: detectionScenariosKo,
};

export default detectionTopic;
