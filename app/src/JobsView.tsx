/**
 * Jobs (DATA IN/OUT): the engine job queue — counts, the worker toggle
 * (the only user-initiated engine entry point besides explicit analysis)
 * and the most recent engine identity. Progress is polled app-wide.
 */
import type { JobsStatus } from "./lib/db";

interface JobsViewProps {
  jobs: JobsStatus | null;
  running: boolean;
  onRunJobs: () => void;
  error: string | null;
}

export default function JobsView({ jobs, running, onRunJobs, error }: JobsViewProps) {
  return (
    <div className="page jobs-view">
      <h2 className="page-title">Analyseaufträge</h2>
      <div className="panel-box">
        {jobs ? (
          <table className="data-table jobs-table">
            <tbody>
              <tr>
                <td>Wartend</td>
                <td className="num">{jobs.pending.toLocaleString()}</td>
              </tr>
              <tr>
                <td>Laufend</td>
                <td className="num">{jobs.running.toLocaleString()}</td>
              </tr>
              <tr>
                <td>Erledigt</td>
                <td className="num">{jobs.done.toLocaleString()}</td>
              </tr>
              <tr>
                <td>Fehlgeschlagen</td>
                <td className="num">{jobs.failed.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        ) : (
          <p className="page-prose">Öffne eine Datenbank, um die Analyseaufträge anzuzeigen.</p>
        )}
        <div className="row-gap">
          <button
            className="btn"
            onClick={onRunJobs}
            disabled={!jobs || running || jobs.pending === 0}
          >
            {running ? "Bearbeitung läuft …" : "Wartende Aufträge starten"}
          </button>
          {jobs?.engine && <span className="settings-note">Zuletzt verwendete Engine: {jobs.engine}</span>}
        </div>
        {error && <div className="error">{error}</div>}
        <p className="page-prose">
          Alle Enginearbeiten werden als Aufträge verwaltet – etwa die Prüfung von Kommentaren,
          Neubewertungen und Stapelanalysen. Sie starten erst auf deinen Wunsch.
        </p>
      </div>
    </div>
  );
}
