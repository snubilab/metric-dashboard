import type { Topic } from "../../types/topic";
import { classificationLearn } from "./content";
import { classificationLearnKo } from "./contentKo";
import ClassificationPlayground from "./Playground";
import { classificationScenarios } from "./scenarios";
import { classificationScenariosKo } from "./scenariosKo";

const classificationTopic: Topic = {
  id: "classification",
  group: "discriminative",
  title: "Image Classification",
  status: "available",
  learn: classificationLearn,
  learnKo: classificationLearnKo,
  Playground: ClassificationPlayground,
  scenarios: classificationScenarios,
  scenariosKo: classificationScenariosKo,
};

export default classificationTopic;
