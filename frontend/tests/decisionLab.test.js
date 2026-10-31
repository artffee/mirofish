import test from "node:test";
import assert from "node:assert/strict";
import { csvCell, reportCSV, reportText } from "../src/decisionLab/reports.js";
import { freshExample, examples } from "../src/decisionLab/examples.js";

test("spreadsheet formulas are neutralized, including leading whitespace", () => {
  for (const value of [
    '=HYPERLINK("https://example.test")',
    "+1+1",
    "-10",
    "@SUM(1)",
    "   =1",
    "\t=1",
    "\n=1",
    "\r=1",
  ]) {
    assert.ok(csvCell(value).startsWith("\"'"));
  }
  assert.equal(csvCell('normal, "quote"'), '"normal, ""quote"""');
});
const report = {
  run_id: "controlled-run",
  created_at: "2026-10-30",
  notice: "Synthetic, not customer research.",
  study: freshExample("artwork"),
  method: {
    mode: "fixture",
    engine: "deterministic-rules-v1",
    validation_status: "Not validated",
    model: null,
    limitations: ["No real participants."],
  },
  panel: [
    {
      profile: { user_id: 0, name: "Invented person" },
      budget_limit: 20,
      weights: { value: 3 },
    },
  ],
  responses: [
    {
      agent_id: 0,
      choice: "A",
      reason: "=malicious",
      tradeoff: "Unknown.",
      follow_up: "Ask people.",
      evaluations: [
        {
          alternative_id: "A",
          appeal: "Possible appeal.",
          concern: "Unknown.",
        },
      ],
    },
  ],
  comparison: [{ title: "Print A", count: 1 }],
  next_steps: ["Test with people."],
};
test("exports carry provenance and complete response data", () => {
  const csv = reportCSV(report);
  assert.ok(csv.includes("Synthetic, not customer research."));
  assert.ok(csv.includes('"\'=malicious"'));
  assert.ok(csv.includes("controlled-run"));
  const text = reportText(report);
  for (const value of [
    "Not validated",
    "controlled-run",
    "No real participants.",
    "ALTERNATIVES",
    "INVENTED PERSPECTIVES",
    "Possible appeal.",
    "Reference notes:",
  ])
    assert.ok(text.includes(value));
});
test("examples have two or three distinct alternatives and isolated state", () => {
  for (const key of Object.keys(examples)) {
    const example = freshExample(key);
    assert.ok(
      example.alternatives.length >= 2 && example.alternatives.length <= 3,
    );
    assert.equal(
      new Set(example.alternatives.map((o) => o.id)).size,
      example.alternatives.length,
    );
    example.alternatives[0].title = "changed";
    assert.notEqual(freshExample(key).alternatives[0].title, "changed");
  }
});
