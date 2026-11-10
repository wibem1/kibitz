import { beforeEach, describe, expect, it } from "vitest";
import {
  clearDiagnosticsForTest, diagnoseEngineFailure, diagnosticsReport,
  recordDiagnostic,
} from "./diagnostics";

describe("Diagnose ohne vertrauliche Inhalte", () => {
  beforeEach(clearDiagnosticsForTest);

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
