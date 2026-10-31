# Decision Lab integration verification — October 31, 2026

Compared PR #1 (`c1a5126`) to `main` (`b0ff49d`) and reran its original 61 backend tests, 3 frontend tests and combined build. The original PR registered the lab on the full Flask server and shipped its UI in the normal build. This was unsuitable for merging as-is: the repository's existing Docker setup can route that server publicly. The revised lab is built separately and served only by the standalone loopback runner on port 5002. No deploy, release, container publication, paid call or real model execution was part of verification.

| Boundary | Observed on the revised implementation |
|---|---|
| Ordinary MiroFish | Clean production frontend output matched a separate build of `b0ff49d` **byte for byte**. No lab HTML, assets, or navigation in that build. All **65** Flask route/method/endpoint definitions matched the base. Health, graph project list, simulation list and report list returned 200 using the JSON backend. The original Twitter profile tests passed. No end-to-end paid or graph/social inference was attempted. |
| Access boundary | Full app: lab page, HTML and capabilities returned 404; POST could not run a study. Standalone: unexpected Host rejected (400), remote peer rejected (403), spoofed forwarding header had no effect, cross-origin study rejected, original graph API unavailable. GitHub Pages was disabled; the existing Docker publication workflow triggers on a tag or manual dispatch, not a main-branch push. |
| Automated tests and builds | **65 backend tests** passed in an isolated environment with only the lab test requirements. **3 frontend unit tests** passed. Both independent builds passed; the original frontend retained its existing `pendingUpload.js` warning. Original AGPL-3.0 LICENSE blob was unchanged. |
| Browser and API | Chromium at **320, 360, 390, 768, 1024 and 1440 CSS px**. Touch emulation through 768 px; mouse at desktop sizes. Actual localhost HTTP requests and rendered counts agreed: artwork A/B/none **2/1/3**; after raising A's price **0/2/4**; three-option product A/B/C/none **4/2/0/0**. Six explanations, zero people and no live model. Results received focus and scrolled into view on mobile. |
| Layout and input | Expanded reasoning and methodology, added and removed a third option, cleared and reran studies. No horizontal overflow at the six widths, including a 100-character unbroken option title at 320 px after fixing label wrapping. No browser console errors or off-device HTTP requests in these runs. |
| File selection | Activated Chromium file inputs with touch (390 px) and mouse (1440 px), then supplied files via the file-chooser automation API. Valid PNG decoded as a blob preview; SVG rejected. Valid UTF-8 text appeared in notes; malformed text rejected. File selection itself made no POST. Only the note contents went into the run; image data, blob URLs and filenames were absent from requests and downloads. |
| Downloads and privacy | Opened actual JSON, CSV and text downloads at both sizes: JSON matched the API response; CSV had six synthetic response rows; text retained limitations and human validation steps. Changing price removed the stale exports. Clear removed the study and results. Browser storage state showed no cookies or local storage. API responses were no-store. |
| Optional model boundary | Mock transport only: exact loopback completions URL, bounded calls, no redirects/retries, and ambient SDK organization, project and custom headers stripped before transmission. Invalid/nested inputs and invalid model output fail without a partial report. |

**Reproduce:** use the [local run and test instructions](README.md). The optional browser regression lives in [decisionLab.browser.cjs](../../frontend/tests/decisionLab.browser.cjs); run it against the loopback launcher with Playwright and Chromium available. Verification used Python 3.12.14, Flask 3.1.3, Node 24.22.1, Vite 7.2.7, Playwright 1.62.1 and headless Chromium 153.

**Limits:** no physical phone or native Android/iOS picker, Safari/WebKit, screen-reader audit, production Docker rollout, external AI, live local model, or human research. All counts above are fixture checks, not estimates of consumer preferences. Hosting and real-model prerequisites are in the [guide](README.md).

---

## Historical: original draft verification — October 30, 2026

This section records the prior draft. Use the October 31 results and the current guide for the integrated implementation.

