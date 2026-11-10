/**
 * Settings — Lichess play section (run 10). Own file so the SettingsView
 * diff stays a two-line import+render (other agents add sections too).
 *
 * The token is a SECRET: it is validated and stored Rust-side (app config
 * dir, own file, 0o600 on unix), never in the database, never logged, and
 * never echoed back — this section only ever shows
 * "eingerichtet · endet auf …XXXX" plus the username it authenticated as.
 */
import { useCallback, useEffect, useState } from "react";
import {
  lichessTokenClear,
  lichessTokenSet,
  lichessTokenStatus,
  type LichessTokenStatus,
} from "../lib/lichessPlay";

export default function LichessSection() {
  const [status, setStatus] = useState<LichessTokenStatus | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    lichessTokenStatus()
      .then(setStatus)
      .catch(() => setStatus(null));
  }, []);

  const save = useCallback(async () => {
    if (draft.trim() === "") return;
    setBusy(true);
    setNote(null);
    try {
      const s = await lichessTokenSet(draft);
      setStatus(s);
      setDraft(""); // the secret leaves the DOM immediately
      setNote(`Token gespeichert – angemeldet als ${s.username ?? "?"}.`);
    } catch (e) {
      setNote(`Token konnte nicht gespeichert werden: ${e}`);
    } finally {
      setBusy(false);
    }
  }, [draft]);

  const clear = useCallback(async () => {
    setBusy(true);
    setNote(null);
    try {
      setStatus(await lichessTokenClear());
      setNote("Token entfernt. Laufende Verbindungen werden beendet.");
    } catch (e) {
      setNote(`Entfernen fehlgeschlagen: ${e}`);
    } finally {
      setBusy(false);
    }
  }, []);

  const statusText =
    status === null
      ? "nicht verfügbar"
      : status.configured
        ? `configured · ends in …${status.tokenTail ?? "????"}` +
          (status.username ? ` · angemeldet als ${status.username}` : "")
        : "nicht eingerichtet";

  return (
    <div className="set-group">
      <div className="set-group-head">LICHESS-SPIEL</div>
      <div className="set-row">
        <div>
          <div className="set-label">Zugriffstoken</div>
          <div className="set-help">
            Persönliches Token mit der Berechtigung <b>board:play</b>. Erstelle es unter
            lichess.org → Einstellungen → API-Zugriffstoken. Das Token wird ausschließlich
            auf diesem Gerät gespeichert, nicht in der Datenbank. Während einer Onlinepartie
            ist die Enginehilfe entsprechend den Lichess-Regeln deaktiviert.
          </div>
        </div>
        <div className="set-value-cell">
          <div className="set-value mono">{statusText}</div>
          <input
            className="set-value mono editing"
            type="password"
            value={draft}
            placeholder="Token einfügen (danach nicht erneut sichtbar)"
            spellCheck={false}
            autoComplete="off"
            aria-label="Lichess-Zugriffstoken"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void save()}
          />
        </div>
        <div className="set-actions">
          <button
            className="btn-ghost"
            onClick={() => void save()}
            disabled={busy || draft.trim() === ""}
          >
            {busy ? "Bearbeitung läuft …" : "Token speichern"}
          </button>
          {status?.configured && (
            <button className="btn-ghost" onClick={() => void clear()} disabled={busy}>
              Token entfernen
            </button>
          )}
        </div>
      </div>
      {note && <div className="set-note">{note}</div>}
    </div>
  );
}
