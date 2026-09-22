#!/usr/bin/env node
/**
 * LAW: "MUSIC MAYKERS IS BANNED FROM UI DISPLAY. ALWAYS & ONLY G PUTNAM MUSIC."
 *      — GD, 2026-09-22
 *
 * The banned name may not appear in any surface a visitor can see: rendered
 * text, alt text, titles, link hrefs, embed sources, image filenames, or data
 * that feeds a UI. Governance and audit files are exempt, because naming the
 * ban is how the ban is kept.
 *
 * Exit 1 on any violation.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, extname, basename } from "node:path";

const ROOT = process.cwd();

const BANNED = [
  { label: "Music Maykers", re: /music\s*[-_]?\s*maykers/i },
];

/** Surfaces a visitor can see. */
const UI_EXTENSIONS = new Set([
  ".html", ".htm", ".tsx", ".jsx", ".ts", ".js", ".mjs",
  ".css", ".json", ".md", ".svg", ".txt",
]);

/** Directories never shipped to a visitor. */
const SKIP_DIRS = new Set([
  "node_modules", ".git", ".next", "dist", "build", "coverage", "reference",
]);

/** Files whose whole purpose is to record or enforce the ban. */
const EXEMPT_FILES = new Set([
  "GOVERNANCE.md",
  "scripts/audit-banned-ui-names.mjs",
  "epk/README.md",
]);

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const violations = [];

for (const file of walk(ROOT)) {
  const rel = relative(ROOT, file);
  if (EXEMPT_FILES.has(rel)) continue;

  // A banned name in a filename ships too, even if the file is binary.
  for (const { label, re } of BANNED) {
    if (re.test(basename(file))) {
      violations.push({ rel, line: 0, label, text: `filename: ${basename(file)}` });
    }
  }

  if (!UI_EXTENSIONS.has(extname(file))) continue;

  let contents;
  try {
    contents = readFileSync(file, "utf8");
  } catch {
    continue;
  }

  contents.split("\n").forEach((text, index) => {
    for (const { label, re } of BANNED) {
      if (re.test(text)) {
        violations.push({ rel, line: index + 1, label, text: text.trim().slice(0, 140) });
      }
    }
  });
}

if (violations.length === 0) {
  console.log("PASS — no banned name reaches any user-visible surface.");
  console.log("       Banned: " + BANNED.map((b) => b.label).join(", "));
  process.exit(0);
}

console.error(`FAIL — ${violations.length} banned-name occurrence(s) on user-visible surfaces.\n`);
for (const v of violations) {
  console.error(`  ${v.rel}:${v.line}  [${v.label}]`);
  console.error(`    ${v.text}\n`);
}
console.error("LAW: the display name is ALWAYS and ONLY G Putnam Music.");
process.exit(1);
