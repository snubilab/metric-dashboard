# F3 Real Manual QA Verification

Timestamp: 2026-06-27 22:14 KST
Repo: `/Users/kyh/Workspace/metric_dashboard`
Plan checkbox: `F3. Real manual QA`

Existing Task 5 artifacts were sufficient, so I did not start a new server.

## manualQa

### surfaceEvidence

| scenario id | criterion reference | surface | exact invocation | verdict | artifactRefs |
|---|---|---|---|---|---|
| F3-S1 | F3 + Task 5: KO classification Learn guide labels visible | Browser screenshot artifact inspection | `view_image(path="/Users/kyh/Workspace/metric_dashboard/.omo/evidence/all-metric-judgment-guides/task-5-ko-classification-learn.png", detail="high")` after `file .omo/evidence/all-metric-judgment-guides/task-5-*-learn.png` | PASS: image shows `영상 분류`, selected `학습`, Korean active, and labels `정보가 되는 상황`, `놓치는 부분`, `직접 확인할 것`. | A1, A6 |
| F3-S2 | F3 + Task 5: KO report-generation Learn guide labels visible | Browser screenshot artifact inspection | `view_image(path="/Users/kyh/Workspace/metric_dashboard/.omo/evidence/all-metric-judgment-guides/task-5-ko-report-generation-learn.png", detail="high")` after `file .omo/evidence/all-metric-judgment-guides/task-5-*-learn.png` | PASS: image shows `LLM 리포트 생성`, selected `학습`, Korean active, and labels `정보가 되는 상황`, `놓치는 부분`, `직접 확인할 것`. | A2, A6 |
| F3-S3 | F3 + Task 5: EN classification Learn guide labels visible | Browser screenshot artifact inspection | `view_image(path="/Users/kyh/Workspace/metric_dashboard/.omo/evidence/all-metric-judgment-guides/task-5-en-classification-learn.png", detail="high")` after `file .omo/evidence/all-metric-judgment-guides/task-5-*-learn.png` | PASS: image shows `Image Classification`, selected `Learn`, English active, and labels `INFORMATIVE WHEN`, `BLIND SPOT WHEN`, `TRY THIS`. | A3, A6 |
| F3-S4 | F3 + Task 5: EN report-generation Learn guide labels visible | Browser screenshot artifact inspection | `view_image(path="/Users/kyh/Workspace/metric_dashboard/.omo/evidence/all-metric-judgment-guides/task-5-en-report-generation-learn.png", detail="high")` after `file .omo/evidence/all-metric-judgment-guides/task-5-*-learn.png` | PASS: image shows `LLM — Report Generation`, selected `Learn`, English active, and labels `INFORMATIVE WHEN`, `BLIND SPOT WHEN`, `TRY THIS`. | A4, A6 |
| F3-S5 | F3: cleanup receipt and no lingering server | Terminal process inspection | `pgrep -fl 'vite --host 127.0.0.1|npm run dev' || true` and `lsof -nP -iTCP:5173 -sTCP:LISTEN || true` | PASS: both checks returned no server/listener output. Existing `task-5-browser.md` records Ctrl-C cleanup and a no-match post-cleanup check. | A5, A6 |
| F3-S6 | F3: existing artifacts are current enough to trust | Terminal metadata inspection | `stat -f '%Sm %z %N' -t '%Y-%m-%d %H:%M:%S %Z' .omo/evidence/all-metric-judgment-guides/task-5-browser.md .omo/evidence/all-metric-judgment-guides/task-5-*.png src/app/LearnView.tsx src/topics/judgmentGuides.ts src/app/topicRegistry.ts src/App.tsx package.json` | PASS: screenshots/evidence are non-empty and were captured after relevant LearnView/judgment guide source mtimes. | A1, A2, A3, A4, A5, A6 |

### adversarialCases

