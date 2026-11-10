import { describe, expect, it } from "vitest";
import { offlineEngineError } from "./offlineEngine";

describe("Offline-Engine: verständliche Fehler", () => {
  it("erklärt fehlendes Stockfish mit Hinweis auf Einstellungen", () => {
    const msg = offlineEngineError("No Stockfish binary found. Set an engine path in the UI");
    expect(msg).toContain("Stockfish-Programm");
    expect(msg).toContain("Einstellungen");
    expect(msg).not.toContain("No Stockfish");
  });

  it("erklärt einen veralteten konfigurierten Engine-Pfad", () => {
    const msg = offlineEngineError("Configured engine path does not exist: /old/stockfish");
    expect(msg).toContain("Engine");
    expect(msg).not.toContain("/old/stockfish");
  });

  it("erklärt einen Startfehler durch inkompatible Datei", () => {
    const msg = offlineEngineError("Failed to spawn engine: Exec format error");
    expect(msg).toContain("kompatibel");
    expect(msg).toContain("ausführbar");
  });

  it("erklärt einen Zeitablauf", () => {
    expect(offlineEngineError("Zeitlimit für Engine-Zug überschritten."))
      .toContain("nicht rechtzeitig");
  });

  it("belässt unerwartete Meldungen für die Fehlersuche", () => {
    expect(offlineEngineError("besonderer UCI-Fehler"))
      .toContain("besonderer UCI-Fehler");
  });
});
