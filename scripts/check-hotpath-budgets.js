/* eslint-disable no-console */
const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();

const HOTPATH_BUDGETS = [
  { file: "src/components/Operators/viewTask/DeviceTestComponent.tsx", maxLines: 1200 },
  { file: "src/components/Operators/viewTask/index.tsx", maxLines: 1200 },
  { file: "src/components/PlaningScheduling/viewPlaning/index.tsx", maxLines: 1200 },
  { file: "src/components/product/edit/page.tsx", maxLines: 1200 },
  { file: "src/lib/api.js", maxLines: 1200 },
];

const lineCount = (content) => content.split(/\r\n|\r|\n/).length;

const failures = [];
for (const item of HOTPATH_BUDGETS) {
  const abs = path.join(root, item.file);
  if (!fs.existsSync(abs)) {
    failures.push(`${item.file}: file not found`);
    continue;
  }
  const lines = lineCount(fs.readFileSync(abs, "utf8"));
  if (lines > item.maxLines) {
    failures.push(`${item.file}: ${lines} lines (max ${item.maxLines})`);
  }
}

if (failures.length) {
  console.error("Hot-path budget check failed:");
  failures.forEach((f) => console.error(`- ${f}`));
  process.exit(1);
}

console.log("Hot-path budgets passed.");

