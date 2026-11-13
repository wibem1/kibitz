/**
 * Settings — DATABASE STORAGE (2026-07-29): shows where the open
 * database lives, warns when that is inside a cloud-synced folder, and
 * offers the one-click move into app storage. The backend snapshot
 * (`VACUUM INTO`) refuses while a sync or analysis batch is writing;
 * the old file is left untouched as a backup.
 */
import { useEffect, useState } from "react";
import { fetchDbSummary, saveDbPath } from "../lib/db";
import { isCloudSyncedPath, migrateDatabaseToAppStorage } from "../lib/storage";

export default function StorageSection() {
  const [path, setPath] = useState<string | null>(null);
  const [moving, setMoving] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDbSummary()
      .then((s) => setPath(s.path))
      .catch(() => setPath(null));
  }, []);

  const cloud = path !== null && isCloudSyncedPath(path);
  // Both identifiers: the bundle ID changed for Developer ID signing and
  // an install can be a launch away from having its directory adopted.
  const inAppStorage =
    path !== null &&
    !cloud &&
    (path.includes("org.kibitzchess.kibitz") ||
      path.includes("org.kibitzchess.app"));

  const move = async () => {
    setMoving(true);
    setError(null);
    try {
      const r = await migrateDatabaseToAppStorage();
      setPath(r.newPath);
      saveDbPath(r.newPath); // localStorage fallback follows the move
      setNote(
        `Datenbank verschoben. Die alte Datei unter ${r.oldPath} bleibt als Sicherung erhalten. Entferne sie (und die ` +
          `zugehörigen -wal/-shm-Dateien) erst nach erfolgreicher Prüfung, sonst synchronisiert Dropbox sie weiter.`,
      );
    } catch (e) {
      setError(String(e));
    } finally {
      setMoving(false);
    }
  };

  return (
    <>
      <div className="set-row">
        <div className="set-label">Datenbank-Speicherort</div>
        <div className="set-value mono">{path ?? "Keine Datenbank geöffnet"}</div>
      </div>
      {cloud && (
        <div className="set-row">
          <div className="set-label" />
          <div className="storage-warning">
            Die Datenbank liegt in einem <strong>synchronisierten Cloud-Ordner</strong>.
            Das Hochladen bei jeder Änderung kann den Rechner belasten. Gleichzeitiger
            Cloud-Abgleich kann eine laufende Datenbank beschädigen.
            <button
              className="btn-secondary storage-move"
              disabled={moving}
              onClick={() => void move()}
            >
              {moving ? "Wird verschoben …" : "In App-Speicher verschieben"}
            </button>
          </div>
        </div>
      )}
      {inAppStorage && (
        <div className="set-row">
          <div className="set-label" />
          <div className="set-help">
            Die Datenbank liegt im lokalen App-Speicher und wird nicht automatisch synchronisiert.
          </div>
        </div>
      )}
      {note && (
        <div className="set-row">
          <div className="set-label" />
          <div className="set-help">{note}</div>
        </div>
      )}
      {error && (
        <div className="set-row">
          <div className="set-label" />
          <div className="sync-error">{error}</div>
        </div>
      )}
    </>
  );
}
