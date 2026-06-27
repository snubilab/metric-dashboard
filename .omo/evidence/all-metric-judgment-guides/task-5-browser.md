# Task 5 Browser QA Evidence

Timestamp: 2026-06-27 21:53:03 KST
Repo: `/Users/kyh/Workspace/metric_dashboard`
URL: `http://127.0.0.1:5173/`
Viewport: `1440x1000`
Browser surface: Playwright API through `mcp__node_repl`, launched with system Chrome executable `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`.

## Setup

- Reread plan/source before QA: `.omo/plans/all-metric-judgment-guides.md`, `package.json`, `src/App.tsx`, `src/app/LearnView.tsx`, `src/app/topicRegistry.ts`.
- Recorded dirty worktree with `git status --short`; worktree was already dirty and no product files were edited.
- Dev server command: `npm run dev -- --host 127.0.0.1`
- First background start returned PID `59183` but exited immediately with empty log; reran foreground and Vite reported `http://127.0.0.1:5173/`.
- Health check: `curl -i --max-time 5 http://127.0.0.1:5173/` returned `HTTP/1.1 200 OK`.
- Browser invocation summary:
  - `chromium.launch({ headless: true, executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" })`
  - `newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 })`
  - `context.addInitScript(() => { localStorage.clear(); })` to prove Korean default.
  - DOM assertions used Playwright role/text locators, then `page.screenshot({ fullPage: false })`.

## manualQa

### surfaceEvidence

| scenario id | criterion reference | surface | exact invocation/actions | verdict | artifactRefs |
|---|---|---|---|---|---|
| S1 | Todo 5: Korean default classification Learn shows `정보가 되는 상황`, `놓치는 부분`, `직접 확인할 것` | Browser UI, Chrome/Playwright, `http://127.0.0.1:5173/`, viewport `1440x1000` | Clear `localStorage`; open URL; click topic button `/영상 분류/`; click selected Learn tab `/학습/`; scroll first `[data-testid="metric-judgment-guide"]` into view; assert labels exactly. Selected topic: `영상 분류`; selected tab: `학습`; language: `ko`, html lang `ko`. | PASS | A1 |
| S2 | Todo 5: Korean default report-generation Learn shows `정보가 되는 상황`, `놓치는 부분`, `직접 확인할 것` | Browser UI, Chrome/Playwright, `http://127.0.0.1:5173/`, viewport `1440x1000` | From Korean UI, click topic button `/LLM 리포트 생성/`; click selected Learn tab `/학습/`; scroll first guide into view; assert labels exactly. Selected topic: `LLM 리포트 생성`; selected tab: `학습`; language: `ko`, html lang `ko`. | PASS | A2 |
| S3 | Todo 5: English toggled classification Learn shows `Informative when`, `Blind spot when`, `Try this` | Browser UI, Chrome/Playwright, `http://127.0.0.1:5173/`, viewport `1440x1000` | Click language button `English`; click topic button `/Image Classification/`; click selected Learn tab `/Learn/`; scroll first guide into view; assert labels exactly. Selected topic: `Image Classification`; selected tab: `Learn`; language: `en`, html lang `en`. | PASS | A3 |
| S4 | Todo 5: English toggled report-generation Learn shows `Informative when`, `Blind spot when`, `Try this` | Browser UI, Chrome/Playwright, `http://127.0.0.1:5173/`, viewport `1440x1000` | With English still selected, click topic button `/LLM — Report Generation/`; click selected Learn tab `/Learn/`; scroll first guide into view; assert labels exactly. Selected topic: `LLM — Report Generation`; selected tab: `Learn`; language: `en`, html lang `en`. | PASS | A4 |

### adversarialCases

| scenario id | criterion reference | adversarial class | expected behavior | verdict | artifactRefs |
|---|---|---|---|---|---|
| ADV1 | Dirty worktree applies | `dirty_worktree` | Record `git status --short`; do not modify unrelated files. | PASS: status recorded before QA; only evidence files/screenshots were written. | A5 |
| ADV2 | Stale state applies | `stale_state` | Reread plan and current source before running browser QA. | PASS: listed references were read before browser execution. | A5 |
| ADV3 | Misleading success output applies | `misleading_success_output` | Do not rely only on command success; require browser-visible text assertions and screenshots. | PASS: each surface has exact label assertions and non-empty screenshot artifact. | A1, A2, A3, A4 |
| ADV4 | Hung or long commands applies | `hung_or_long_commands` | Dev server must be bounded and cleaned up. | PASS: Vite was stopped with Ctrl-C; post-cleanup `pgrep -fl "vite --host 127.0.0.1\|npm run dev"` returned no process. | A5 |
| ADV5 | Generated/cached screenshot stale state applies | `generated/cached artifacts stale_state` | Screenshots must include current timestamp/URL in this markdown and be non-empty. | PASS: timestamp and URL recorded; PNGs are 1440x1000 and non-empty. | A1, A2, A3, A4, A5 |

### artifactRefs

| id | kind | description | path |
|---|---|---|---|
| A1 | screenshot | Korean default classification Learn surface with the three Korean judgment guide labels visible. | `/Users/kyh/Workspace/metric_dashboard/.omo/evidence/all-metric-judgment-guides/task-5-ko-classification-learn.png` |
| A2 | screenshot | Korean default report-generation Learn surface with the three Korean judgment guide labels visible. | `/Users/kyh/Workspace/metric_dashboard/.omo/evidence/all-metric-judgment-guides/task-5-ko-report-generation-learn.png` |
| A3 | screenshot | English toggled classification Learn surface with the three English judgment guide labels visible. | `/Users/kyh/Workspace/metric_dashboard/.omo/evidence/all-metric-judgment-guides/task-5-en-classification-learn.png` |
| A4 | screenshot | English toggled report-generation Learn surface with the three English judgment guide labels visible. | `/Users/kyh/Workspace/metric_dashboard/.omo/evidence/all-metric-judgment-guides/task-5-en-report-generation-learn.png` |
| A5 | markdown | This manual QA matrix, setup notes, exact actions, and cleanup receipt. | `/Users/kyh/Workspace/metric_dashboard/.omo/evidence/all-metric-judgment-guides/task-5-browser.md` |

## Cleanup Receipt

- Dev server foreground session id: `87137`.
- Vite process observed while running: npm wrapper PID `61473`, Vite child PID `61555`.
- Cleanup action: sent Ctrl-C to session `87137`.
- Post-cleanup check: `pgrep -fl "vite --host 127.0.0.1\|npm run dev" || true` returned no matching process.

## Notes

- Product tests were not run; this todo was browser/manual QA only.
- A Playwright bundled-browser launch was attempted first and failed because the cached Chromium executable was absent. The completed browser QA used the same Playwright API with installed system Chrome.
