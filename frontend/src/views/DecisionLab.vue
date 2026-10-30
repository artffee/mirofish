<template>
  <div class="decision-lab">
    <a class="skip-link" href="#study">Skip to study</a>
    <header class="lab-header">
      <a class="brand" href="/decision-lab"
        ><span class="brand-icon" aria-hidden="true">M</span
        ><span>MIROFISH <b>Decision Lab</b></span></a
      >
      <nav aria-label="Lab navigation">
        <RouterLink v-if="!standalone" to="/">MiroFish home ↗</RouterLink
        ><span v-else>Standalone prototype</span
        ><a
          href="https://github.com/artffee/mirofish/tree/codex/decision-lab-prototype"
          target="_blank"
          rel="noopener noreferrer"
          >Source · AGPL-3.0 ↗</a
        >
      </nav>
    </header>
    <main>
      <section class="lab-intro">
        <div>
          <p class="eyebrow">A SMALL SANDBOX FOR BIG QUESTIONS</p>
          <h1>Explore the choice.<br /><em>Then test it with people.</em></h1>
          <p class="intro-copy">
            Put two or three ideas in front of six invented perspectives.
            Inspect their assumptions, compare responses, and find better
            questions to ask real customers.
          </p>
        </div>
        <aside class="mode-card">
          <span class="status-dot"></span
          ><strong>{{
            form.mode === "fixture" ? "Rules demo" : "Local AI mode"
          }}</strong>
          <p>
            {{
              form.mode === "fixture"
                ? "Repeatable examples. No AI calls, API keys or usage charges."
                : "AI-generated opinions from your configured local model. No human participants."
            }}
          </p>
          <span class="small">Private session · no saved studies</span>
        </aside>
      </section>
      <div class="notice">
        <span aria-hidden="true">ⓘ</span>
        <p>
          <strong>Synthetic responses, not customer research.</strong> No
          measured confidence or purchase predictions. These six perspectives do
          not represent your audience.
        </p>
      </div>
      <div class="workspace">
        <section id="study" class="study-panel">
          <div class="panel-heading">
            <div>
              <p class="eyebrow">01 / SET UP</p>
              <h2>Your decision</h2>
            </div>
            <button
              class="text-button"
              type="button"
              @click="clearStudy"
              :disabled="busy"
            >
              Clear session
            </button>
          </div>
          <form @submit.prevent="runStudy">
            <fieldset :disabled="busy">
              <legend class="sr-only">Study setup</legend>
              <p class="field-title">Start with a controlled example</p>
              <div class="example-tabs">
                <button
                  v-for="(example, key) in examples"
                  :key="key"
                  type="button"
                  :class="{ active: selectedExample === key }"
                  @click="loadExample(key)"
                >
                  {{ example.label }}
                </button>
              </div>
              <label for="audience">Target audience</label
              ><textarea
                id="audience"
                v-model="form.audience"
                required
                maxlength="700"
                rows="2"
                placeholder="Who is facing this decision?"
              />
              <label for="question">Business question</label
              ><textarea
                id="question"
                v-model="form.question"
                required
                maxlength="700"
                rows="2"
                placeholder="What would you like to compare?"
              />
              <label for="scenario"
                >Scenario <span>Keep it concrete and neutral</span></label
              ><textarea
                id="scenario"
                v-model="form.scenario"
                required
                maxlength="1400"
                rows="3"
                placeholder="Where are they, and what do they see?"
              />
              <div class="pair-fields">
                <div>
                  <label for="budget">Assumed base budget (USD)</label
                  ><input
                    id="budget"
                    v-model.number="form.budget"
                    type="number"
                    min="0.01"
                    max="100000"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <label for="mode">Response engine</label
                  ><select id="mode" v-model="form.mode">
                    <option value="fixture">Rules demo · no AI calls</option>
                    <option value="local_llm" :disabled="!localEnabled">
                      Local AI {{ localEnabled ? "" : "· not configured" }}
                    </option>
                  </select>
                </div>
              </div>
              <p class="hint" v-if="form.mode === 'fixture'">
                This demo uses only assigned attributes and prices. Audience,
                question, scenario and notes are recorded but do not change its
                choices. Use local AI to interpret text.
              </p>
              <p class="hint" v-else>
                Text is sent to your locally configured model. Six bounded
                calls; no tools or cloud-provider fallback. Local server logging
                is controlled by its operator.
              </p>
              <div class="alternatives-heading">
                <h3>
                  Alternatives <span>{{ form.alternatives.length }} / 3</span>
                </h3>
                <button
                  v-if="form.alternatives.length < 3"
                  class="text-button"
                  type="button"
                  @click="addAlternative"
                >
                  + Add third
                </button>
              </div>
              <article
                v-for="option in form.alternatives"
                :key="option.id"
                class="alternative"
              >
                <div class="alternative-heading">
                  <span class="letter" :class="'option-' + option.id">{{
                    option.id
                  }}</span
                  ><strong>Alternative {{ option.id }}</strong
                  ><button
                    v-if="form.alternatives.length > 2"
                    type="button"
                    class="text-button"
                    @click="removeAlternative(option.id)"
                    :aria-label="'Remove alternative ' + option.id"
                  >
                    Remove
                  </button>
                </div>
                <label :for="'title-' + option.id">Name</label
                ><input
                  :id="'title-' + option.id"
                  v-model="option.title"
                  required
                  maxlength="100"
                />
                <label :for="'description-' + option.id"
                  >Description or message</label
                ><textarea
                  :id="'description-' + option.id"
                  v-model="option.description"
                  required
                  maxlength="1200"
                  rows="3"
                />
                <label :for="'price-' + option.id"
                  >Price (USD) <span>Optional</span></label
                ><input
                  :id="'price-' + option.id"
                  v-model="option.price"
                  type="number"
                  min="0"
                  max="100000"
                  step="0.01"
                  placeholder="Not applicable"
                />
                <p class="field-title attributes-label">
                  Assigned attributes <span>Assumptions you choose</span>
                </p>
                <div class="feature-tags">
                  <label v-for="(label, key) in featureLabels" :key="key"
                    ><input
                      type="checkbox"
                      v-model="option.features"
                      :value="key"
                    />{{ label }}</label
                  >
                </div>
                <details class="image-details">
                  <summary>Attach a private image preview</summary>
                  <p class="hint">
                    PNG, JPEG or WebP, up to 5 MB. Stays in this browser tab;
                    never sent, analyzed or included in exports. Describe the
                    design above.
                  </p>
                  <label :for="'image-' + option.id" class="sr-only"
                    >Image preview for {{ option.id }}</label
                  ><input
                    :id="'image-' + option.id"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    @change="attachImage($event, option.id)"
                  />
                  <div v-if="images[option.id]" class="image-preview">
                    <img
                      :src="images[option.id]"
                      :alt="'Private reference for alternative ' + option.id"
                    /><button
                      type="button"
                      class="text-button"
                      @click="removeImage(option.id)"
                    >
                      Remove image
                    </button>
                  </div>
                </details>
              </article>
              <p class="hint none-note">
                “None / no clear preference” is always available to every
                perspective.
              </p>
              <details class="reference-notes">
                <summary>Optional reference notes</summary>
                <label for="context"
                  >Non-sensitive context
                  <span>Up to 6,000 characters</span></label
                ><textarea
                  id="context"
                  v-model="form.context"
                  maxlength="6000"
                  rows="4"
                  placeholder="A short product brief, assumptions or constraints. Avoid personal or confidential information."
                /><label for="notes-file"
                  >Read a local .txt file (up to 12 KB)</label
                ><input
                  id="notes-file"
                  type="file"
                  accept=".txt,text/plain"
                  @change="attachNotes"
                />
                <p class="hint">
                  Text is held in memory, sent to this server when you run, and
                  included in downloads. It is not saved by Decision Lab. Local
                  AI also receives these notes.
                </p>
              </details>
              <button
                class="run-button"
                type="submit"
                :disabled="!apiReady || busy"
              >
                {{
                  busy
                    ? "Running six perspectives…"
                    : "Run synthetic comparison"
                }}
                <span aria-hidden="true">↗</span>
              </button>
            </fieldset>
          </form>
          <p v-if="error" class="error" role="alert">{{ error }}</p>
          <p v-if="busy" class="hint" role="status">
            {{
              form.mode === "fixture"
                ? "Applying the transparent comparison rules…"
                : "Waiting for the local model. This may take up to two minutes."
            }}
          </p>
          <p class="privacy-note">
            No account, database, analytics or browser storage. Clear this
            session to remove inputs and results. Downloads remain on your
            device.
          </p>
        </section>
        <section
          ref="resultsSection"
          class="results-panel"
          aria-live="polite"
          :aria-busy="busy"
          tabindex="-1"
        >
          <div class="panel-heading">
            <div>
              <p class="eyebrow">02 / INSPECT</p>
              <h2>
                {{
                  result
                    ? "The synthetic comparison"
                    : "Your comparison starts here"
                }}
              </h2>
            </div>
            <span class="prototype-tag">PROTOTYPE</span>
          </div>
          <template v-if="result">
            <div class="result-meta">
              <span><strong>6</strong> invented perspectives</span
              ><span><strong>0</strong> real participants</span
              ><span
                >Human validation<br /><strong class="unvalidated"
                  >Not performed</strong
                ></span
              >
            </div>
            <div class="chart-heading">
              <h3>Choices in this run</h3>
              <span>Counts, not market shares</span>
            </div>
            <div
              class="comparison-chart"
              role="img"
              :aria-label="chartDescription"
            >
              <div
                v-for="item in result.comparison"
                :key="item.id"
                class="chart-row"
              >
                <div class="chart-label">
                  <span>{{ item.title }}</span
                  ><strong>{{ item.count }} <small>/ 6</small></strong>
                </div>
                <div class="bar-track">
                  <div
                    class="bar-fill"
                    :class="'option-' + item.id"
                    :style="{ width: (item.count / 6) * 100 + '%' }"
                  />
                </div>
              </div>
            </div>
            <p class="chart-caption">
              {{ leadingText }} This is a description of this synthetic run, not
              a recommended business decision.
            </p>
            <div class="export-row">
              <span>Download this run</span
              ><button type="button" @click="downloadReport(result, 'json')">
                JSON</button
              ><button type="button" @click="downloadReport(result, 'csv')">
                CSV</button
              ><button type="button" @click="downloadReport(result, 'txt')">
                Report .txt
              </button>
            </div>
            <div class="responses-heading">
              <h3>Read the reasoning</h3>
              <p>
                Each response is
                {{
                  result.method.mode === "fixture"
                    ? "a rule-generated template"
                    : "AI-generated"
                }}
                from an invented perspective.
              </p>
            </div>
            <details
              v-for="response in result.responses"
              :key="response.agent_id"
              class="agent-response"
            >
              <summary>
                <span class="avatar" aria-hidden="true">{{
                  response.agent_id + 1
                }}</span
                ><span>{{
                  result.panel.find(
                    (p) => p.profile.user_id === response.agent_id,
                  )?.profile.name
                }}</span
                ><span class="choice-tag">{{
                  response.choice === "none"
                    ? "No preference"
                    : "Option " + response.choice
                }}</span>
              </summary>
              <div class="response-body">
                <p>{{ response.reason }}</p>
                <p class="hint">{{ response.tradeoff }}</p>
                <div
                  v-for="evaluation in response.evaluations"
                  :key="evaluation.alternative_id"
                  class="evaluation"
                >
                  <strong>Option {{ evaluation.alternative_id }}</strong>
                  <p>{{ evaluation.appeal }}</p>
                  <p>{{ evaluation.concern }}</p>
                </div>
                <p class="follow-up">
                  <strong>Ask a real person:</strong> {{ response.follow_up }}
                </p>
              </div>
            </details>
            <section class="validation-plan">
              <p class="eyebrow">03 / LEARN IN THE REAL WORLD</p>
              <h3>Turn hypotheses into a test</h3>
              <ol>
                <li v-for="step in result.next_steps" :key="step">
                  {{ step }}
                </li>
              </ol>
            </section>
          </template>
          <div v-else class="empty-result">
            <div class="empty-art" aria-hidden="true">
              <span>A</span><span>B</span><span>?</span>
            </div>
            <h3>Two ideas. Different perspectives.</h3>
            <p>
              Start with an example or describe your own alternatives. You’ll
              get a comparison, individual explanations and a downloadable study
              record.
            </p>
            <div class="empty-checks">
              <span>✓ Two or three alternatives</span
              ><span>✓ Six visible assumptions</span
              ><span>✓ Always a way to say “none”</span>
            </div>
          </div>
          <details class="methodology">
            <summary>Method, assumptions & limitations</summary>
            <div class="method-body">
              <p>
                Six fixed, invented perspectives share the same audience
                description. They are not sampled customers and have no
                demographic representativeness.
              </p>
              <p>
                <strong>Rules demo:</strong> Each assigned matching attribute
                adds the weight below. A price above the invented budget limit
                subtracts 4 points. A unique positive total selects an option; a
                tie or non-positive total gives “none.” Unknown prices get no
                price penalty. Text and images do not affect this mode.
              </p>
              <table>
                <caption>
                  Invented panel assumptions, not research findings
                </caption>
                <thead>
                  <tr>
                    <th>Perspective</th>
                    <th>Attribute weights</th>
                    <th>Budget ×</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Value seeker</td>
                    <td>Value 3 · Practicality 1</td>
                    <td>0.75</td>
                  </tr>
                  <tr>
                    <td>Design explorer</td>
                    <td>Originality 3 · Premium finish 1</td>
                    <td>1.5</td>
                  </tr>
                  <tr>
                    <td>Minimalist</td>
                    <td>Simplicity 3 · Practicality 1</td>
                    <td>1</td>
                  </tr>
                  <tr>
                    <td>Local supporter</td>
                    <td>Local story 3 · Originality 1</td>
                    <td>1.25</td>
                  </tr>
                  <tr>
                    <td>Practical buyer</td>
                    <td>Practicality 3 · Value 1</td>
                    <td>1</td>
                  </tr>
                  <tr>
                    <td>Cautious buyer</td>
                    <td>Value 1 · Simplicity 1</td>
                    <td>0.75</td>
                  </tr>
                </tbody>
              </table>
              <p>
                <strong>Local AI:</strong> Uses these perspectives and your
                text, with rotated option ordering and validated structured
                responses. It may still invent reasons or reproduce bias. It is
                not guaranteed to be repeatable.
              </p>
              <p>
                There are no confidence scores, margins of error or purchase
                probabilities. Agreement between invented agents does not
                establish accuracy. No images are analyzed in either mode.
              </p>
              <p>
                Changes to inputs clear the previous result. Downloads contain
                the completed input snapshot and synthetic provenance; images
                are excluded.
              </p>
            </div>
          </details>
        </section>
      </div>
      <footer class="lab-footer">
        <span>MIROFISH / DECISION LAB</span
        ><span>Rehearse a question. Research the answer.</span>
      </footer>
    </main>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { examples, featureLabels, freshExample } from "../decisionLab/examples";
