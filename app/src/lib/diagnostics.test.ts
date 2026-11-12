import { beforeEach, describe, expect, it } from "vitest";
import {
  clearDiagnostics, clearDiagnosticsForTest, diagnoseEngineFailure, diagnosticsReport,
  initializeDiagnostics,
  recordDiagnostic,
} from "./diagnostics";

describe("Diagnose ohne vertrauliche Inhalte", () => {
  beforeEach(clearDiagnosticsForTest);

  it("bewahrt Ereignisse über einen simulierten Neustart auf und löscht sie auf Wunsch", () => {
    const memory = new Map<string, string>();
    const store = {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => { memory.set(key, value); },
      removeItem: (key: string) => { memory.delete(key); },
    };
    initializeDiagnostics(store);
    recordDiagnostic("offline_engine_timeout");
    clearDiagnosticsForTest(); // simulates a new process with fresh memory
    initializeDiagnostics(store);
    expect(diagnosticsReport().events.map((event) => event.code))
      .toEqual(["offline_engine_timeout"]);
    clearDiagnostics();
    expect(diagnosticsReport().events).toHaveLength(0);
    expect(memory.size).toBe(0);
  });

  it("verwirft fremde Nutzdaten beim Wiederherstellen", () => {
    const memory = new Map<string, string>([[
      "kibitz.diagnosticEvents.v1",
      JSON.stringify([
        { code: "api_key=secret", time: "2026-11-10T12:00:00Z", token: "secret" },
        { code: "ui_error", time: "2026-11-10T12:00:00Z", extra: "/Users/private" },
      ]),
    ]]);
    initializeDiagnostics({
      getItem: (key) => memory.get(key) ?? null,
      setItem: (key, value) => { memory.set(key, value); },
      removeItem: (key) => { memory.delete(key); },
    });
    const report = JSON.stringify(diagnosticsReport());
    expect(report).toContain("ui_error");
    expect(report).not.toContain("api_key");
    expect(report).not.toContain("token");
    expect(report).not.toContain("/Users/private");
  });

  it("stellt nur korrekt formatierte Zeitstempel wieder her", () => {
    const store = new Map<string, string>([[
      "kibitz.diagnosticEvents.v1",
      JSON.stringify([
        { code: "ui_error", time: "ungueltig" },
        { code: "offline_engine_move", time: "2026-11-10T12:00:00.000Z" },
      ]),
    ]]);
    initializeDiagnostics({
      getItem: (key) => store.get(key) ?? null,
      setItem: (key, value) => { store.set(key, value); },
      removeItem: (key) => { store.delete(key); },
    });
    expect(diagnosticsReport().events).toEqual([
      { code: "offline_engine_move", time: "2026-11-10T12:00:00.000Z" },
    ]);
  });

  it("speichert nur feste Ereigniscodes ohne Fehlertext", () => {
    const raw = "Configured engine path does not exist: /Users/private/secret-key";
    recordDiagnostic(diagnoseEngineFailure(raw));
    const json = JSON.stringify(diagnosticsReport());
    expect(json).toContain("offline_engine_missing");
    expect(json).not.toContain("/Users/");
    expect(json).not.toContain("secret-key");
    expect(json).not.toContain("Configured engine path");
  });

  it("unterscheidet Startfehler, Zeitüberschreitung und sonstige Engine-Fehler", () => {
    expect(diagnoseEngineFailure("Failed to spawn engine: Exec format error"))
      .toBe("offline_engine_start_failure");
    expect(diagnoseEngineFailure("Zeitlimit für Engine-Zug überschritten"))
      .toBe("offline_engine_timeout");
    expect(diagnoseEngineFailure("any unknown backend message"))
      .toBe("offline_engine_failure");
  });

  it("erfasst Import und Datenbankspeicherung ohne Nutzerinhalte", () => {
    recordDiagnostic("pgn_import_request");
    recordDiagnostic("pgn_import_partial");
    recordDiagnostic("database_save_request");
    recordDiagnostic("database_save_failure");
    recordDiagnostic("game_handoff_cancelled");
    const json = JSON.stringify(diagnosticsReport());
    expect(diagnosticsReport().events.map((event) => event.code)).toEqual([
      "pgn_import_request", "pgn_import_partial", "database_save_request",
      "database_save_failure", "game_handoff_cancelled",
    ]);
    expect(json).not.toContain("sourceName");
    expect(json).not.toContain("filename");
    expect(json).not.toContain("pgnText");
  });

  it("begrenzt den Bericht auf die letzten 120 Ereignisse", () => {
    for (let i = 0; i < 150; i++) recordDiagnostic("offline_engine_request");
    expect(diagnosticsReport().events).toHaveLength(120);
  });

  it("verwirft ungültige Codes zur Laufzeit", () => {
    recordDiagnostic("api_key=PRIVATE" as never);
    expect(diagnosticsReport().events).toEqual([]);
  });

  it("gibt eine unabhängige Momentaufnahme zurück", () => {
    recordDiagnostic("offline_engine_move");
    const first = diagnosticsReport();
    first.events.push({ code: "ui_error", time: "1970-01-01" });
    expect(diagnosticsReport().events).toHaveLength(1);
    expect(diagnosticsReport().schema).toBe(1);
    expect(diagnosticsReport().app).toBe("Kibitz DE");
  });
});
