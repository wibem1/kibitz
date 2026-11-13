#!/usr/bin/env node
/**
 * Kibitz DE: source inventory for user-visible text that still appears English.
 * Heuristic only: matches likely prose in JSX/TSX, helper text and Rust templates.
 * Does not rewrite, translate or remove anything. Exit code stays zero so the
 * audit can be reviewed before gating CI on remaining English text.
 *
 * Run: node scripts/i18n_audit.mjs
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const selected = [
  join(root, "app", "src"),
  join(root, "crates", "kibitz-verbalize", "templates"),
];
const omit = /\.test\.|\.spec\.|\.snap$|\.d\.ts$|__fixtures__|__snapshots__/;
const extensions = /\.(tsx?|tmpl)$/;
const englishWords = /\b(?:the|this|that|please|click|your|you|view|open|close|settings|search|enter|loading|failed|error|nothing|game|games|moves|move|position|positions|analysis|training|engine|player|players|show|hide|running|available|unavailable|select|choose|create|import|export|start|stop|today|tomorrow|week|save|saved|cancel|next|back|previous|current|newest|account|database|online|file|files|from|into|will|can|not|with|without|after|before|select|rating|against|score|opening|tactics|endgame)\b/i;

function files(dir) {
  if (!statSync(dir).isDirectory()) return [dir];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name.startsWith(".") || entry.name === "node_modules") return [];
    const p = join(dir, entry.name);
    return entry.isDirectory() ? files(p) : extensions.test(p) && !omit.test(p) ? [p] : [];
  });
}
const result = [];
for (const dir of selected) {
  for (const file of files(dir)) {
    const content = readFileSync(file, "utf8");
    const candidates = [];
    content.split(/\r?\n/).forEach((line, idx) => {
      const s = line.trim();
      if (s.startsWith("//") || s.startsWith("*") || s.startsWith("#") || s.startsWith("/*")) return;
      // Template keys are machine-readable: inspect ONLY their values.
      const sample = file.endsWith(".tmpl") ? (s.includes("=") ? s.slice(s.indexOf("=") + 1) : "") : s;
      const visible = file.endsWith(".tmpl")
        || /(?:title|subtitle|placeholder|label|aria-label|empty|help|note)=|>[^<>]*[A-Za-z]{3}[^<>]*<|(?:setStatus|setError|setNote)\(|\bheader:|\b(?:message|description|detail|hint):/.test(sample);
      if (visible && englishWords.test(sample)) {
        candidates.push({ line: idx + 1, text: sample.slice(0, 170) });
      }
    });
    if (candidates.length) result.push({ path: relative(root, file), count: candidates.length, examples: candidates.slice(0, 3) });
  }
}
result.sort((a, b) => b.count - a.count || a.path.localeCompare(b.path));
console.log(JSON.stringify({ note: "Heuristic audit: human review required; false positives and missed dynamic strings are possible.", files: result.length, candidates: result.reduce((sum, f) => sum + f.count, 0), results: result }, null, 2));
