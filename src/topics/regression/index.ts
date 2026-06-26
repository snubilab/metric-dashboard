import type { Topic } from "../../types/topic";
import { regressionLearn } from "./content";
import { regressionLearnKo } from "./contentKo";
import RegressionPlayground from "./Playground";
import { regressionScenarios } from "./scenarios";
import { regressionScenariosKo } from "./scenariosKo";

const regressionTopic: Topic = {
  id: "regression",
  group: "discriminative",
  title: "Image Regression",
  status: "available",
  learn: regressionLearn,
  learnKo: regressionLearnKo,
  Playground: RegressionPlayground,
  scenarios: regressionScenarios,
  scenariosKo: regressionScenariosKo,
};

export default regressionTopic;
