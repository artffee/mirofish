# MiroFish Decision Lab — first prototype

Modified October 30, 2026. This addition is licensed under the repository's existing **AGPL-3.0** license. It adds an isolated `/decision-lab` workflow; it does not replace MiroFish's graph, social-media simulation or reporting workflows.

Decision Lab compares two or three alternatives for a stated audience, business question and scenario. It returns six structured synthetic perspectives, per-alternative explanations, count bars, an explicit abstention option, and downloadable JSON, CSV and text reports.

**This is not customer research.** It has no human validation, measured confidence, purchase probability, revenue forecast or population representativeness. The runnable default is a transparent rules demonstration, not live AI. It is suitable for exercising the workflow and developing hypotheses, not choosing a business strategy on its own.

## Run the no-key prototype

Requirements: Python 3.11 or 3.12, Node.js 20.19+ or 22.12+ (Vite 7), and npm. Install commands need package-registry access. No graph database, OASIS package, model, account or API key is needed.

From the repository root:

```bash
git switch codex/decision-lab-prototype
python3 -m venv .venv
. .venv/bin/activate
python -m pip install -r backend/requirements-decision-lab.txt
npm --prefix frontend ci
npm run build
python backend/run_decision_lab.py
```

Open **http://127.0.0.1:5001/decision-lab**. The server binds to loopback with debug and reloading disabled. The standalone server exposes only the new API and the built Vue application. It does not expose the original upload or simulation APIs.

On Windows, activate with `.venv\Scripts\activate` instead of the `.` command. Use `python` instead of `python3` when appropriate.

For frontend editing, leave that backend running and use `npm --prefix frontend run dev` in a second terminal. Open the Vite URL at `/decision-lab`. The dedicated proxy preserves Host for the endpoint's same-origin check. Do not change its `changeOrigin` to true.

For an already configured full MiroFish installation, the existing `npm run dev` workflow remains available. The homepage now links to Decision Lab, and the full Flask app registers `/api/decision-lab` alongside its existing blueprints. Original MiroFish operations retain their original provider configuration and may incur their original provider costs; the new lab's rules endpoint does not invoke them.

## Try it

1. Choose Artwork, Product, Ad message or Price; all are explicitly controlled examples.
2. Edit the audience, question and concrete scenario.
3. Describe two or three alternatives. Assign attributes yourself and optionally enter USD prices. Set an assumed base budget.
4. Run the rules demo and expand an individual response. The Artwork example returns A: 2, B: 1, none: 3.
5. Change A's price to 1,000 and rerun. Its rule-generated count becomes zero. This tests the implementation, not actual price sensitivity.
6. Download JSON for the complete study, panel assumptions and responses; CSV for individual choices; or a readable `.txt` report.

Editing inputs removes the previous result, preventing downloads of a stale comparison. Clear session removes current inputs, images and results. Refreshing also discards in-memory state. Downloaded files are under the user's control and remain on their device.

## Two modes, kept distinct

| Mode | What runs | Inputs affecting decisions | What the output means |
|---|---|---|---|
| Rules demo (default) | Deterministic, inspectable rules over six invented lenses | Assigned feature tags, optional price and assumed budget | Template responses exercising the product workflow; **not AI-generated analysis** |
| Local AI (optional, disabled) | Existing MiroFish `LLMClient` against an explicitly configured local OpenAI-compatible server | Audience, question, scenario, descriptions, attributes, prices, notes and invented perspective | **AI-generated opinions**, unvalidated and potentially biased or inaccurate |

The six profiles reuse the existing `OasisAgentProfile` contract. That dataclass was moved to a lightweight shared model with its old import path retained. Neither the heavyweight graph extraction pipeline nor the OASIS social-media loop is needed for independent consumer comparisons. Persona-generation calls are intentionally not used: fixed, inspectable lenses make this small prototype testable and avoid external inference costs. Agents do not deliberate or interact with each other in this version.

Each lens assigns weights to particular features and has a budget multiplier, all visible in the interface and exports. In rules mode, matching tags add their weight; price above the lens's budget subtracts four. A unique positive maximum selects an alternative. Ties or non-positive maxima produce `none`. A missing price receives no penalty and is identified as unknown. These weights, penalties and budgets are invented assumptions, not fitted behavioral measurements.

**Rules mode does not interpret free text, audience wording, reference notes or images.** It would be misleading to present a changed question as new AI analysis. Images are never analyzed in either mode.

## Optional local AI execution requirements

A real local-model run has **not** been performed as part of this change. The adapter has been verified with an in-process mock of the SDK transport and structured responses. To run inference, the operator must supply a locally hosted, already available model capable of JSON responses at a compatible `/v1/chat/completions` endpoint.

Install the optional client dependencies in the same virtual environment:

```bash
python -m pip install 'python-dotenv>=1,<2' 'openai>=1,<3'
```

Set these variables in the shell **before starting the backend** (replace the model name with one actually loaded locally):

```bash
export DECISION_LAB_ENABLE_LOCAL_LLM=1
export DECISION_LAB_LOCAL_URL=http://127.0.0.1:11434/v1
export DECISION_LAB_LOCAL_MODEL=your-already-installed-local-model
python backend/run_decision_lab.py
```

