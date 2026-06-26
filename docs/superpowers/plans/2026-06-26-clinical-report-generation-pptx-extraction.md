# Clinical Report Generation PPTX Extraction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract text, images, slide-image links, and curation notes from `/Users/kyh/Downloads/Clinical_Report_Generation_Metrics.pptx` into a reproducible source bundle for future Metric Dashboard topic work.

**Architecture:** Keep raw extraction outside app runtime code under `docs/extracted/clinical-report-generation-metrics/`, because this PPTX is source material, not yet validated dashboard content. Use one small Python utility with stdlib `zipfile`/`xml.etree.ElementTree` plus existing `Pillow` for image dimensions; avoid adding package dependencies. The extractor writes deterministic Markdown/JSON/image files, then a human curation note groups slides into teaching units.

**Tech Stack:** Python 3, stdlib ZIP/XML/JSON/hashlib, Pillow, LibreOffice `soffice`, Poppler `pdftoppm`, existing repository docs.

---

## Scope Check

This plan only extracts and organizes the PPTX source material. It does not add a new dashboard topic, metric engine, Learn/Playground/Scenarios views, or i18n strings. That implementation needs a separate plan after the extracted material is reviewed.

Observed PPTX profile:

- Source: `/Users/kyh/Downloads/Clinical_Report_Generation_Metrics.pptx`
- Slides: 23
- Media files: 60
- Embedded Office charts: 0
- Embedded files: 0
- PowerPoint table XML hits: 0
- Main content clusters: motivation, lexical metrics, lexical failure examples, clinical metric landscape, concept/graph metrics, embedding metrics, LLM evaluators, clinical acceptance, generalization beyond CXR.

## File Structure

- Create `tools/extract_clinical_report_generation_pptx.py`
  - Reads the PPTX package directly.
  - Extracts slide text, slide-to-image references, image dimensions, and checksums.
  - Copies media with deterministic hash-prefixed names.
  - Writes Markdown slide notes and JSON manifests.
- Create `tools/extract_clinical_report_generation_pptx_test.py`
  - Unit tests for deterministic media naming, text extraction, image mapping, and output validation using a tiny synthetic PPTX-like zip file.
- Generate `docs/extracted/clinical-report-generation-metrics/manifest.json`
  - Machine-readable extraction summary.
- Generate `docs/extracted/clinical-report-generation-metrics/images/index.json`
  - Machine-readable image inventory.
- Generate `docs/extracted/clinical-report-generation-metrics/images/<sha12>-<original-name>`
  - Raw extracted images deduplicated by checksum.
- Generate `docs/extracted/clinical-report-generation-metrics/slides/slide-01.md` through `slide-23.md`
  - One Markdown file per slide with text and linked extracted images.
- Generate `docs/extracted/clinical-report-generation-metrics/curation.md`
  - Human-facing organization map for future topic design.
- Generate `docs/extracted/clinical-report-generation-metrics/README.md`
  - Reproduction commands, source provenance, and dashboard-import warnings.
- Optional generated preview outside the repo: `/tmp/metric-dashboard-pptx-preview/contact-sheet.png`
  - Visual QA aid only, not committed.

---

### Task 1: Add A Deterministic PPTX Extractor

**Files:**
- Create: `tools/extract_clinical_report_generation_pptx.py`
- Create: `tools/extract_clinical_report_generation_pptx_test.py`

- [ ] **Step 1: Write the failing unit tests**

Create `tools/extract_clinical_report_generation_pptx_test.py`:

