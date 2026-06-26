export type Finding =
  | "cardiomegaly"
  | "consolidation"
  | "pleural effusion"
  | "pneumothorax"
  | "opacity"
  | "edema";

export type Laterality = "right" | "left" | "bilateral";
export type TemporalCue = "improved" | "worsened" | "stable" | "new" | "resolved";
export type Assertion = "present" | "absent";

export interface ClinicalCues {
  readonly findings: readonly Finding[];
  readonly presentFindings: readonly Finding[];
  readonly absentFindings: readonly Finding[];
  readonly laterality: readonly Laterality[];
  readonly temporal: readonly TemporalCue[];
}

export interface ReportMetricValues {
  readonly lexicalOverlap: number;
  readonly findingF1: number;
  readonly assertionF1: number;
  readonly lateralityF1: number;
  readonly temporalF1: number;
  readonly safetyErrors: number;
}

export interface ReportComparison {
  readonly a: ReportMetricValues;
  readonly b: ReportMetricValues;
}

export interface SafetyIssue {
  readonly kind: "false-finding" | "omission" | "assertion-flip";
  readonly finding: Finding;
}

const FINDING_PATTERNS: readonly [Finding, RegExp][] = [
  ["cardiomegaly", /\b(cardiomegaly|cardiac silhouette is mildly enlarged|heart is mildly enlarged)\b/],
  ["consolidation", /\b(consolidation|airspace consolidation)\b/],
  ["pleural effusion", /\b(pleural effusion|pleural fluid|effusion)\b/],
  ["pneumothorax", /\bpneumothorax\b/],
  ["opacity", /\b(opacity|airspace opacity)\b/],
  ["edema", /\b(edema|pulmonary edema)\b/],
];

const NEGATION_RE = /\b(no|without|absent|absence of|clear of|clear)\b/;

const LATERALITY_PATTERNS: readonly [Laterality, RegExp][] = [
  ["right", /\bright\b/],
  ["left", /\bleft\b/],
  ["bilateral", /\b(bilateral|bilaterally)\b/],
];

const TEMPORAL_PATTERNS: readonly [TemporalCue, RegExp][] = [
  ["improved", /\b(improved|decreased|decrease|better)\b/],
  ["worsened", /\b(worsened|increased|increase|progressed|worse)\b/],
  ["stable", /\b(stable|unchanged)\b/],
  ["new", /\b(new|interval development)\b/],
  ["resolved", /\b(resolved|resolution)\b/],
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s.;]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(text: string): string[] {
  const stop = new Set(["the", "a", "an", "is", "are", "of", "or", "and", "with", "there"]);
  return normalize(text)
    .replace(/[.;]/g, " ")
    .split(" ")
    .filter((token) => token.length > 1 && !stop.has(token));
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

function f1(reference: readonly string[], candidate: readonly string[]): number {
  const ref = new Set(reference);
  const cand = new Set(candidate);
  if (ref.size === 0 && cand.size === 0) return 1;
  if (ref.size === 0 || cand.size === 0) return 0;
  let tp = 0;
  for (const item of cand) {
    if (ref.has(item)) tp += 1;
  }
  return (2 * tp) / (ref.size + cand.size);
}

function sentenceWindows(text: string): string[] {
  return normalize(text).split(/\s*[.;]\s*/).filter(Boolean);
}

export function lexicalOverlapF1(reference: string, candidate: string): number {
  return f1(tokens(reference), tokens(candidate));
}

export function extractClinicalCues(text: string): ClinicalCues {
  const windows = sentenceWindows(text);
  const findings: Finding[] = [];
  const presentFindings: Finding[] = [];
  const absentFindings: Finding[] = [];

  for (const [finding, pattern] of FINDING_PATTERNS) {
    for (const window of windows) {
      if (!pattern.test(window)) continue;
      findings.push(finding);
      if (NEGATION_RE.test(window)) {
        absentFindings.push(finding);
      } else {
        presentFindings.push(finding);
      }
    }
  }

  const normalized = normalize(text);
  return {
    findings: unique(findings),
    presentFindings: unique(presentFindings),
    absentFindings: unique(absentFindings),
    laterality: unique(
      LATERALITY_PATTERNS.filter(([, pattern]) => pattern.test(normalized)).map(([cue]) => cue),
    ),
    temporal: unique(
      TEMPORAL_PATTERNS.filter(([, pattern]) => pattern.test(normalized)).map(([cue]) => cue),
    ),
  };
}

function assertionKeys(cues: ClinicalCues): string[] {
  return [
    ...cues.presentFindings.map((finding) => `${finding}:present`),
    ...cues.absentFindings.map((finding) => `${finding}:absent`),
  ];
}

export function safetyIssues(reference: ClinicalCues, candidate: ClinicalCues): SafetyIssue[] {
  const issues = new Map<string, SafetyIssue>();
  const refPresent = new Set(reference.presentFindings);
  const refAbsent = new Set(reference.absentFindings);

  for (const finding of candidate.presentFindings) {
    if (refAbsent.has(finding)) {
      issues.set(`false-finding:${finding}`, { kind: "false-finding", finding });
    }
  }
  for (const finding of reference.presentFindings) {
    if (candidate.absentFindings.includes(finding)) {
      issues.set(`assertion-flip:${finding}`, { kind: "assertion-flip", finding });
    } else if (!candidate.presentFindings.includes(finding)) {
      issues.set(`omission:${finding}`, { kind: "omission", finding });
    }
  }
  for (const finding of refPresent) {
    if (candidate.absentFindings.includes(finding)) {
      issues.set(`assertion-flip:${finding}`, { kind: "assertion-flip", finding });
    }
  }
  return [...issues.values()];
}

function score(referenceText: string, candidateText: string): ReportMetricValues {
  const reference = extractClinicalCues(referenceText);
  const candidate = extractClinicalCues(candidateText);
  return {
    lexicalOverlap: lexicalOverlapF1(referenceText, candidateText),
    findingF1: f1(reference.findings, candidate.findings),
    assertionF1: f1(assertionKeys(reference), assertionKeys(candidate)),
    lateralityF1: f1(reference.laterality, candidate.laterality),
    temporalF1: f1(reference.temporal, candidate.temporal),
    safetyErrors: safetyIssues(reference, candidate).length,
  };
}

export function compareReports(
  reference: string,
  candidateA: string,
  candidateB: string,
): ReportComparison {
  return {
    a: score(reference, candidateA),
    b: score(reference, candidateB),
  };
}
