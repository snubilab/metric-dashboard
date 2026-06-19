import type { EngineState } from "./engine";
import type { FC } from "react";

export type TopicGroup = "discriminative" | "generative" | "language" | "clinical";
export type TopicStatus = "available" | "coming-soon";

export interface MiniSimConfig {
  kind: string;              // e.g. "dice-overlap", "hd95-stray-fp", "ap-reorder", "froc-add-fp"
  initialState: EngineState;
  spotlightMetric: string;   // which metric the widget emphasizes
}

export interface MetricSection {
  id: string;
  title: string;
  formula?: string;          // KaTeX source
  meaning: string;
  features: string[];
  caveats: string[];
  miniSim?: MiniSimConfig;
}

export interface LearnContent {
  intro: string;
  sections: MetricSection[];
}

export interface ClinicalContext {
  situation: string;
  modality: string;
  atStake: string;
  consequence: string;
}

export interface Scenario {
  id: string;
  title: string;
  clinical: ClinicalContext;
  state: EngineState;
  teachingPoint: string;
  reference?: string;
}

export interface Topic {
  id: string;
  group: TopicGroup;
  title: string;
  status: TopicStatus;
  learn?: LearnContent;
  /** Korean Learn content; selected when the UI language is Korean. */
  learnKo?: LearnContent;
  Playground?: FC;
  scenarios?: Scenario[];
  /** Korean scenarios; selected when the UI language is Korean. */
  scenariosKo?: Scenario[];
}
