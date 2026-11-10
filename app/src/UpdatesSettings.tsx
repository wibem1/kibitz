/**
 * Settings → UPDATES group (run-8 packaging item). Kept in its own file so
 * SettingsView only gains a one-line import + render (live-analysis work may
 * touch SettingsView concurrently).
 *
 * Honesty rule: while the updater pubkey is still the checked-in placeholder
 * (pre-release builds), the row says "not configured" — the backend
 * short-circuits without any network call. Rows follow the settings grid
 * (230px label+help | 1fr value | 200px action) via the same classnames.
 */
import { useCallback, useState } from "react";
import {
  getLastCheck,
  getSavedUpdateCheck,
  saveUpdateCheck,
  updateCheck,
  type StoredCheck,
} from "./lib/updates";

function describe(check: StoredCheck | null, checking: boolean): string {
  if (checking) return "Prüfung läuft …";
  if (!check) return "Noch nicht geprüft";
  const r = check.result;
  const when = new Date(check.at).toLocaleString("de-DE");
  if (!r.configured) return "Aktualisierungen nicht eingerichtet – Testversion ohne Signaturschlüssel.";
  if (r.error) return `${r.error} (zuletzt versucht: ${when})`;
  if (r.available) return `Aktualisierung verfügbar: ${r.version ?? "?"} (installiert: ${r.current})`;
  return `Aktuell (${r.current}, geprüft: ${when})`;
}

export default function UpdatesSettings() {
  const [enabled, setEnabled] = useState(getSavedUpdateCheck);
  const [last, setLast] = useState<StoredCheck | null>(getLastCheck);
  const [checking, setChecking] = useState(false);

  const toggle = useCallback(() => {
    setEnabled((v) => {
      saveUpdateCheck(!v);
      return !v;
    });
  }, []);

  const checkNow = useCallback(async () => {
    setChecking(true);
    try {
      await updateCheck();
    } catch {
      // Expected outside a Tauri window; the row keeps its last state.
    } finally {
      setLast(getLastCheck());
      setChecking(false);
    }
  }, []);

  return (
    <div className="set-group">
      <div className="set-group-head">AKTUALISIERUNGEN</div>
      <div className="set-row">
        <div>
          <div className="set-label">Auf Aktualisierungen prüfen</div>
          <div className="set-help">
            Beim Start kann einmalig nach einer neuen Version gesucht werden. Es gibt keine laufende Hintergrundprüfung.
            Eine Installation erfolgt nur nach ausdrücklicher Bestätigung.
          </div>
        </div>
        <div className="set-value-cell">
          <div className="set-value">{enabled ? "Beim Start" : "Aus"}</div>
        </div>
        <div className="set-actions">
          <button className="btn-ghost" onClick={toggle}>
            {enabled ? "Ausschalten" : "Einschalten"}
          </button>
        </div>
      </div>
      <div className="set-row">
        <div>
          <div className="set-label">Status</div>
          <div className="set-help">
            Ergebnis der letzten Prüfung. Signierte Aktualisierungen sind erst verfügbar, wenn
            die erforderlichen Schlüssel eingerichtet wurden.
          </div>
        </div>
        <div className="set-value-cell">
          <div className="set-value">{describe(last, checking)}</div>
        </div>
        <div className="set-actions">
          <button className="btn-ghost" onClick={() => void checkNow()} disabled={checking}>
            {checking ? "Prüfung läuft …" : "Jetzt prüfen"}
          </button>
        </div>
      </div>
    </div>
  );
}