| scenario id | criterion reference | adversarial class | expected behavior | verdict | artifactRefs |
|---|---|---|---|---|---|
| F3-ADV1 | F3 evidence verification | stale_state | Do not trust Task 5 summary text alone; inspect screenshots and mtimes. | PASS: opened all four screenshots, checked file type/dimensions/sizes, and compared source/evidence mtimes. | A1, A2, A3, A4, A6 |
| F3-ADV2 | F3 evidence verification | misleading_success_output | PASS claims require visible labels or real process evidence. | PASS: verdicts are based on visible PNG contents plus process checks, not only markdown PASS rows. | A1, A2, A3, A4, A5, A6 |
| F3-ADV3 | F3 cleanup requirement | hung_or_long_commands | No local dev server should be left running. | PASS: `pgrep` and `lsof` showed no Vite/npm dev server or port 5173 listener. | A5, A6 |
| F3-ADV4 | F3 scope control | dirty_worktree | Existing dirty worktree must not be modified except required evidence file. | PASS: `git status --short` showed a dirty tree before this report; I made no product edits and added only this F3 evidence file. | A6 |
| F3-ADV5 | F3 artifact integrity | generated_cached_artifacts | Screenshots must be non-empty real browser artifacts. | PASS: all four PNGs are 1440x1000 RGB files with sizes 168619 to 192022 bytes and visible browser UI content. | A1, A2, A3, A4, A6 |

### artifactRefs

| id | kind | description | path |
|---|---|---|---|
| A1 | screenshot | KO classification Learn screenshot with three Korean labels visible. | `/Users/kyh/Workspace/metric_dashboard/.omo/evidence/all-metric-judgment-guides/task-5-ko-classification-learn.png` |
| A2 | screenshot | KO report-generation Learn screenshot with three Korean labels visible. | `/Users/kyh/Workspace/metric_dashboard/.omo/evidence/all-metric-judgment-guides/task-5-ko-report-generation-learn.png` |
| A3 | screenshot | EN classification Learn screenshot with three English labels visible. | `/Users/kyh/Workspace/metric_dashboard/.omo/evidence/all-metric-judgment-guides/task-5-en-classification-learn.png` |
| A4 | screenshot | EN report-generation Learn screenshot with three English labels visible. | `/Users/kyh/Workspace/metric_dashboard/.omo/evidence/all-metric-judgment-guides/task-5-en-report-generation-learn.png` |
| A5 | markdown | Original Task 5 browser QA matrix, setup, exact actions, and cleanup receipt. | `/Users/kyh/Workspace/metric_dashboard/.omo/evidence/all-metric-judgment-guides/task-5-browser.md` |
| A6 | markdown | This independent F3 verification report with invocations, verdicts, and cleanup confirmation. | `/Users/kyh/Workspace/metric_dashboard/.omo/evidence/all-metric-judgment-guides/F3-real-manual-qa.md` |

## AdversarialVerify

```json
{
  "verdict": "confirmed",
  "evidence": [
    "Inspected task-5-browser.md and confirmed it records URL http://127.0.0.1:5173/, viewport 1440x1000, Playwright/system Chrome invocation, exact KO/EN navigation actions, selected topics/tabs/languages, visible label assertions, screenshot paths, and cleanup receipt.",
    "Opened all four screenshots with view_image. KO classification and KO report-generation show Korean active, selected 학습 tab, and the labels 정보가 되는 상황, 놓치는 부분, 직접 확인할 것.",
    "Opened all four screenshots with view_image. EN classification and EN report-generation show English active, selected Learn tab, and the labels INFORMATIVE WHEN, BLIND SPOT WHEN, TRY THIS.",
    "Shell metadata check confirms all four PNGs are non-empty 1440x1000 RGB screenshots.",
    "Cleanup confirmed independently: pgrep for npm/Vite dev server and lsof on TCP 5173 returned no lingering server/listener output.",
    "No rerun was needed because the artifacts were complete and source mtimes for LearnView.tsx and judgmentGuides.ts predate screenshot capture."
  ],
  "repro": "cd /Users/kyh/Workspace/metric_dashboard && sed -n '1,220p' .omo/evidence/all-metric-judgment-guides/task-5-browser.md && file .omo/evidence/all-metric-judgment-guides/task-5-*-learn.png && stat -f '%Sm %z %N' -t '%Y-%m-%d %H:%M:%S %Z' .omo/evidence/all-metric-judgment-guides/task-5-browser.md .omo/evidence/all-metric-judgment-guides/task-5-*.png src/app/LearnView.tsx src/topics/judgmentGuides.ts src/app/topicRegistry.ts src/App.tsx package.json && pgrep -fl 'vite --host 127.0.0.1|npm run dev' || true && lsof -nP -iTCP:5173 -sTCP:LISTEN || true",
  "confidence": 0.95,
  "adversarial_classes": [
    "stale_state",
    "misleading_success_output",
    "hung_or_long_commands",
    "dirty_worktree",
    "generated_cached_artifacts"
  ]
}
```
