/* eslint-disable no-console */
const fs = require("node:fs");
const path = require("node:path");

const checklistPath = path.join(process.cwd(), "docs", "REGRESSION_CHECKLIST.md");

if (!fs.existsSync(checklistPath)) {
  console.error("Regression checklist file is missing: docs/REGRESSION_CHECKLIST.md");
  process.exit(1);
}

const content = fs.readFileSync(checklistPath, "utf8");
const requiredSections = [
  "Planning create/edit/view",
  "Downtime/overtime hold-resume",
  "Operator task testing lifecycle",
  "Stage-wise attempt history",
  "Carton movement transitions",
];

const missing = requiredSections.filter((s) => !content.includes(s));
if (missing.length) {
  console.error("Regression checklist is missing required sections:");
  missing.forEach((s) => console.error(`- ${s}`));
  process.exit(1);
}

console.log("Regression checklist structure passed.");

