#!/usr/bin/env node
/**
 * LAW: "GPMx PLATFORMS USE ONLY C-OP PROCESS OPTIMIZATION PURVIEW, KF INVENTORY
 *       BUILDING, ARCHITECTURE, AND DELIVERY."
 *       — GD, 2026-09-22
 *
 * Every module must serve one of the four functions, or be declared
 * OUT-OF-PURVIEW with a reason and an owner. A module that serves none and is
 * not declared is rubble, and this audit fails on it.
 *
 * The point is the unclassified case: a new file nobody classified cannot pass.
 * That forces the decision at the moment of creation, which is the only moment
 * it is cheap.
 *
 * Exit 1 on: unclassified modules, a declared function of "none", an
 * OUT-OF-PURVIEW entry missing its reason or owner, or a dead rule.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const MANIFEST = "config/gpmx-purview.json";

const PLATFORM_FUNCTIONS = ["C-OP", "KF-INVENTORY", "ARCHITECTURE", "DELIVERY"];

const manifest = JSON.parse(readFileSync(join(ROOT, MANIFEST), "utf8"));

/** Glob → RegExp. Supports `**`, `*` and literal `[id]` path segments. */
function globToRegExp(glob) {
  let out = "";
  for (let i = 0; i < glob.length; i += 1) {
    const ch = glob[i];
    if (ch === "*") {
      if (glob[i + 1] === "*") {
        // `**/` swallows any number of segments, including none.
        if (glob[i + 2] === "/") { out += "(?:.*/)?"; i += 2; }
        else { out += ".*"; i += 1; }
      } else {
        out += "[^/]*";
      }
    } else {
      out += ch.replace(/[.+^${}()|[\]\\?]/g, "\\$&");
    }
  }
  return new RegExp(`^${out}$`);
}

const ignored = (manifest.ignored || []).map(globToRegExp);
const rules = (manifest.rules || []).map((rule) => ({
  ...rule,
  re: globToRegExp(rule.glob),
  matched: 0,
}));

/** A path is ignored if it matches a rule, or sits under a directory one covers. */
function isIgnored(rel, isDirectory) {
  return ignored.some((re) => re.test(rel) || (isDirectory && re.test(`${rel}/x`)));
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const rel = relative(ROOT, full);
    const isDirectory = statSync(full).isDirectory();
    if (isIgnored(rel, isDirectory)) continue;
    if (isDirectory) walk(full, out);
    else out.push(rel);
  }
  return out;
}

const files = walk(ROOT);

const byFunction = new Map(PLATFORM_FUNCTIONS.map((f) => [f, []]));
const outOfPurview = [];
const unclassified = [];
const failures = [];
const bypasses = [];

for (const rel of files) {
  const rule = rules.find((r) => r.re.test(rel));
  if (!rule) {
    unclassified.push(rel);
    continue;
  }
  rule.matched += 1;

  if (rule.function === "OUT-OF-PURVIEW") {
    if (!rule.reason || !rule.owner) {
      failures.push(`${rel} — declared OUT-OF-PURVIEW without a ${!rule.reason ? "reason" : "owner"}.`);
    }
    outOfPurview.push({ rel, reason: rule.reason, owner: rule.owner });
    continue;
  }

  if (!PLATFORM_FUNCTIONS.includes(rule.function)) {
    failures.push(`${rel} — serves no platform function ("${rule.function}").`);
    continue;
  }

  byFunction.get(rule.function).push(rel);
  if (rule.bypasses_inventory_gate) {
    bypasses.push({ rel, reason: rule.bypass_reason || "(no reason given)" });
  }
}

const deadRules = rules.filter((r) => r.matched === 0);

// ---------------------------------------------------------------- report

console.log(`GPMx purview audit — ${files.length} modules\n`);
console.log(manifest.law + "\n");

for (const fn of PLATFORM_FUNCTIONS) {
  const list = byFunction.get(fn);
  console.log(`  ${fn.padEnd(14)} ${String(list.length).padStart(3)}`);
}
console.log(`  ${"OUT-OF-PURVIEW".padEnd(14)} ${String(outOfPurview.length).padStart(3)}`);

if (bypasses.length > 0) {
  console.log(`\nDeclared inventory-gate bypasses — never reachable in a deployed environment:`);
  for (const b of bypasses) console.log(`  ${b.rel}\n    ${b.reason}`);
}

if (outOfPurview.length > 0) {
  console.log(`\nStanding debt — outside platform purview, kept on the owner's word:`);
  const seen = new Set();
  for (const o of outOfPurview) {
    if (seen.has(o.reason)) continue;
    seen.add(o.reason);
    console.log(`  [${o.owner}] ${o.reason}`);
  }
}

if (deadRules.length > 0) {
  failures.push(...deadRules.map((r) => `rule "${r.glob}" matches nothing — stale, remove it.`));
}

if (unclassified.length > 0) {
  console.error(`\nFAIL — ${unclassified.length} module(s) serve no declared function.\n`);
  for (const rel of unclassified) console.error(`  ${rel}`);
  console.error(`\nEvery module serves C-OP, KF-INVENTORY, ARCHITECTURE or DELIVERY,`);
  console.error(`or is declared OUT-OF-PURVIEW with a reason and an owner in ${MANIFEST}.`);
  console.error(`An unclassified module is rubble. Classify it or remove it.`);
}

if (failures.length > 0) {
  console.error(`\nFAIL — ${failures.length} manifest problem(s).\n`);
  for (const f of failures) console.error(`  ${f}`);
}

if (unclassified.length > 0 || failures.length > 0) process.exit(1);

console.log(`\nPASS — every module serves a declared function.`);
