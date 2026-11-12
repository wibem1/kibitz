/**
 * Import PGN / SCID (DATA IN/OUT): paste or open a PGN to load it as the
 * active game. SCID (.si4) databases are converted with the CLI for now;
 * this screen documents that path.
 */
import { useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { recordDiagnostic } from "./lib/diagnostics";

interface PgnImportReport {
  imported: number;
  duplicates: number;
  failed: number;
  positions: number;
  failures: string[];
}

const SAMPLE_PGN = `[Event "London"]
[Site "London ENG"]
[Date "1851.06.21"]
[White "Adolf Anderssen"]
[Black "Lionel Kieseritzky"]
[Result "1-0"]

1. e4 e5 2. f4 exf4 3. Bc4 Qh4+ 4. Kf1 b5 5. Bxb5 Nf6 6. Nf3 Qh6
7. d3 Nh5 8. Nh4 Qg5 9. Nf5 c6 10. g4 Nf6 11. Rg1 cxb5 12. h4 Qg6
13. h5 Qg5 14. Qf3 Ng8 15. Bxf4 Qf6 16. Nc3 Bc5 17. Nd5 Qxb2
18. Bd6 Bxg1 19. e5 Qxa1+ 20. Ke2 Na6 21. Nxg7+ Kd8 22. Qf6+ Nxf6
23. Be7# 1-0`;

interface ImportViewProps {
  /** Parse + install the PGN as the active game (App owns the model). */
  onLoad: (pgnText: string) => void;
  status: string;
}

export default function ImportView({ onLoad, status }: ImportViewProps) {
  const [pgnText, setPgnText] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);
  const databaseFileRef = useRef<HTMLInputElement | null>(null);
  const [databaseFile, setDatabaseFile] = useState<File | null>(null);
  const [importBusy, setImportBusy] = useState(false);
  const [importReport, setImportReport] = useState<PgnImportReport | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const importIntoDatabase = async () => {
    if (!databaseFile || importBusy) return;
    setImportBusy(true);
    setImportError(null);
    setImportReport(null);
    recordDiagnostic("pgn_import_request");
    try {
      if (databaseFile.size === 0 || databaseFile.size > 25 * 1024 * 1024) {
        throw new Error("Bitte eine PGN-Datei mit maximal 25 MiB auswählen.");
      }
      const result = await invoke<PgnImportReport>("import_pgn_database", {
        pgn: await databaseFile.text(), sourceName: databaseFile.name,
      });
      setImportReport(result);
      recordDiagnostic(result.failed > 0 ? "pgn_import_partial" : "pgn_import_success");
    } catch (e) {
      recordDiagnostic("pgn_import_failure");
      setImportError(String(e));
    } finally {
      setImportBusy(false);
    }
  };

  return (
    <div className="page import-view">
      <h2 className="page-title">Partien importieren</h2>
      <div className="panel-box">
        <div className="panel-box-title">PGN</div>
        <textarea
          className="pgn-input"
          value={pgnText}
          onChange={(e) => setPgnText(e.target.value)}
          placeholder="PGN-Partie hier einfügen …"
          spellCheck={false}
        />
        <div className="row-gap">
          <button className="btn" onClick={() => onLoad(pgnText)}>
            Partie laden
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            Datei öffnen …
          </button>
          <button
            className="btn"
            onClick={() => {
              setPgnText(SAMPLE_PGN);
              onLoad(SAMPLE_PGN);
            }}
          >
            Beispielpartie
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".pgn,.txt"
            style={{ display: "none" }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                void f.text().then((text) => {
                  setPgnText(text);
                  onLoad(text);
                });
              }
              e.target.value = "";
            }}
          />
        </div>
        <div className="settings-note">{status}</div>
      </div>
      <div className="panel-box">
        <div className="panel-box-title">PGN-Sammlung dauerhaft in die Datenbank importieren</div>
        <p className="page-prose">Übernimmt alle Partien einer PGN-Datei in die bereits geöffnete Kibitz-Datenbank.
          Duplikate werden erkannt und fehlerhafte Partien gemeldet. Dieser Import speichert Partien
          dauerhaft und lädt sie nicht nur zur Ansicht.</p>
        <p className="page-prose">Dateigrenze im aktuellen Dialog: 25 MiB.
          Sehr große Sammlungen werden weiterhin über den Streaming-Import der Kommandozeile verarbeitet.</p>
        <div className="row-gap">
          <button className="btn" disabled={importBusy} onClick={() => databaseFileRef.current?.click()}>
            PGN-Sammlung auswählen …
          </button>
          <input ref={databaseFileRef} type="file" accept=".pgn,.txt" style={{ display: "none" }}
            onChange={(e) => {
              setDatabaseFile(e.target.files?.[0] ?? null);
              setImportReport(null); setImportError(null);
              e.target.value = "";
            }} />
          <span>{databaseFile?.name ?? "Keine Datei ausgewählt"}</span>
          <button className="btn" disabled={!databaseFile || importBusy}
            onClick={() => void importIntoDatabase()}>
            {importBusy ? "Import läuft …" : "In Datenbank importieren"}
          </button>
        </div>
        {importError && <p className="error">{importError}</p>}
        {importReport && <div className="settings-note" role="status">
          Übernommen: {importReport.imported.toLocaleString("de-DE")} ·
          Duplikate: {importReport.duplicates.toLocaleString("de-DE")} ·
          Fehler: {importReport.failed.toLocaleString("de-DE")} ·
          indizierte Stellungen: {importReport.positions.toLocaleString("de-DE")}
          {importReport.failures.length > 0 && <p>Fehlerbeispiele: {importReport.failures.join(" · ")}</p>}
          <p>Wechsle zur Partiedatenbank, um die aktualisierte Sammlung zu sehen.</p>
        </div>}
      </div>
      <div className="panel-box">
        <div className="panel-box-title">SCID (.si4)</div>
        <p className="page-prose">
          SCID-Datenbanken können derzeit nur über die Kommandozeile importiert werden:{" "}
          <code>kibitz-cli import-si4 &lt;base&gt;</code> wandelt eine .si4/.sg4/.sn4-Datenbank in die
          SQLite-Datenbank um, die Kibitz öffnen kann. Vorhandene Engineanalysen bleiben
          erhalten; neue Analysen ersetzen sie nicht durch Löschung.
        </p>
      </div>
    </div>
  );
}
