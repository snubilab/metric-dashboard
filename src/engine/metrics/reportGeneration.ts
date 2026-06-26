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
  readonly bleu1: number;
  readonly rougeL: number;
  readonly meteor: number;
  readonly bertScore: number;
  readonly rateScore: number;
  readonly chexbertF1: number;
  readonly srrBertF1: number;
  readonly radGraphF1: number;
  readonly greenErrors: number;
  readonly crimsonWeightedErrors: number;
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

const SYNONYMS: Readonly<Record<string, string>> = {
  cardiac: "heart",
  silhouette: "heart",
  enlarged: "cardiomegaly",
  fluid: "effusion",
  decreased: "improved",
  decrease: "improved",
  unchanged: "stable",
};

function canonicalTokens(text: string): string[] {
  return tokens(text).map((token) => SYNONYMS[token] ?? token);
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

function multisetOverlapCount(reference: readonly string[], candidate: readonly string[]): number {
  const remaining = new Map<string, number>();
  for (const token of reference) {
    remaining.set(token, (remaining.get(token) ?? 0) + 1);
  }
  let count = 0;
  for (const token of candidate) {
    const available = remaining.get(token) ?? 0;
    if (available <= 0) continue;
    remaining.set(token, available - 1);
    count += 1;
  }
  return count;
}

export function bleu1Score(reference: string, candidate: string): number {
  const candidateTokens = tokens(candidate);
  if (candidateTokens.length === 0) return tokens(reference).length === 0 ? 1 : 0;
  return multisetOverlapCount(tokens(reference), candidateTokens) / candidateTokens.length;
}

function lcsLength(a: readonly string[], b: readonly string[]): number {
  const prev = new Array(b.length + 1).fill(0);
  const curr = new Array(b.length + 1).fill(0);
  for (const left of a) {
    for (let j = 0; j < b.length; j += 1) {
      curr[j + 1] = left === b[j] ? prev[j] + 1 : Math.max(prev[j + 1], curr[j]);
    }
    prev.splice(0, prev.length, ...curr);
    curr.fill(0);
  }
  return prev[b.length];
}

export function rougeLScore(reference: string, candidate: string): number {
  const referenceTokens = tokens(reference);
  if (referenceTokens.length === 0) return tokens(candidate).length === 0 ? 1 : 0;
  return lcsLength(referenceTokens, tokens(candidate)) / referenceTokens.length;
}

export function meteorProxyScore(reference: string, candidate: string): number {
  const referenceTokens = canonicalTokens(reference);
  const candidateTokens = canonicalTokens(candidate);
  if (referenceTokens.length === 0 && candidateTokens.length === 0) return 1;
  if (referenceTokens.length === 0 || candidateTokens.length === 0) return 0;
  const alignment = greedyAlignment(referenceTokens, candidateTokens);
  if (alignment.length === 0) return 0;
  const precision = alignment.length / candidateTokens.length;
  const recall = alignment.length / referenceTokens.length;
  const harmonic = (10 * precision * recall) / (recall + 9 * precision);
  const chunks = alignmentChunks(alignment);
  const penalty = 0.5 * (chunks / alignment.length) ** 3;
  return harmonic * (1 - penalty);
}

function greedyAlignment(
  reference: readonly string[],
  candidate: readonly string[],
): { candidateIndex: number; referenceIndex: number }[] {
  const usedReference = new Set<number>();
  const pairs: { candidateIndex: number; referenceIndex: number }[] = [];
  candidate.forEach((token, candidateIndex) => {
    const referenceIndex = reference.findIndex(
      (refToken, index) => refToken === token && !usedReference.has(index),
    );
    if (referenceIndex === -1) return;
    usedReference.add(referenceIndex);
    pairs.push({ candidateIndex, referenceIndex });
  });
  return pairs;
}

function alignmentChunks(
  alignment: readonly { candidateIndex: number; referenceIndex: number }[],
): number {
  let chunks = 0;
  let previous: { candidateIndex: number; referenceIndex: number } | undefined;
  for (const pair of alignment) {
    if (
      !previous ||
      pair.candidateIndex !== previous.candidateIndex + 1 ||
      pair.referenceIndex !== previous.referenceIndex + 1
    ) {
      chunks += 1;
    }
    previous = pair;
  }
  return chunks;
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

function graphKeys(cues: ClinicalCues): string[] {
  return [
    ...assertionKeys(cues),
    ...cues.laterality.map((cue) => `laterality:${cue}`),
    ...cues.temporal.map((cue) => `temporal:${cue}`),
  ];
}

function srrBertKeys(cues: ClinicalCues): string[] {
  return [
    ...cues.findings,
    ...cues.laterality.map((cue) => `side:${cue}`),
    ...cues.temporal.map((cue) => `change:${cue}`),
  ];
}

export function safetyIssues(reference: ClinicalCues, candidate: ClinicalCues): SafetyIssue[] {
  const issues = new Map<string, SafetyIssue>();
  const refPresent = new Set(reference.presentFindings);
  const refAbsent = new Set(reference.absentFindings);

  for (const finding of candidate.presentFindings) {
    if (refAbsent.has(finding) || !reference.findings.includes(finding)) {
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

function missingCount(reference: readonly string[], candidate: readonly string[]): number {
  const candidateSet = new Set(candidate);
  return reference.filter((value) => !candidateSet.has(value)).length;
}

function cueMismatchCount(reference: readonly string[], candidate: readonly string[]): number {
  const missing = missingCount(reference, candidate);
  const extra = missingCount(candidate, reference);
  return Math.max(missing, extra);
}

function greenErrorCount(reference: ClinicalCues, candidate: ClinicalCues): number {
  return (
    safetyIssues(reference, candidate).length +
    cueMismatchCount(reference.laterality, candidate.laterality) +
    cueMismatchCount(reference.temporal, candidate.temporal)
  );
}

function crimsonWeightedErrors(reference: ClinicalCues, candidate: ClinicalCues): number {
  const safetyWeight = safetyIssues(reference, candidate).reduce((sum, issue) => {
    if (issue.kind === "assertion-flip") return sum + 1.2;
    return sum + 1;
  }, 0);
  return (
    safetyWeight +
    cueMismatchCount(reference.laterality, candidate.laterality) +
    cueMismatchCount(reference.temporal, candidate.temporal) * 0.8
  );
}

function score(referenceText: string, candidateText: string): ReportMetricValues {
  const reference = extractClinicalCues(referenceText);
  const candidate = extractClinicalCues(candidateText);
  const findingF1 = f1(reference.findings, candidate.findings);
  const assertionF1 = f1(assertionKeys(reference), assertionKeys(candidate));
  const temporalF1 = f1(reference.temporal, candidate.temporal);
  return {
    bleu1: bleu1Score(referenceText, candidateText),
    rougeL: rougeLScore(referenceText, candidateText),
    meteor: meteorProxyScore(referenceText, candidateText),
    bertScore: f1(canonicalTokens(referenceText), canonicalTokens(candidateText)),
    rateScore: assertionF1,
    chexbertF1: findingF1,
    srrBertF1: f1(srrBertKeys(reference), srrBertKeys(candidate)),
    radGraphF1: f1(graphKeys(reference), graphKeys(candidate)),
    greenErrors: greenErrorCount(reference, candidate),
    crimsonWeightedErrors: crimsonWeightedErrors(reference, candidate),
    lexicalOverlap: lexicalOverlapF1(referenceText, candidateText),
    findingF1,
    assertionF1,
    lateralityF1: f1(reference.laterality, candidate.laterality),
    temporalF1,
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
