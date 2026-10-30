# Verification — October 30, 2026

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
