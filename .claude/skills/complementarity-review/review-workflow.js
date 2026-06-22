export const meta = {
  name: 'complementarity-content-review',
  description: 'Fact-check every per-metric complementarity claim in each topic Learn content, adversarially verifying each flagged error',
  phases: [
    { title: 'Review', detail: 'domain-expert fact-check per topic' },
    { title: 'Verify', detail: 'independently confirm each flagged error' },
  ],
}

// The repo root is passed in via `args.root` (absolute path) so the skill is
// portable. Each topic's Learn content file is read by a reviewer agent.
const ROOT = (typeof args !== 'undefined' && args && args.root) ? String(args.root).replace(/\/$/, '') : ''
if (!ROOT) {
  log('WARNING: no args.root provided — pass { root: "<absolute repo path>" } so reviewers can read the content files.')
}

// Topics to review. Add a new topic's content file here when a topic is added.
const TOPICS = [
  {
    key: 'segmentation',
    file: ROOT + '/src/topics/segmentation/content.ts',
    metrics: 'Dice, IoU/Jaccard, Sensitivity/Recall, Precision, Hausdorff (HD), HD95, ASSD, Surface Dice/NSD, Volume difference, lesion-wise Dice & HD95, clDice (centerline Dice)',
  },
  {
    key: 'detection',
    file: ROOT + '/src/topics/detection/content.ts',
    metrics: 'matching (IoU-threshold TP/FP/FN), Precision, Recall, F1, AP, mAP, AP50, AP75, AP@[.5:.95], FROC, sensitivity at fixed FP/image',
  },
]

const FINDINGS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    topic: { type: 'string' },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          metric: { type: 'string', description: 'the metric whose complementarity claim is wrong' },
          claim: { type: 'string', description: 'the exact claim text being challenged' },
          verdict: { type: 'string', enum: ['wrong', 'misleading', 'imprecise'] },
          reason: { type: 'string', description: 'why it is factually wrong/misleading (domain reasoning)' },
          suggestedFix: { type: 'string', description: 'the corrected claim' },
        },
        required: ['metric', 'claim', 'verdict', 'reason', 'suggestedFix'],
      },
    },
    overallVerdict: { type: 'string', enum: ['ALL_CORRECT', 'ISSUES_FOUND'] },
  },
  required: ['topic', 'findings', 'overallVerdict'],
}

const VERDICT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    isRealError: { type: 'boolean', description: 'true ONLY if the original claim is genuinely factually wrong or materially misleading' },
    confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
    reasoning: { type: 'string' },
    correctedClaim: { type: 'string', description: 'the fix to apply if isRealError' },
  },
  required: ['isRealError', 'confidence', 'reasoning', 'correctedClaim'],
}

phase('Review')
const results = await pipeline(
  TOPICS,
  (t) => agent(
    'You are a medical-imaging / ML evaluation-metrics domain expert doing a CONTENT-FIDELITY review. ' +
    'Read the Learn content file at ' + t.file + ' and find EVERY per-metric `complements:` string (the ' +
    '"pairs well with / report with" advice) AND the topic-level `complementarity` section (its `intro`, the ' +
    '`pairs` array, and `benchmarks`). The topic is ' + t.key + ' covering: ' + t.metrics + '.\n\n' +
    'For EACH complementarity claim, decide whether it is FACTUALLY CORRECT. Flag a claim only if it is ' +
    'genuinely wrong, materially misleading, or imprecise enough to teach the wrong pairing. Examples of real ' +
    'errors: claiming two metrics are independent when one determines the other; a wrong monotonic relationship; ' +
    'recommending a pairing that does not actually cover the stated failure mode; a stated formula/relationship ' +
    'that is false. Do NOT flag correct-but-terse claims, stylistic choices, or things you merely would word ' +
    'differently. Verify standard facts precisely (e.g. Dice = 2·IoU/(1+IoU) is monotonic so Dice and IoU rank a ' +
    'SINGLE case identically but dataset means can differ; HD is worst-case and outlier-sensitive; NSD needs a ' +
    'tolerance; AP integrates the PR curve; AP50 vs AP@[.5:.95] is loose vs strict localization; FROC is ' +
    'sensitivity vs FP/scan). Return findings only for genuine problems; if all claims are sound return an empty ' +
    'findings array with overallVerdict ALL_CORRECT.',
    { label: 'review:' + t.key, phase: 'Review', schema: FINDINGS_SCHEMA },
  ),
  (review, t) => {
    if (!review || !review.findings || review.findings.length === 0) return []
    return parallel(review.findings.map((f) => () =>
      agent(
        'You are a second independent medical-imaging metrics expert. Another reviewer claims this ' +
        'complementarity statement in the ' + t.key + ' Learn content is ' + f.verdict + '. Your job is to ' +
        'REFUTE the finding if you can — default to isRealError=false unless the original claim is genuinely, ' +
        'demonstrably wrong or materially misleading.\n\n' +
        'METRIC: ' + f.metric + '\nORIGINAL CLAIM: "' + f.claim + '"\nREVIEWER OBJECTION: ' + f.reason +
        '\nPROPOSED FIX: "' + f.suggestedFix + '"\n\n' +
        'Reason from first principles about the metrics. Set isRealError=true only if the original claim ' +
        'really would mislead a student about how the metrics relate; otherwise false. If true, give the precise ' +
        'correctedClaim (keep it terse, preserve any metric tokens like HD95/NSD/Dice so Learn links resolve).',
        { label: 'verify:' + t.key + ':' + f.metric, phase: 'Verify', schema: VERDICT_SCHEMA },
      ).then((v) => ({ topic: t.key, ...f, verdict2: v })),
    ))
  },
)

const all = results.flat().filter(Boolean)
const confirmed = all.filter((f) => f.verdict2 && f.verdict2.isRealError)
return {
  topicsReviewed: TOPICS.length,
  totalFlagged: all.length,
  confirmedErrors: confirmed.length,
  confirmed: confirmed.map((f) => ({
    topic: f.topic, metric: f.metric, claim: f.claim,
    correctedClaim: f.verdict2.correctedClaim, confidence: f.verdict2.confidence, why: f.verdict2.reasoning,
  })),
  refuted: all.filter((f) => f.verdict2 && !f.verdict2.isRealError).map((f) => ({
    topic: f.topic, metric: f.metric, claim: f.claim, whyRefuted: f.verdict2.reasoning,
  })),
}
