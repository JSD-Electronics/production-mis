/* eslint-disable no-console */
const { execSync } = require("node:child_process");

const SAFE_PATH_PATTERNS = [
  /src[\\/]+lib[\\/]+messages[\\/]/i,
  /node_modules/i,
];

const VIOLATION_PATTERNS = [
  /toast\.(success|error|info|warn|warning)\s*\(/,
  /\balert\s*\(/,
];

const run = (cmd) =>
  execSync(cmd, { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" }).trim();

const getBaseRef = () => {
  const envBase = process.env.GITHUB_BASE_REF;
  if (envBase) return `origin/${envBase}`;
  return "HEAD~1";
};

const isSafePath = (file) => SAFE_PATH_PATTERNS.some((pattern) => pattern.test(file));

const getChangedFiles = (baseRef) => {
  const raw = run(`git diff --name-only ${baseRef}...HEAD`);
  return raw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((f) => /\.(ts|tsx|js|jsx)$/.test(f))
    .filter((f) => !isSafePath(f));
};

const findViolationsInAddedLines = (baseRef, file) => {
  const diff = run(`git diff -U0 ${baseRef}...HEAD -- "${file}"`);
  const lines = diff.split("\n");
  const violations = [];

  for (const line of lines) {
    if (!line.startsWith("+") || line.startsWith("+++")) continue;
    const content = line.slice(1);
    if (VIOLATION_PATTERNS.some((pattern) => pattern.test(content))) {
      violations.push(content.trim());
    }
  }
  return violations;
};

const main = () => {
  const baseRef = getBaseRef();
  let files = [];
  try {
    files = getChangedFiles(baseRef);
  } catch (error) {
    console.warn(
      "User message guard skipped: unable to run git diff in this environment.",
    );
    return;
  }
  const allViolations = [];

  for (const file of files) {
    let violations = [];
    try {
      violations = findViolationsInAddedLines(baseRef, file);
    } catch (error) {
      // Skip individual file parsing issues without failing advisory checks.
      continue;
    }
    for (const snippet of violations) {
      allViolations.push({ file, snippet });
    }
  }

  if (allViolations.length === 0) {
    console.log("No raw toast/alert usage found in added lines.");
    return;
  }

  console.error("Found disallowed raw user-message usage in added lines:");
  allViolations.forEach((v) => {
    console.error(`- ${v.file}: ${v.snippet}`);
  });
  process.exit(1);
};

main();