import { downloadReport } from "../decisionLab/reports";
const form = ref(freshExample("artwork"));
const selectedExample = ref("artwork");
const images = ref({});
const result = ref(null);
const resultsSection = ref(null);
const busy = ref(false);
const error = ref("");
const apiReady = ref(false);
const localEnabled = ref(false);
const standalone = ref(false);
let controller;
let sessionVersion = 0;
watch(
  form,
  () => {
    result.value = null;
  },
  { deep: true, flush: "sync" },
);
const chartDescription = computed(() =>
  result.value?.comparison
    .map((o) => `${o.title}: ${o.count} of 6 synthetic choices`)
    .join(". "),
);
const leadingText = computed(() => {
  const rows = result.value?.comparison || [];
  const largest = Math.max(...rows.map((r) => r.count));
  const leaders = rows.filter((r) => r.count === largest);
  return leaders.length > 1
    ? "This run has a tied highest count."
    : `${leaders[0]?.title} has the highest count in this run.`;
});
function removeImage(id) {
  if (images.value[id]) URL.revokeObjectURL(images.value[id]);
  delete images.value[id];
}
function releaseImages() {
  Object.keys(images.value).forEach(removeImage);
}
function loadExample(key) {
  sessionVersion++;
  releaseImages();
  selectedExample.value = key;
  form.value = freshExample(key);
  result.value = null;
  error.value = "";
}
function clearStudy() {
  sessionVersion++;
  releaseImages();
  selectedExample.value = "";
  error.value = "";
  result.value = null;
  form.value = {
    audience: "",
    question: "",
    scenario: "",
    budget: 35,
    context: "",
    mode: "fixture",
    alternatives: ["A", "B"].map((id) => ({
      id,
      title: "",
      description: "",
      price: null,
      features: [],
    })),
  };
  document
    .querySelectorAll(".decision-lab input[type=file]")
    .forEach((input) => {
      input.value = "";
    });
}
function addAlternative() {
  const id = ["A", "B", "C"].find(
    (id) => !form.value.alternatives.some((o) => o.id === id),
  );
  form.value.alternatives.push({
    id,
    title: "",
    description: "",
    price: null,
    features: [],
  });
}
function removeAlternative(id) {
  removeImage(id);
  form.value.alternatives = form.value.alternatives.filter((o) => o.id !== id);
}
async function attachImage(event, id) {
  const file = event.target.files[0];
  event.target.value = "";
  if (!file) return;
  error.value = "";
  if (
    !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
    file.size > 5 * 1024 * 1024
  ) {
    error.value = "Choose a PNG, JPEG or WebP image up to 5 MB.";
    return;
  }
  const version = sessionVersion;
  const url = URL.createObjectURL(file);
  const probe = new Image();
  probe.src = url;
  try {
    await probe.decode();
    if (
      version !== sessionVersion ||
      !form.value.alternatives.some((o) => o.id === id)
    ) {
      URL.revokeObjectURL(url);
      return;
    }
    removeImage(id);
    images.value[id] = url;
  } catch {
    URL.revokeObjectURL(url);
    error.value = "That file could not be read as an image.";
  }
}
async function attachNotes(event) {
  const file = event.target.files[0];
  event.target.value = "";
  if (!file) return;
  error.value = "";
  if (!file.name.toLowerCase().endsWith(".txt") || file.size > 12 * 1024) {
    error.value = "Choose a .txt file up to 12 KB.";
    return;
  }
  const version = sessionVersion;
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(
      await file.arrayBuffer(),
    );
    if (version !== sessionVersion) return;
    if (text.length > 6000 || text.includes("\0")) throw new Error();
    form.value.context = text;
  } catch {
    error.value =
      "Use a UTF-8 text file with at most 6,000 characters and no binary content.";
  }
}
async function runStudy() {
  if (busy.value) return;
  busy.value = true;
  error.value = "";
  result.value = null;
  controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 140000);
  const { label, ...study } = structuredClone(
    JSON.parse(JSON.stringify(form.value)),
  );
  study.alternatives = study.alternatives.map((o) => ({
    ...o,
    price: o.price === "" || o.price === null ? null : Number(o.price),
  }));
  try {
    const response = await fetch("/api/decision-lab/run", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", "X-Decision-Lab": "1" },
      body: JSON.stringify(study),
      signal: controller.signal,
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || "The study could not run.");
    result.value = body;
    resultsSection.value?.focus({ preventScroll: true });
    if (window.innerWidth < 950)
      resultsSection.value?.scrollIntoView({ behavior: "smooth" });
  } catch (failure) {
    error.value =
      failure.name === "AbortError"
        ? "The request timed out. No result is available. The local server may still be finishing its bounded run."
        : failure instanceof SyntaxError
          ? "The Decision Lab API is unavailable. Start the backend and try again."
          : failure.message;
  } finally {
    clearTimeout(timeout);
    busy.value = false;
  }
}
onMounted(async () => {
  try {
    const response = await fetch("/api/decision-lab/capabilities", {
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error();
    const capabilities = await response.json();
    standalone.value = capabilities.standalone === true;
    localEnabled.value = capabilities.local_llm_enabled === true;
    apiReady.value = true;
  } catch {
    error.value =
      "Decision Lab backend is unavailable. Start backend/run_decision_lab.py, then reload this page.";
  }
});
onBeforeUnmount(() => {
  sessionVersion++;
  controller?.abort();
  releaseImages();
});
</script>

<style scoped>
.decision-lab {
  --ink: #173c38;
  --teal: #1c6358;
  --muted: #61736b;
  --line: #d7dfd7;
  background: #f3f5ef;
  color: var(--ink);
  font-family:
    Inter,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
  font-size: 14px;
  line-height: 1.5;
  min-height: 100vh;
}
.lab-header {
  padding: 22px max(24px, calc((100vw - 1380px) / 2));
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--line);
  gap: 24px;
  background: #fafbf6;
}
.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  color: var(--ink);
  font-size: 13px;
  letter-spacing: 1.5px;
}
.brand b {
  display: block;
  font-size: 15px;
  letter-spacing: 0;
}
.brand-icon {
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: var(--ink);
  color: #dff0ba;
  width: 43px;
  height: 43px;
  font:
    italic 30px Georgia,
    serif;
}
.lab-header nav {
  display: flex;
  gap: 25px;
  font-size: 12px;
}
.lab-header a {
  color: var(--ink);
}
main {
  max-width: 1436px;
  margin: auto;
  padding: 44px 28px 22px;
}
.lab-intro {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 60px;
  margin-bottom: 30px;
}
.eyebrow {
  font-size: 10px;
  letter-spacing: 2px;
  font-weight: 800;
  color: var(--muted);
  margin: 0 0 12px;
}
h1 {
  font-size: clamp(33px, 3.5vw, 51px);
  line-height: 1.12;
  font-weight: 550;
  letter-spacing: -1.7px;
  margin-bottom: 19px;
}
h1 em {
  font-family: Georgia, serif;
  font-weight: 400;
  color: #567261;
}
.intro-copy {
  max-width: 660px;
  color: var(--muted);
  font-size: 15px;
  line-height: 1.7;
}
.mode-card {
  width: 245px;
  flex-shrink: 0;
  border: 1px solid var(--line);
  padding: 22px;
  border-radius: 14px;
  background: #e8efdf;
}
.mode-card strong {
  font-size: 14px;
}
.status-dot {
  display: inline-block;
  background: #438466;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 9px;
}
.mode-card p {
  font-size: 12px;
  margin: 12px 0;
  color: #455e50;
}
.small {
  font-size: 10px;
  color: #49624f;
}
.notice {
  display: flex;
  gap: 13px;
  align-items: center;
  padding: 14px 18px;
  border: 1px solid #d6dbc3;
  border-radius: 10px;
  background: #eef0df;
  margin-bottom: 28px;
  font-size: 12px;
  color: #4b563a;
}
.notice > span {
  font-size: 23px;
}
.notice strong {
  font-weight: 700;
}
.workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 25px;
  align-items: start;
}
.study-panel,
.results-panel {
  background: #fffef9;
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 27px;
  min-width: 0;
}
.panel-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}
.panel-heading .eyebrow {
  margin-bottom: 7px;
}
h2 {
  font-size: 21px;
  font-weight: 600;
  letter-spacing: -0.5px;
}
h3 {
  font-size: 15px;
  font-weight: 650;
}
.text-button {
  border: 0;
  background: none;
  color: var(--teal);
  cursor: pointer;
  font-size: 12px;
  font-weight: 650;
  padding: 8px 0;
}
fieldset {
  border: 0;
  min-width: 0;
}
label,
.field-title {
  display: block;
  font-size: 12px;
  font-weight: 650;
  margin: 18px 0 7px;
}
label span,
.field-title span {
  font-weight: 400;
  color: var(--muted);
  margin-left: 4px;
  font-size: 10px;
}
input:not([type="checkbox"]),
textarea,
select {
  display: block;
  width: 100%;
  background: #fff;
  border: 1px solid #c7d1c6;
  border-radius: 7px;
  padding: 11px 12px;
  color: var(--ink);
  font-family: inherit;
  font-size: 13px;
  line-height: 1.5;
}
textarea {
  resize: vertical;
  min-height: 65px;
}
input:focus,
textarea:focus,
select:focus,
button:focus-visible,
a:focus-visible,
summary:focus-visible {
  outline: 3px solid #8fb9a0;
  outline-offset: 2px;
}
.example-tabs {
  display: flex;
  gap: 7px;
  flex-wrap: wrap;
}
.example-tabs button {
  border: 1px solid var(--line);
  border-radius: 6px;
  background: #f5f6ef;
  padding: 8px 12px;
  font-size: 12px;
  cursor: pointer;
  color: var(--ink);
  min-height: 38px;
}
.example-tabs .active {
  background: var(--ink);
  color: #fff;
  border-color: var(--ink);
}
.pair-fields {
  display: grid;
  grid-template-columns: 1fr 1.1fr;
  gap: 14px;
}
.hint {
  font-size: 11px;
  line-height: 1.65;
  color: var(--muted);
  margin: 9px 0;
}
.alternatives-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid var(--line);
  margin: 23px 0 13px;
  padding-top: 20px;
}
.alternatives-heading h3 span {
  color: var(--muted);
  font-size: 11px;
  margin-left: 8px;
}
.alternative {
  padding: 18px;
  border: 1px solid var(--line);
  background: #fafbf6;
  border-radius: 10px;
  margin-bottom: 14px;
}
.alternative-heading {
  display: flex;
  align-items: center;
  gap: 10px;
}
.alternative-heading strong {
  font-size: 12px;
}
.alternative-heading button {
  margin-left: auto;
}
.letter {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  color: white;
  font-weight: 700;
}
.option-A {
  background: #2f7968;
}
.option-B {
  background: #bd7452;
}
.option-C {
  background: #637eaa;
}
.option-none {
  background: #8b9384;
}
.feature-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.feature-tags label {
  font-size: 10px;
  margin: 0;
  padding: 6px 8px;
  background: #fff;
  border: 1px solid #cbd7cc;
  border-radius: 5px;
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  font-weight: 400;
  min-height: 32px;
}
.feature-tags label:has(:checked) {
  background: #e3ecdc;
  border-color: #7d9c79;
}
.feature-tags input {
  accent-color: var(--teal);
  width: 13px;
  height: 13px;
}
.attributes-label {
  margin-top: 15px;
}
.image-details {
  border-top: 1px solid var(--line);
  padding-top: 12px;
  margin-top: 15px;
  font-size: 11px;
}
.image-details input {
  font-size: 11px;
}
.image-preview {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 12px;
}
.image-preview img {
  max-width: 140px;
  max-height: 130px;
  object-fit: contain;
  border-radius: 5px;
}
.none-note {
  background: #edf1e7;
  padding: 10px 12px;
  border-radius: 5px;
}
.reference-notes {
  margin: 18px 0;
  font-size: 12px;
}
summary {
  cursor: pointer;
}
.run-button {
  display: flex;
  justify-content: space-between;
  width: 100%;
  margin-top: 23px;
  background: var(--ink);
  color: white;
  padding: 15px 18px;
  border: 0;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.run-button:hover {
  background: var(--teal);
}
button:disabled,
fieldset:disabled {
  opacity: 0.6;
  cursor: wait;
}
.privacy-note {
  font-size: 10px;
  color: var(--muted);
  line-height: 1.65;
  margin-top: 14px;
}
.error {
  background: #fff0eb;
  color: #8e3020;
  padding: 13px;
  margin-top: 13px;
  border-radius: 6px;
  border: 1px solid #eac5b7;
  font-size: 12px;
}
.prototype-tag {
  font-size: 8px;
  letter-spacing: 1px;
  border: 1px solid var(--line);
  padding: 5px 7px;
  border-radius: 4px;
  color: var(--muted);
}
.empty-result {
  padding: 60px 20px 54px;
  text-align: center;
}
.empty-art {
  display: flex;
  justify-content: center;
  gap: 0;
  margin: 12px 0 32px;
}
.empty-art span {
  display: grid;
  place-items: center;
  width: 75px;
  height: 95px;
  background: #e2ebd7;
  border: 1px solid #cedbbe;
  border-radius: 10px;
  font: italic 30px Georgia;
  color: #52715e;
  transform: rotate(-12deg);
}
.empty-art span:nth-child(2) {
  background: #f3e1d2;
  transform: translateY(-13px) rotate(4deg);
  color: #a9714d;
}
.empty-art span:last-child {
  background: #e4e9ee;
  transform: rotate(17deg);
  color: #6d7b8d;
}
.empty-result h3 {
  font-size: 19px;
  margin-bottom: 13px;
}
.empty-result > p {
  color: var(--muted);
  font-size: 13px;
  line-height: 1.7;
  max-width: 360px;
  margin: auto;
}
.empty-checks {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-start;
  max-width: 255px;
  margin: 28px auto 0;
  color: #53715d;
  font-size: 12px;
}
.methodology {
  border-top: 1px solid var(--line);
  padding-top: 19px;
  margin-top: 20px;
  font-size: 12px;
}
.method-body p {
  margin: 15px 0;
  font-size: 11px;
  line-height: 1.7;
  color: var(--muted);
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 9px;
  text-align: left;
}
caption {
  font-weight: bold;
  text-align: left;
  margin-bottom: 9px;
}
th,
td {
  padding: 8px 5px;
  border-bottom: 1px solid var(--line);
}
th {
  background: #eff2e9;
}
.result-meta {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  border-block: 1px solid var(--line);
  padding: 16px 0;
  margin-bottom: 26px;
  gap: 12px;
}
.result-meta span {
  font-size: 10px;
  color: var(--muted);
}
.result-meta strong {
  display: block;
  color: var(--ink);
  font-size: 24px;
  font-weight: 500;
}
.result-meta .unvalidated {
  font-size: 12px;
  font-weight: 650;
  margin-top: 6px;
  color: #9b6348;
}
.chart-heading {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 19px;
  align-items: center;
}
.chart-heading > span {
  font-size: 10px;
  color: var(--muted);
}
.chart-row {
  margin-bottom: 18px;
}
.chart-label {
  display: flex;
  justify-content: space-between;
  gap: 15px;
  font-size: 12px;
  margin-bottom: 7px;
}
.chart-label small {
  font-weight: 400;
  color: var(--muted);
}
.bar-track {
  height: 11px;
  background: #edf0e8;
  border-radius: 3px;
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  border-radius: 3px;
  min-width: 0;
}
.chart-caption {
  font-size: 11px;
  line-height: 1.7;
  color: var(--muted);
  padding: 12px;
  background: #f1f3eb;
  border-radius: 6px;
}
.export-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 19px 0;
  border-bottom: 1px solid var(--line);
}
.export-row span {
  font-size: 10px;
  color: var(--muted);
  margin-right: auto;
}
.export-row button {
  border: 1px solid var(--line);
  background: #fffef9;
  padding: 8px 10px;
  border-radius: 5px;
  font-size: 10px;
  color: var(--ink);
  cursor: pointer;
  min-height: 36px;
}
.responses-heading {
  margin: 24px 0 16px;
}
.responses-heading p {
  font-size: 11px;
  color: var(--muted);
  margin-top: 6px;
}
.agent-response {
  border: 1px solid var(--line);
  border-radius: 8px;
  margin-bottom: 8px;
  overflow: hidden;
}
.agent-response summary {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 12px;
  font-size: 11px;
  font-weight: 600;
  list-style: none;
}
.avatar {
  background: #e8eee0;
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: #4c7057;
}
.choice-tag {
  margin-left: auto;
  background: #f1f1e8;
  padding: 4px 7px;
  border-radius: 4px;
  font-size: 9px;
  font-weight: 400;
}
.response-body {
  padding: 0 14px 16px;
  font-size: 12px;
}
.evaluation {
  border-top: 1px solid var(--line);
  padding-top: 12px;
  margin-top: 12px;
  font-size: 11px;
}
.evaluation p {
  margin-top: 5px;
  color: var(--muted);
}
.follow-up {
  margin-top: 14px;
  padding: 10px;
  background: #edf1e7;
  font-size: 11px;
}
.validation-plan {
  padding: 22px;
  background: #e9efdf;
  border-radius: 9px;
  margin-top: 26px;
}
.validation-plan h3 {
  margin-bottom: 14px;
}
.validation-plan ol {
  padding-left: 18px;
  font-size: 11px;
  color: #4f6654;
}
.validation-plan li {
  padding-left: 5px;
  margin: 10px 0;
  line-height: 1.7;
}
.lab-footer {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  font-size: 10px;
  color: var(--muted);
  padding: 25px 0 0;
}
.lab-footer span:first-child {
  letter-spacing: 1px;
}
.sr-only,
.skip-link:not(:focus) {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
.skip-link:focus {
  position: absolute;
  background: white;
  padding: 10px;
  z-index: 10;
}
.results-panel:focus {
  outline: none;
}
@media (max-width: 950px) {
  .workspace {
    grid-template-columns: 1fr;
  }
  .lab-intro {
    gap: 25px;
  }
  .mode-card {
    width: 200px;
  }
  .results-panel {
    scroll-margin-top: 20px;
  }
}
@media (max-width: 600px) {
  .lab-header {
    padding: 16px;
    align-items: flex-start;
    gap: 12px;
  }
  .lab-header nav {
    flex-direction: column;
    gap: 8px;
    font-size: 10px;
  }
  .brand {
    font-size: 10px;
    letter-spacing: 0.7px;
  }
  .brand b {
    font-size: 12px;
  }
  .brand-icon {
    width: 34px;
    height: 36px;
    font-size: 25px;
  }
  main {
    padding: 29px 14px 17px;
  }
  .lab-intro {
    display: block;
  }
  .mode-card {
    width: 100%;
    margin-top: 23px;
    padding: 15px;
  }
  .mode-card p {
    margin: 7px 0;
  }
  .intro-copy {
    font-size: 13px;
  }
  .notice {
    font-size: 11px;
    padding: 12px;
    align-items: flex-start;
  }
  .study-panel,
  .results-panel {
    padding: 18px;
    border-radius: 11px;
  }
  .panel-heading {
    gap: 10px;
  }
  h2 {
    font-size: 18px;
  }
  .pair-fields {
    grid-template-columns: 1fr;
  }
  .alternative {
    padding: 13px;
  }
  .example-tabs button {
    font-size: 11px;
    padding: 9px;
  }
  .chart-heading {
    align-items: flex-start;
    flex-direction: column;
  }
  .lab-footer {
    flex-direction: column;
    gap: 7px;
  }
  .result-meta {
    gap: 10px;
  }
  .choice-tag {
    max-width: 100px;
  }
  .empty-result {
    padding: 40px 0;
  }
  .feature-tags label {
    min-height: 38px;
  }
  input:not([type="checkbox"]),
  textarea,
  select {
    font-size: 16px;
  }
  .image-details input {
    font-size: 12px;
  }
  .text-button {
    min-height: 36px;
  }
  .export-row button {
    min-height: 44px;
  }
}
@media (prefers-reduced-motion: reduce) {
  * {
    scroll-behavior: auto !important;
  }
}
</style>
