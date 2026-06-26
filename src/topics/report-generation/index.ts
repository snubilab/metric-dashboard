import type { Topic } from "../../types/topic";
import { reportGenerationLearn } from "./content";
import { reportGenerationLearnKo } from "./contentKo";
import ReportGenerationPlayground from "./Playground";
import { reportGenerationScenarios } from "./scenarios";
import { reportGenerationScenariosKo } from "./scenariosKo";

const reportGenerationTopic: Topic = {
  id: "report-generation",
  group: "language",
  title: "LLM - Report Generation",
  status: "available",
  learn: reportGenerationLearn,
  learnKo: reportGenerationLearnKo,
  Playground: ReportGenerationPlayground,
  scenarios: reportGenerationScenarios,
  scenariosKo: reportGenerationScenariosKo,
};

export default reportGenerationTopic;
