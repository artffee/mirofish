// Exports are generated only on explicit download, from the completed run snapshot.
export function csvCell(value) {
  let text = String(value ?? "");
  if (/^[\s\u0000-\u001f]*[=+@-]/u.test(text) || /^[\t\r\n]/u.test(text))
    text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export function reportCSV(result) {
  const rows = [
    [
      "notice",
      "mode",
      "run_id",
      "audience",
      "question",
      "agent",
      "choice",
      "reason",
      "tradeoff",
      "follow_up",
    ],
  ];
  for (const response of result.responses) {
    const profile = result.panel.find(
      (p) => p.profile.user_id === response.agent_id,
    )?.profile;
    rows.push([
      result.notice,
      result.method.mode,
      result.run_id,
      result.study.audience,
      result.study.question,
      profile?.name,
      response.choice,
      response.reason,
      response.tradeoff,
      response.follow_up,
    ]);
  }
  return "\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
}

export function reportText(result) {
  return [
    "MIROFISH — DECISION LAB",
    result.notice,
    "",
    `Run: ${result.run_id} | ${result.created_at}`,
    `Engine: ${result.method.engine}`,
    `Model: ${result.method.model ?? "None (rules only)"}`,
    `Validation: ${result.method.validation_status}`,
    `Audience: ${result.study.audience}`,
    `Question: ${result.study.question}`,
    `Scenario: ${result.study.scenario}`,
    `Reference notes: ${result.study.context || "None"}`,
    `Assumed base budget: ${result.study.budget}`,
    "",
    "ALTERNATIVES",
    ...result.study.alternatives.map(
      (o) =>
        `${o.id}: ${o.title}\n${o.description}\nPrice: ${o.price ?? "not supplied"} | Assigned attributes: ${o.features.join(", ") || "none"}`,
    ),
    "",
    "SYNTHETIC COUNTS (NOT MARKET SHARES)",
    ...result.comparison.map(
      (o) => `${o.title}: ${o.count} of ${result.responses.length}`,
    ),
    "",
    "INVENTED PERSPECTIVES",
    ...result.panel.map(
      (p) =>
        `${p.profile.name} | Budget limit: ${p.budget_limit} | Assigned weights: ${JSON.stringify(p.weights)}`,
    ),
    "",
    "SYNTHETIC RESPONSES",
    ...result.responses.flatMap((r) => [
      `${result.panel.find((p) => p.profile.user_id === r.agent_id)?.profile.name}: ${r.choice}`,
      r.reason,
      r.tradeoff,
      ...r.evaluations.map(
        (e) => `${e.alternative_id}: ${e.appeal} ${e.concern}`,
      ),
      `Follow up: ${r.follow_up}`,
      "",
    ]),
    "LIMITATIONS",
    ...result.method.limitations,
    "",
    "REAL-WORLD VALIDATION PLAN",
    ...result.next_steps,
  ].join("\n");
}

export function downloadReport(result, format) {
  const formats = {
    json: ["application/json", JSON.stringify(result, null, 2)],
    csv: ["text/csv;charset=utf-8", reportCSV(result)],
    txt: ["text/plain;charset=utf-8", reportText(result)],
  };
  const [type, content] = formats[format];
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `decision-lab-${result.run_id}.${format}`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
