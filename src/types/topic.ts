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
  /** Figure key (e.g. "dice", "det-matching") dispatched by MetricFigure. */
  figure?: string;
  /** Short "pairs well with" note shown after this section's caveats. */
  complements?: string;
}

/** A blind spot one metric misses and the metric that catches it. */
export interface ComplementarityPair {
  blindSpot: string;
  blindMetric: string;
  caughtBy: string;
}

/** A benchmark and the metric combination it uses to cover a perspective. */
export interface ComplementarityBenchmark {
  name: string;
  task: string;
  combination: string;
  perspective: string;
}

/** How a topic's metrics complement one another, surfaced at the end of Learn. */
export interface Complementarity {
  intro: string;
  pairs: ComplementarityPair[];
  benchmarks: ComplementarityBenchmark[];
}

export interface LearnContent {
  intro: string;
  sections: MetricSection[];
  /** Closing "how these metrics complement each other" content. */
  complementarity?: Complementarity;
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
