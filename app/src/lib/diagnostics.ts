/** Privacy-first diagnostics: structured events only, never arbitrary exception text,
 * paths, FEN, PGN, user names, keys, storage dumps or network payloads.
 * Bounded local log survives app restart. Export only after an explicit user click. */
export type DiagnosticCode =
  | "ui_error"
  | "unhandled_rejection"
  | "offline_engine_request"
  | "offline_engine_move"
  | "offline_engine_missing"
  | "offline_engine_start_failure"
  | "offline_engine_timeout"
  | "offline_engine_invalid_move"
  | "offline_engine_failure"
  | "offline_autosave_failure";

export interface DiagnosticEvent {
  time: string;
  code: DiagnosticCode;
}

const MAX_EVENTS = 120;
const STORAGE_KEY = "kibitz.diagnosticEvents.v1";
type DiagnosticStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;
let storage: DiagnosticStorage | null = null;
const events: DiagnosticEvent[] = [];
const allowedCodes = new Set<DiagnosticCode>([
  "ui_error", "unhandled_rejection", "offline_engine_request",
  "offline_engine_move", "offline_engine_missing", "offline_engine_start_failure",
  "offline_engine_timeout", "offline_engine_invalid_move", "offline_engine_failure",
  "offline_autosave_failure",
]);

/** Load only validated event codes and timestamps, never arbitrary stored payloads. */
export function initializeDiagnostics(candidate: DiagnosticStorage): void {
  storage = candidate;
  events.splice(0, events.length);
  try {
    const raw = candidate.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return;
    for (const event of parsed.slice(-MAX_EVENTS)) {
      if (typeof event !== "object" || event === null) continue;
      const item = event as Record<string, unknown>;
      if (typeof item.code !== "string" || !allowedCodes.has(item.code as DiagnosticCode)) continue;
      if (typeof item.time !== "string" || !/^\\d{4}-\\d\\d-\\d\\dT/.test(item.time)) continue;
      events.push({ code: item.code as DiagnosticCode, time: item.time });
    }
  } catch { /* disabled or corrupt storage: stay in-memory */ }
}

function persist(): void {
  try { storage?.setItem(STORAGE_KEY, JSON.stringify(events)); }
  catch { /* browser storage may be unavailable */ }
}

/** Clear both in-memory and persisted diagnostics on explicit request. */
export function clearDiagnostics(): void {
  events.splice(0, events.length);
  try { storage?.removeItem(STORAGE_KEY); }
  catch { /* browser storage may be unavailable */ }
}

/** Event codes are intentionally fixed: no uncontrolled payloads enter the log. */
export function recordDiagnostic(code: DiagnosticCode): void {
  if (!allowedCodes.has(code)) return;
  events.push({ time: new Date().toISOString(), code });
  if (events.length > MAX_EVENTS) events.splice(0, events.length - MAX_EVENTS);
  persist();
}

export function diagnoseEngineFailure(error: unknown): DiagnosticCode {
  const raw = String(error);
  if (raw.includes("No Stockfish binary found") ||
      raw.includes("Configured engine path does not exist")) return "offline_engine_missing";
  if (raw.includes("Failed to spawn engine") ||
      raw.includes("Permission denied") ||
      raw.includes("Exec format error")) return "offline_engine_start_failure";
  if (raw.includes("Timed out") || raw.includes("Zeitlimit")) return "offline_engine_timeout";
  return "offline_engine_failure";
}

export function diagnosticsReport(): {
  schema: 1;
  app: "Kibitz DE";
  createdAt: string;
  events: DiagnosticEvent[];
} {
  return {
    schema: 1,
    app: "Kibitz DE",
    createdAt: new Date().toISOString(),
    events: events.map((event) => ({ ...event })),
  };
}

/** Browser-side automatic error labels – raw errors are intentionally discarded. */
export function installDiagnosticListeners(target: Window): () => void {
  const onError = () => recordDiagnostic("ui_error");
  const onRejection = () => recordDiagnostic("unhandled_rejection");
  target.addEventListener("error", onError);
  target.addEventListener("unhandledrejection", onRejection);
  return () => {
    target.removeEventListener("error", onError);
    target.removeEventListener("unhandledrejection", onRejection);
  };
}

export function saveDiagnosticReport(doc: Document = document): void {
  const json = JSON.stringify(diagnosticsReport(), null, 2);
  const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
  const a = doc.createElement("a");
  a.href = url;
  a.download = "Kibitz-DE-Diagnose.json";
  doc.body.appendChild(a);
  try { a.click(); }
  finally {
    a.remove();
    URL.revokeObjectURL(url);
  }
}

/** Only for isolated unit tests: no user-facing clear control needed yet. */
export function clearDiagnosticsForTest(): void {
  events.splice(0, events.length);
  storage = null;
}