```python
import json
import tempfile
import unittest
from pathlib import Path
from zipfile import ZipFile

from extract_clinical_report_generation_pptx import extract_pptx, safe_media_name


SLIDE_XML = """<?xml version="1.0" encoding="UTF-8"?>
<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
       xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
       xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <p:cSld>
    <p:spTree>
      <p:sp><p:txBody><a:p><a:r><a:t>Clinical Metric</a:t></a:r></a:p></p:txBody></p:sp>
      <p:sp><p:txBody><a:p><a:r><a:t>Temporal F1</a:t></a:r></a:p></p:txBody></p:sp>
      <p:pic><p:blipFill><a:blip r:embed="rId2"/></p:blipFill></p:pic>
    </p:spTree>
  </p:cSld>
</p:sld>
"""

RELS_XML = """<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId2"
                Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image"
                Target="../media/image1.png"/>
</Relationships>
"""

TINY_PNG = bytes.fromhex(
    "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c489"
    "0000000a49444154789c6360000002000100ffff03000006000557bfab7d000000"
    "0049454e44ae426082"
)


class ExtractClinicalReportPptxTest(unittest.TestCase):
    def test_safe_media_name_keeps_hash_and_original_basename(self):
        result = safe_media_name("ppt/media/image1.png", b"abc")
        self.assertEqual(result, "ba7816bf8f01-image1.png")

    def test_extract_pptx_writes_manifest_slides_and_images(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            pptx = root / "sample.pptx"
            out = root / "out"

            with ZipFile(pptx, "w") as archive:
                archive.writestr("ppt/slides/slide1.xml", SLIDE_XML)
                archive.writestr("ppt/slides/_rels/slide1.xml.rels", RELS_XML)
                archive.writestr("ppt/media/image1.png", TINY_PNG)

            extract_pptx(pptx, out)

            manifest = json.loads((out / "manifest.json").read_text(encoding="utf-8"))
            image_index = json.loads((out / "images" / "index.json").read_text(encoding="utf-8"))
            slide = (out / "slides" / "slide-01.md").read_text(encoding="utf-8")

            self.assertEqual(manifest["slide_count"], 1)
            self.assertEqual(manifest["media_count"], 1)
            self.assertEqual(manifest["slides"][0]["title"], "Clinical Metric Temporal F1")
            self.assertEqual(manifest["slides"][0]["images"][0]["original_path"], "ppt/media/image1.png")
            self.assertEqual(image_index["images"][0]["width"], 1)
            self.assertIn("Clinical Metric", slide)
            self.assertIn("Temporal F1", slide)
            self.assertIn("../images/", slide)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run tests and verify they fail because the extractor does not exist**

Run:

```bash
/Users/kyh/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 tools/extract_clinical_report_generation_pptx_test.py
```

Expected:

```text
ModuleNotFoundError: No module named 'extract_clinical_report_generation_pptx'
```

- [ ] **Step 3: Add the minimal extractor implementation**

Create `tools/extract_clinical_report_generation_pptx.py`:

```python
import argparse
import json
import re
import shutil
from dataclasses import dataclass
from hashlib import sha256
from io import BytesIO
from pathlib import Path
from zipfile import ZipFile
from xml.etree import ElementTree as ET

from PIL import Image


NS = {
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
    "p": "http://schemas.openxmlformats.org/presentationml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "rel": "http://schemas.openxmlformats.org/package/2006/relationships",
}


@dataclass(frozen=True)
class ImageRecord:
    original_path: str
    output_name: str
    sha256_12: str
    size_bytes: int
    width: int | None
    height: int | None
    format: str


def safe_media_name(original_path: str, data: bytes) -> str:
    digest = sha256(data).hexdigest()[:12]
    return f"{digest}-{Path(original_path).name}"


def slide_number(path: str) -> int:
    match = re.search(r"slide(\d+)\.xml$", path)
    if not match:
        raise ValueError(f"Not a slide path: {path}")
    return int(match.group(1))


def read_text_runs(xml_bytes: bytes) -> list[str]:
    root = ET.fromstring(xml_bytes)
    return [
        text.text.strip()
        for text in root.findall(".//a:t", NS)
        if text.text and text.text.strip()
    ]


def read_slide_image_paths(archive: ZipFile, slide_index: int, slide_xml: bytes) -> list[str]:
    rel_path = f"ppt/slides/_rels/slide{slide_index}.xml.rels"
    if rel_path not in archive.namelist():
        return []

    rels_root = ET.fromstring(archive.read(rel_path))
    rels: dict[str, str] = {}
    for rel in rels_root.findall("rel:Relationship", NS):
        rel_id = rel.attrib.get("Id")
        target = rel.attrib.get("Target", "")
        if rel_id and target.startswith("../media/"):
            rels[rel_id] = "ppt/media/" + target.split("../media/", 1)[1]

    root = ET.fromstring(slide_xml)
    image_paths: list[str] = []
    embed_attr = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed"
    for blip in root.findall(".//a:blip", NS):
        rel_id = blip.attrib.get(embed_attr)
        if rel_id in rels:
            image_paths.append(rels[rel_id])
    return image_paths