Story: define a study in the Vue Decision Lab → POST bounded JSON to Flask → evaluate six invented perspectives → show structured responses and synthetic counts → download the completed study.

Base: `main` at `b0ff49d` (existing MiroFish repository). Work is isolated on `codex/decision-lab-prototype`. No paid API calls, actual model inference, production deployment or merge was performed.

## Automated checks

| Check | Result |
|---|---|
| `python -m pytest backend/tests -q` | **61 passed**, including both pre-existing Twitter-profile tests |
| Same tests in a fresh environment installed only from `requirements-decision-lab-test.txt` | **61 passed**; no Kuzu/OASIS/social-simulation dependencies installed there |
| `node --test frontend/tests/*.test.js` | **3 passed** |
| `npm run build` | **Passed**, both original and dedicated Decision Lab HTML entries emitted |
| `git diff --check` | Passed |

The build retains the pre-existing warning that `pendingUpload.js` is imported both statically and dynamically. It does not prevent building. No lockfile dependency changes were required for the Vue interface.

Backend checks cover deterministic examples, option ordering, ties/abstention, changed prices, two/three alternatives, missing prices, no network in fixture mode, strict validation, oversized/malformed requests, origin controls, no-write behavior, ambient paid-provider isolation, loopback allowlisting, response validation, six-call rotation, failure redaction, run locking, bounded mock transport, SDK log suppression, original profile import compatibility and full-app route registration with request-body logging suppressed.

Frontend unit tests cover formula-safe CSV cells, provenance in CSV/text reports and isolated preset state. These are meaningful export/data-contract checks, not substitutes for browser interaction.

## Browser checks

A self-contained QA package of the same standalone backend, built frontend and minimum Flask dependencies ran through the managed preview. Initial attempts failed because the preview mounts only its project root; packaging the required files within that root resolved it. Application source was not changed to bypass the isolation. The successful preview used no model configuration.

| Boundary / action | Observed result |
|---|---|
| Initial desktop page | Complete form, visible synthetic notice and disabled Local AI choice |
| Artwork form → API → rendered comparison | A **2**, B **1**, none **3**; six invented perspectives, zero real participants |
| Expand Design explorer | Per-option appeal/concern and explicit rule-generation explanation visible |
| Change A price from 30 to 1,000 | Old result disappeared before rerun; new counts A **0**, B **2**, none **4** |
| Product example with three alternatives | A **4**, B **2**, C **0**, none **0**; all six explanations available |
| JSON button | Actual browser download parsed; complete study, six responses, null confidence and zero humans confirmed |
| CSV button | Actual browser download parsed; header plus six response rows, each labeled synthetic |
| Text report button | Actual browser download read; limitations and real-world validation plan present |
| Clear session | Text fields and alternatives cleared; previous results removed |
| Restore Artwork and rerun | Expected **2 / 1 / 3** counts restored |

[Desktop screenshot](preview.jpg) · [Actual controlled browser JSON export](example-result.json)

The browser log sample contained extension metadata errors, not errors from this application. No application failure was observed in the exercised flows.

## Scope of evidence and remaining requirements

- **Rules-mode end-to-end flow is verified.** The counts above are implementation checks, not consumer findings or model accuracy measurements.
- **Real local-model inference is unverified and disabled.** An operator-supplied, locally running compatible model and the three documented `DECISION_LAB_*` variables are required. SDK construction, request shape, limits and output schema were tested with a mock transport, not an actual model. No inference credentials were used.
- Full original MiroFish blueprint registration, health and existing tests passed. Its paid/CLI/graph/social-simulation workflows were not executed end to end and are not represented as production-verified by this change.
- Desktop browser flows and a responsive CSS implementation are present. A physical mobile device, touch behavior, screen-reader audit and file-picker uploads have not been tested in a browser.
- No public or production hosting was configured. Use the exact [startup instructions](README.md#run-the-no-key-prototype). The managed QA preview is temporary and is not a deployment.
- No human study, held-out validation or purchase data exists. All statistical validity and predictive accuracy claims remain unavailable.
