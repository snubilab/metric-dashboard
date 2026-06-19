/**
 * Image-segmentation topic registration.
 *
 * Bundles the learn content, the interactive Playground, and the clinical
 * scenarios into a single `Topic` for the discriminative-metrics group.
 */

import type { Topic } from "../../types/topic";
import { segmentationLearn } from "./content";
import { segmentationLearnKo } from "./contentKo";
import { segmentationScenarios } from "./scenarios";
import { segmentationScenariosKo } from "./scenariosKo";
import Playground from "./Playground";

const segmentationTopic: Topic = {
  id: "segmentation",
  group: "discriminative",
  title: "Image Segmentation",
  status: "available",
  learn: segmentationLearn,
  learnKo: segmentationLearnKo,
  Playground,
  scenarios: segmentationScenarios,
  scenariosKo: segmentationScenariosKo,
};

export default segmentationTopic;