def image_record(original_path: str, output_name: str, data: bytes) -> ImageRecord:
    try:
        image = Image.open(BytesIO(data))
        width = image.width
        height = image.height
        image_format = image.format or "unknown"
    except Exception:
        width = None
        height = None
        image_format = "unknown"

    return ImageRecord(
        original_path=original_path,
        output_name=output_name,
        sha256_12=sha256(data).hexdigest()[:12],
        size_bytes=len(data),
        width=width,
        height=height,
        format=image_format,
    )


def write_slide_markdown(
    output_path: Path,
    slide_index: int,
    text_runs: list[str],
    images: list[ImageRecord],
) -> None:
    title = " ".join(text_runs[:3]) if text_runs else f"Slide {slide_index}"
    lines = [
        f"# Slide {slide_index:02d}: {title}",
        "",
        "## Text",
        "",
    ]
    lines.extend(f"- {text}" for text in text_runs)
    lines.extend(["", "## Images", ""])
    if images:
        lines.extend(
            f"- `{image.original_path}` -> `../images/{image.output_name}` "
            f"({image.width}x{image.height}, {image.format}, {image.size_bytes} bytes)"
            for image in images
        )
    else:
        lines.append("- No linked media.")
    output_path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def extract_pptx(source: Path, output_dir: Path) -> None:
    if output_dir.exists():
        shutil.rmtree(output_dir)
    slides_dir = output_dir / "slides"
    images_dir = output_dir / "images"
    slides_dir.mkdir(parents=True)
    images_dir.mkdir(parents=True)

    with ZipFile(source) as archive:
        archive_names = archive.namelist()
        slide_paths = sorted(
            [
                name
                for name in archive_names
                if re.fullmatch(r"ppt/slides/slide\d+\.xml", name)
            ],
            key=slide_number,
        )
        media_paths = sorted(name for name in archive_names if name.startswith("ppt/media/"))

        image_records_by_path: dict[str, ImageRecord] = {}
        for media_path in media_paths:
            data = archive.read(media_path)
            output_name = safe_media_name(media_path, data)
            image_records_by_path[media_path] = image_record(media_path, output_name, data)
            image_output = images_dir / output_name
            if not image_output.exists():
                image_output.write_bytes(data)

        slide_records = []
        for index, slide_path in enumerate(slide_paths, start=1):
            xml = archive.read(slide_path)
            text_runs = read_text_runs(xml)
            image_paths = read_slide_image_paths(archive, index, xml)
            images = [image_records_by_path[path] for path in image_paths if path in image_records_by_path]
            write_slide_markdown(slides_dir / f"slide-{index:02d}.md", index, text_runs, images)
            slide_records.append(
                {
                    "slide": index,
                    "title": " ".join(text_runs[:3]) if text_runs else f"Slide {index}",
                    "text_run_count": len(text_runs),
                    "images": [image.__dict__ for image in images],
                }
            )

    image_index = {"images": [record.__dict__ for record in image_records_by_path.values()]}
    (images_dir / "index.json").write_text(
        json.dumps(image_index, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    manifest = {
        "source": str(source),
        "slide_count": len(slide_records),
        "media_count": len(image_records_by_path),
        "slides": slide_records,
    }
    (output_dir / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--source",
        default="/Users/kyh/Downloads/Clinical_Report_Generation_Metrics.pptx",
    )
    parser.add_argument(
        "--out",
        default="docs/extracted/clinical-report-generation-metrics",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    extract_pptx(Path(args.source), Path(args.out))


if __name__ == "__main__":
    main()
```

- [ ] **Step 4: Run tests and verify they pass**

Run:

```bash
/Users/kyh/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 tools/extract_clinical_report_generation_pptx_test.py
```

Expected:

```text
..
----------------------------------------------------------------------
Ran 2 tests

OK
```

- [ ] **Step 5: Commit extractor and tests**

Run:

```bash
git add tools/extract_clinical_report_generation_pptx.py tools/extract_clinical_report_generation_pptx_test.py
git commit -m "chore: add clinical report pptx extractor"
```

Expected: a commit containing only the extractor and its test.

---

### Task 2: Extract Raw Slide Text And Images

**Files:**
- Generate: `docs/extracted/clinical-report-generation-metrics/manifest.json`
- Generate: `docs/extracted/clinical-report-generation-metrics/images/index.json`
- Generate: `docs/extracted/clinical-report-generation-metrics/images/*.png`
- Generate: `docs/extracted/clinical-report-generation-metrics/images/*.gif`
- Generate: `docs/extracted/clinical-report-generation-metrics/slides/slide-01.md` through `docs/extracted/clinical-report-generation-metrics/slides/slide-23.md`

- [ ] **Step 1: Run the extractor on the real PPTX**

Run:

```bash
/Users/kyh/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 tools/extract_clinical_report_generation_pptx.py \
  --source /Users/kyh/Downloads/Clinical_Report_Generation_Metrics.pptx \
  --out docs/extracted/clinical-report-generation-metrics
```

Expected: command exits with no output and creates the extraction directory.

- [ ] **Step 2: Verify extraction counts against the inspected PPTX profile**

Run:

```bash
/Users/kyh/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 - <<'PY'
import json
from pathlib import Path

root = Path("docs/extracted/clinical-report-generation-metrics")
manifest = json.loads((root / "manifest.json").read_text(encoding="utf-8"))
image_index = json.loads((root / "images" / "index.json").read_text(encoding="utf-8"))
slides = sorted((root / "slides").glob("slide-*.md"))

assert manifest["slide_count"] == 23, manifest["slide_count"]
assert manifest["media_count"] == 60, manifest["media_count"]
assert len(image_index["images"]) == 60, len(image_index["images"])
assert len(slides) == 23, len(slides)
assert manifest["slides"][1]["title"].startswith("MOTIVATION"), manifest["slides"][1]["title"]
assert manifest["slides"][21]["title"].startswith("RECOMMENDATION"), manifest["slides"][21]["title"]

print("verified: 23 slides, 60 media files, slide titles aligned")
PY
```

Expected:

```text
verified: 23 slides, 60 media files, slide titles aligned
```

- [ ] **Step 3: Render a non-committed contact sheet for visual checking**

Run:

```bash
tmp=/tmp/metric-dashboard-pptx-preview
rm -rf "$tmp"
mkdir -p "$tmp"
/Users/kyh/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/soffice --headless --convert-to pdf --outdir "$tmp" /Users/kyh/Downloads/Clinical_Report_Generation_Metrics.pptx
/Users/kyh/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/pdftoppm -png -r 70 "$tmp/Clinical_Report_Generation_Metrics.pdf" "$tmp/slide"
/Users/kyh/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 - <<'PY'
from pathlib import Path
from PIL import Image, ImageDraw

slides = sorted(Path("/tmp/metric-dashboard-pptx-preview").glob("slide-*.png"))
thumbs = []
for path in slides:
    image = Image.open(path).convert("RGB")
    image.thumbnail((260, 146))
    tile = Image.new("RGB", (280, 180), "white")
    tile.paste(image, ((280 - image.width) // 2, 18))
    draw = ImageDraw.Draw(tile)
    draw.text((10, 4), path.stem.replace("slide-", "slide "), fill=(0, 0, 0))
    thumbs.append(tile)

sheet = Image.new("RGB", (4 * 280, ((len(thumbs) + 3) // 4) * 180), (235, 235, 235))
for index, tile in enumerate(thumbs):
    sheet.paste(tile, ((index % 4) * 280, (index // 4) * 180))
sheet.save("/tmp/metric-dashboard-pptx-preview/contact-sheet.png")
print("/tmp/metric-dashboard-pptx-preview/contact-sheet.png")
PY
```

Expected:

```text
/tmp/metric-dashboard-pptx-preview/contact-sheet.png
```

- [ ] **Step 4: Commit raw extraction artifacts**

Run:

```bash
git add docs/extracted/clinical-report-generation-metrics/manifest.json \
  docs/extracted/clinical-report-generation-metrics/images \
  docs/extracted/clinical-report-generation-metrics/slides
git commit -m "docs: extract clinical report pptx source materials"
```

Expected: a commit containing extracted JSON, Markdown slides, and image files.

---

### Task 3: Add The Human Curation Map

**Files:**
- Create: `docs/extracted/clinical-report-generation-metrics/curation.md`

- [ ] **Step 1: Write the curation map**

Create `docs/extracted/clinical-report-generation-metrics/curation.md`:

```markdown
# Clinical Report Generation Metrics Curation Map

Source deck: `/Users/kyh/Downloads/Clinical_Report_Generation_Metrics.pptx`

This file organizes extracted PPTX material into teaching units. It is not dashboard content yet.

## Keep Separate From The App Until Reviewed

- Raw extraction lives in `docs/extracted/clinical-report-generation-metrics/`.
- Future dashboard topic code should live under `src/topics/report-generation/` only after a separate implementation plan.
- Do not import slide screenshots directly into Learn sections unless the image is the actual object being explained.
- Rebuild diagrams as token-based SVG/React figures when they become dashboard figures.

## Teaching Units

### 1. Motivation: Why Report Generation Evaluation Is Different

Slides: 1, 2

Use for:
- Opening context: radiology reports affect diagnosis, triage, follow-up, and treatment decisions.
- Dataset context: MIMIC-CXR, CheXpert, OpenI, ReXGradient.
- Clinical dimensions: correctness, omission, hallucination, laterality, location, severity, temporal change.

Avoid:
- Treating CXR as the only target modality.
- Presenting workload improvement as proven by the deck alone.

### 2. Lexical Baselines

Slides: 3, 4, 5, 6

Metrics:
- BLEU
- ROUGE-L
- METEOR

Use for:
- Explaining precision-heavy, recall-heavy, and synonym-aware lexical overlap.
- Showing that lexical overlap measures surface form before clinical meaning.

Dashboard conversion:
- Rebuild formulas as KaTeX.
- Rebuild n-gram examples as small tokenized text figures, not screenshots.

### 3. Failure Modes Of Traditional NLG Metrics

Slides: 7, 8, 9

Use for:
- Same meaning, different wording.
- Similar wording, opposite clinical meaning.
- Single-reference limitation.
- Worked examples for negation and laterality errors.

Dashboard conversion:
- Convert Candidate A/B/C into a read-only scenario card.
- The teaching point should be: metric agreement changes with what the metric can observe.
- Avoid absolute grade words for a metric or prediction.

### 4. Clinical Metric Landscape

Slide: 10

Four levels:
- Lexical overlap: BLEU, ROUGE, METEOR, Temporal F1
- Embedding similarity: BERTScore, RaTEscore
- Clinical concept / graph: CheXbert F1, RadGraph F1, SRR-BERT F1
- LLM / learned evaluator: GREEN, CRIMSON, VERT, ReFINE, RadOT-Eval

Use for:
- Topic overview and navigation.
- A compact comparison table.

### 5. Concept And Graph Metrics

Slides: 11, 12, 13, 14

Metrics:
- Temporal F1
- CheXbert F1
- SRR-BERT F1
- RadGraph F1

Use for:
- Label-level comparison limits.
- Relation and negation handling.
- Dependence on labeler quality.
- Missing severity/location granularity in label-only approaches.

Dashboard conversion:
- Create small reference/candidate examples.
- Keep “labeler-dependent” as a caveat, not a verdict.

### 6. Embedding And Entity-Aware Similarity

Slides: 15, 16

Metrics:
- BERTScore
- RaTEscore

Use for:
- Word-level contextual similarity versus medical-entity-focused comparison.
- Example: right pneumothorax/no pleural effusion versus right pleural effusion/no pneumothorax.

Dashboard conversion:
- Rebuild as a two-row reference/candidate figure with highlighted entities.

### 7. LLM / Learned Evaluators

Slides: 17, 18, 19, 20

Metrics:
- GREEN
- CRIMSON

Use for:
- Error categories: false finding, omission, location error, severity error, false comparison/change, missing comparison/change.
- Context-aware and severity-weighted evaluation.
- CRIMSON-Local and CRIMSON-GPT5.2 as implementation variants.

Dashboard conversion:
- Use a structured error taxonomy card.
- Keep LLM-as-judge caveats explicit: calibration, model drift, prompt dependence, reproducibility.

### 8. Clinical Acceptance And Modality Expansion

Slides: 21, 22, 23

Use for:
- Human reader study framing.
- Recommended metric bundle for engineering papers versus clinical papers.
- Extension beyond CXR: CT, MRI, US, PET, modality-specific ontology, measurement, staging, longitudinal evaluation, image-grounded evaluation, workflow endpoint.

Dashboard conversion:
- Use as the closing recommendation section or future-work section.
- Keep claims tied to study context.

## Image Handling Rules

- Keep all extracted images under `images/` with checksum-prefixed names.
- Use `manifest.json` to recover which slide each image came from.
- Prefer raw icons only for curation; rebuild dashboard icons with existing app components or token-based SVG.
- Prefer extracted screenshots only as reference material; rebuild educational figures as React/SVG when feasible.
- For any image imported into app runtime, add alt text and verify dark/light theme fit.

## Immediate MVP After Extraction

One useful next artifact is a written topic spec, not code:

1. One-line thesis: clinical report generation metrics progress from surface overlap toward clinically meaningful error detection, but each metric misses different failure modes.
2. Novelty for this dashboard: interactive comparison of lexical, concept-label, graph/entity, and LLM-judge evaluation failure modes.
3. Existing overlap: BLEU/ROUGE/METEOR, CheXbert F1, RadGraph F1, BERTScore, GREEN/CRIMSON explanations already exist in papers and tools.
4. Minimal experiment: two reference/candidate report pairs where lexical overlap and clinical correctness rank candidates differently.
5. Highest risk: true metric computation may require external labelers or LLM judges that are not deterministic enough for the static app.
6. Most important experiment: implement a toy pure engine for negation/laterality/finding extraction and verify it supports a rank-flip scenario.
7. Expansion: add real CheXbert/RadGraph/GREEN outputs only as precomputed examples if licensing and reproducibility are clear.
```

- [ ] **Step 2: Verify curation map references extracted slides and avoids app-runtime claims**

Run:

```bash
/Users/kyh/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 - <<'PY'
from pathlib import Path

curation = Path("docs/extracted/clinical-report-generation-metrics/curation.md").read_text(encoding="utf-8")
slides = sorted(Path("docs/extracted/clinical-report-generation-metrics/slides").glob("slide-*.md"))

for number in range(1, 24):
    assert f"{number}" in curation, f"slide number {number} missing from curation"

assert "This file organizes extracted PPTX material into teaching units" in curation
assert len(slides) == 23, len(slides)
print("verified: curation references the 23-slide extraction bundle")
PY
```

Expected:

```text
verified: curation references the 23-slide extraction bundle
```

- [ ] **Step 3: Commit curation map**

Run:

```bash
git add docs/extracted/clinical-report-generation-metrics/curation.md
git commit -m "docs: curate clinical report metric source deck"
```

Expected: a commit containing only the curation map.

---

### Task 4: Add Reproduction Notes

**Files:**
- Create: `docs/extracted/clinical-report-generation-metrics/README.md`

- [ ] **Step 1: Write the extraction README**

Create `docs/extracted/clinical-report-generation-metrics/README.md`:

```markdown
# Clinical Report Generation Metrics Extraction

This directory contains extracted source material from:

`/Users/kyh/Downloads/Clinical_Report_Generation_Metrics.pptx`

## Contents

- `manifest.json`: slide count, media count, slide titles, slide-image links.
- `slides/slide-XX.md`: extracted text runs and linked images per slide.
- `images/index.json`: image inventory with dimensions, byte sizes, and checksums.
- `images/<sha12>-<original-name>`: raw images copied from the PPTX package.
- `curation.md`: human organization map for future topic planning.

## Reproduce

Run from repository root:

```bash
/Users/kyh/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 tools/extract_clinical_report_generation_pptx.py \
  --source /Users/kyh/Downloads/Clinical_Report_Generation_Metrics.pptx \
  --out docs/extracted/clinical-report-generation-metrics
```

Then verify:

```bash
/Users/kyh/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 tools/extract_clinical_report_generation_pptx_test.py
/Users/kyh/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 - <<'PY'
import json
from pathlib import Path

root = Path("docs/extracted/clinical-report-generation-metrics")
manifest = json.loads((root / "manifest.json").read_text(encoding="utf-8"))
assert manifest["slide_count"] == 23
assert manifest["media_count"] == 60
print("verified extraction bundle")
PY
```

## Dashboard Import Rule

Do not import this directory directly into app runtime. Treat it as source evidence.

When this material becomes a dashboard topic:

- Put topic code under `src/topics/report-generation/`.
- Add pure metric logic under `src/engine/metrics/` only for deterministic toy metrics.
- Rebuild figures as React/SVG using `src/styles/tokens.css`.
- Preserve Korean as default language and add English parity.
- Avoid absolute grade verdicts such as `좋음`, `나쁨`, `우수`, `열등`, `good`, or `bad`.
```

- [ ] **Step 2: Verify README commands and forbidden runtime import warning**

Run:

```bash
/Users/kyh/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 - <<'PY'
from pathlib import Path

readme = Path("docs/extracted/clinical-report-generation-metrics/README.md").read_text(encoding="utf-8")
assert "Do not import this directory directly into app runtime" in readme
assert "src/topics/report-generation/" in readme
assert "tokens.css" in readme
print("verified extraction README")
PY
```

Expected:

```text
verified extraction README
```

- [ ] **Step 3: Commit README**

Run:

```bash
git add docs/extracted/clinical-report-generation-metrics/README.md
git commit -m "docs: document clinical report extraction bundle"
```

Expected: a commit containing only the extraction README.

---

### Task 5: Final Verification

**Files:**
- Verify: `tools/extract_clinical_report_generation_pptx.py`
- Verify: `tools/extract_clinical_report_generation_pptx_test.py`
- Verify: `docs/extracted/clinical-report-generation-metrics/**`

- [ ] **Step 1: Run extractor unit tests**

Run:

```bash
/Users/kyh/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 tools/extract_clinical_report_generation_pptx_test.py
```

Expected:

```text
..
----------------------------------------------------------------------
Ran 2 tests

OK
```

- [ ] **Step 2: Run extraction count verification**

Run:

```bash
/Users/kyh/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 - <<'PY'
import json
from pathlib import Path

root = Path("docs/extracted/clinical-report-generation-metrics")
manifest = json.loads((root / "manifest.json").read_text(encoding="utf-8"))
image_index = json.loads((root / "images" / "index.json").read_text(encoding="utf-8"))
slide_files = sorted((root / "slides").glob("slide-*.md"))

assert manifest["source"] == "/Users/kyh/Downloads/Clinical_Report_Generation_Metrics.pptx"
assert manifest["slide_count"] == 23
assert manifest["media_count"] == 60
assert len(image_index["images"]) == 60
assert len(slide_files) == 23
assert (root / "curation.md").exists()
assert (root / "README.md").exists()

print("verified final extraction bundle")
PY
```

Expected:

```text
verified final extraction bundle
```

- [ ] **Step 3: Check repository status**

Run:

```bash
git status --short
```

Expected: no uncommitted files from this plan.

---

## Self-Review

- Spec coverage: The plan extracts PPTX text, images, slide-image links, image metadata, curation grouping, and reproduction notes. It explicitly excludes dashboard topic implementation.
- Placeholder scan: No task contains unresolved placeholders. Every command has an expected output.
- Type consistency: The test imports `extract_pptx` and `safe_media_name`; both are defined in the extractor with matching names. JSON keys used in verification match the extractor output.