No model is downloaded or started automatically. Do not point this address at a proxy that forwards to a paid or cloud model. The application restricts the first hop to numeric IPv4 loopback HTTP, a non-privileged explicit port and the exact `/v1` path. The operator is responsible for what the service at that local address does and for its logging/retention policy. Raw CLI providers, remote URLs, ambient API keys, environment proxies and redirects are not used by the lab adapter.

The UI enables Local AI only after the backend reports valid explicit configuration. It makes at most six sequential calls per run, each with a 1,100 output-token cap, 20-second network-operation timeouts and zero automatic retries. One model run is allowed at a time per Python process. Invalid or partial output fails the whole run with a generic error; it is never silently replaced by fixture results. The browser times out at 140 seconds; server inference may finish after a browser disconnect. Model throughput and HTTP operation timing determine actual duration.

Response schemas allow only choices, reasons, tradeoffs, follow-up questions and per-option appeals/concerns. Numeric aggregates are computed in application code. No confidence or success score is accepted from the model. Canonical option ordering is rotated across perspectives; this reduces a simple position artifact but does not validate the model or guarantee reproducibility.

## Information handling

- Inputs and results exist only in request/browser memory. This module writes no studies, prompts, results, uploaded files or session records to disk, databases or browser storage.
- The body is JSON only, at most 64 KiB, with field limits and strict accepted fields. Files, provider configuration and credentials are rejected at the API boundary.
- Text imports are UTF-8 `.txt`, at most 12 KB and 6,000 characters, read in the browser. Their contents are transmitted on Run, and to the local model only in Local AI mode. Do not use confidential or personal information in this prototype.
- PNG/JPEG/WebP previews are capped at 5 MB and decoded locally. Blob URLs are released on removal, reset and unmount. Image bytes and filenames are excluded from study requests and reports; no image-processing provider is contacted.
- Lab API responses use `Cache-Control: no-store`. Its dedicated HTML entry has no external fonts or analytics. The standalone server adds a restrictive CSP and no-referrer header. Ordinary server access logs can still contain routes, timestamps and client addresses.
- Full MiroFish's debug request-body logger explicitly skips this namespace. Provider exception details are not echoed or logged by the endpoint. SDK request-body debug messages are suppressed in the lab's inference context. Operators must separately control local model, reverse-proxy, infrastructure or monitoring logs.
- Model content is untrusted data. The UI uses escaped Vue interpolation, never model-provided HTML. Prompts separate instructions from study data, no tools are exposed, and outputs are validated. These measures do not make prompt injection or model bias impossible.
- CSV cells neutralize formula prefixes, including leading whitespace, and quote multiline text. JSON and plain-text exports retain complete labels and provenance. Exported files may contain the study text; share them deliberately.
- This is a **local single-user prototype without authentication**, not a public SaaS deployment. Same-origin JSON checks prevent simple cross-site submissions; they are not authentication. Before remote multi-user use, add access control, TLS, per-user quotas, lifecycle controls and a reviewed privacy/retention policy. Existing MiroFish upload behavior outside this namespace is unchanged and is not claimed to meet these guarantees.

## API and validation

`GET /api/decision-lab/capabilities` reports allowed attributes and whether local AI is configured.

`POST /api/decision-lab/run` requires `Content-Type: application/json` and `X-Decision-Lab: 1`. Cross-origin browser POSTs are rejected. See [`example-study.json`](example-study.json) for the complete schema:

```bash
curl http://127.0.0.1:5001/api/decision-lab/run \
  -H 'Content-Type: application/json' -H 'X-Decision-Lab: 1' \
  --data-binary @docs/decision-lab/example-study.json
```

JSON results contain a schema version, content-derived run identifier, creation timestamp, input snapshot, full invented panel, structured responses, counts, methodological limitations and a real-world validation plan. `confidence` and `predictive_accuracy` are explicitly null; human participant count is zero. `share_of_synthetic_panel` is only arithmetic over those six agents, never a population estimate. The UI primarily shows counts to avoid false precision.

## Tests

With the virtual environment activated:

```bash
python -m pip install -r backend/requirements-decision-lab-test.txt
python -m pytest backend/tests -q
node --test frontend/tests/*.test.js
npm run build
```

See [`VERIFICATION.md`](VERIFICATION.md) for actual results and unverified boundaries. No model credentials are needed for the test suite. The adapter test uses an in-process mock transport and makes no inference or external network requests.

## Source, license and references

The original `LICENSE` and notices are retained. The UI provides a prominent source link to this branch. Keep that link pointed at the corresponding source of any deployed modified version, including build instructions. AGPL-3.0 permits commercial use subject to its terms; its network-interaction provisions matter for a modified hosted service. This implementation does not convert the project to a proprietary license.

- [Repository license](../../LICENSE)
- [GNU AGPL-3.0](https://www.gnu.org/licenses/agpl-3.0.html), particularly sections 5 and 13
- [GNU FAQ on modified network software](https://www.gnu.org/licenses/gpl-faq.html#UnreleasedModsAGPL)
- [Craze documentation](https://crazed.ai/docs): product-workflow reference, not a source of validation for this prototype
- [Scenario](https://crazed.ai/docs/scenario), [action space](https://crazed.ai/docs/action-space), [confidence](https://crazed.ai/docs/confidence), [validation](https://crazed.ai/docs/validation)

No Craze software, private datasets, population model or branding was copied. Its documented workflow informed the separation of audience, scenario, question, choices and validation. This prototype makes no claim to reproduce Craze's quality or performance.
