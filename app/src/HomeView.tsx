/**
 * Home — Direction A, coach-first (design/handoff-2 §Home; maintainer
 * ruling: Direction A ONLY, no A/B switch). Greeting row, three action
 * cards (Continue / Due today / Prep an opponent), findings panel beside
 * the "New since …" + "Running" column.
 *
 * Every element is honest-only: the Continue card exists only when a game
 * was actually opened, findings come only from a cached profile, the
 * tactics numeral is never faked (the queue is endless), and when nothing
 * at all is due the screen degrades to a short honest list — never padded
 * with invented widgets.
 *
 * `HomeContent` is the pure renderer (fixture-testable); the default
 * export fetches the live data.
 */
import { useCallback, useEffect, useState } from "react";
import {
  commitmentGet,
  homeSummary,
  prepStateGet,
  type Commitment,
  type HomeSummary,
  type PrepEntry,
} from "./lib/db";
import {
  commitmentClause,
  findingDotTone,
  findingsProse,
  greetingDate,
  isDegraded,
  networkRunningLine,
  newGamesFoot,
  newSinceLabel,
  sourceTagTone,
} from "./lib/home";
import { utcDateLocal } from "./lib/time";
import type { NetProgress } from "./lib/net";
import type { ViewId, ViewParams } from "./lib/shell";

export interface HomeData {
  summary: HomeSummary;
  commitment: Commitment | null;
  prepState: PrepEntry[];
}

export interface HomeContentProps {
  data: HomeData;
  /** Batch progress 0..1 while the job worker runs (App's model); null
   * when unknown — the Running panel then shows counts only. */
  batchFraction: number | null;
  /** Shared network-worker progress (App's poll): the Running panel must
   * report an active TWIC/account sync, not claim the machine is idle
   * (audit #11). Null when idle/unknown. */
  netProgress: NetProgress | null;
  onNavigate: (view: ViewId, params?: ViewParams) => void;
  /** Open a database game at a ply (Continue card, new-game rows). */
  onOpenGame: (gameId: number, ply: number, flipped?: boolean) => void;
  /** Clock injection for deterministic tests; defaults to now. */
  now?: Date;
}

/** Pure Home renderer — all data via props, no fetching. */
export function HomeContent({
  data,
  batchFraction,
  netProgress,
  onNavigate,
  onOpenGame,
  now,
}: HomeContentProps) {
  const { summary, commitment, prepState } = data;
  const clause = commitmentClause(commitment, prepState);
  const degraded = isDegraded(summary, commitment);
  const [prepQuery, setPrepQuery] = useState("");

  const goPrep = () => {
    onNavigate("prep", prepQuery.trim() ? { opponent: prepQuery.trim() } : undefined);
  };

  const continueCard = summary.lastGame && (
    <div className="home-card accented">
      <div className="home-card-label">WEITERARBEITEN</div>
      <div className="home-card-title">
        {summary.lastGame.white} — {summary.lastGame.black}
      </div>
      <div className="home-card-prose">
        {/* Stored UTC → the user's local date (audit #10). */}
        Bei Halbzug {summary.lastGame.ply} unterbrochen · geöffnet am {utcDateLocal(summary.lastGame.openedAt)}.
      </div>
      <button
        className="btn-primary"
        onClick={() =>
          onOpenGame(summary.lastGame!.id, summary.lastGame!.ply, summary.lastGame!.flipped)
        }
      >
        Analyse fortsetzen
      </button>
    </div>
  );

  if (degraded) {
    // The short honest list (maintainer ruling): no invented widgets.
    return (
      <div className="home">
        <div className="home-greeting">
          <h2 className="home-date">{greetingDate(now ?? new Date())}</h2>
        </div>
        {summary.lastGame && (
          <div className="home-cards" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
            {continueCard}
          </div>
        )}
        <div className="home-degraded">
          <p>Heute keine Aufgaben fällig.</p>
          <p>Diese Woche keine neuen Partien.</p>
          <p>
            <button className="home-link" onClick={() => onNavigate("profile")}>
              Spielprofil erstellen
            </button>{" "}
            und damit Hinweise zu deinem Spiel erhalten.
          </p>
        </div>
      </div>
    );
  }

  const prose = findingsProse(summary.findings);
  const since = newSinceLabel(summary);
  const jobs = summary.runningJobs;
  const engineWorking = jobs.workerActive || jobs.pending > 0 || jobs.running > 0;
  const netLine = networkRunningLine(netProgress);
  const working = engineWorking || netLine !== null;

  return (
    <div className="home">
      <div className="home-greeting">
        <h2 className="home-date">{greetingDate(now ?? new Date())}</h2>
        {clause && <span className="home-clause">{clause}</span>}
      </div>

      <div className="home-cards">
        {continueCard}
        <div className="home-card">
          <div className="home-card-label">HEUTE FÄLLIG</div>
          <div className="home-due-row">
            <span className="home-due-num">{summary.dueSrs}</span>
            <span className="home-due-unit">Eröffnungen</span>
            {/* Tactics have no honest due count (endless queue): grayed, never a number. */}
            <span
              className="home-due-num muted"
              title="Taktikaufgaben sind jederzeit verfügbar und haben keinen Fälligkeitstermin."
            >
              –
            </span>
            <span className="home-due-unit">Taktikaufgaben</span>
          </div>
          <div className="home-card-buttons">
            <button className="btn-secondary" onClick={() => onNavigate("train")}>
              Eröffnungen üben
            </button>
            <button className="btn-secondary" onClick={() => onNavigate("tactics")}>
              Taktik üben
            </button>
          </div>
        </div>
        <div className="home-card">
          <div className="home-card-label">GEGNER VORBEREITEN</div>
          <div className="home-prep-row">
            <input
              type="text"
              value={prepQuery}
              onChange={(e) => setPrepQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && goPrep()}
              placeholder="Gegner suchen …"
              spellCheck={false}
            />
            <button className="btn-secondary" onClick={goPrep}>
              Suchen
            </button>
          </div>
          {prepState.length > 0 && (
            <div className="home-recents">
              Zuletzt: {prepState.map((p) => p.opponent).join(" · ")}
            </div>
          )}
        </div>
      </div>

      <div className="home-lower">
        <div className="home-panel home-findings">
          <div className="home-panel-head">
            <span className="home-panel-title">
              {summary.profilePlayer ? `DEIN SCHACH · ${summary.profilePlayer.toUpperCase()}` : "DEIN SCHACH"}
            </span>
            {summary.profileBuiltAt && (
              <span className="home-pill">Erstellt {utcDateLocal(summary.profileBuiltAt)}</span>
            )}
            <div className="home-panel-spacer" />
            <button className="btn-ghost" onClick={() => onNavigate("profile")}>
              Ganzes Profil
            </button>
          </div>
          {summary.findingsAvailable ? (
            <>
              {prose && <p className="home-prose">{prose}</p>}
              <div className="home-finding-rows">
                {summary.findings.map((f) => (
                  <button
                    key={f.claimId}
                    className="home-finding"
                    onClick={() => onNavigate("profile", { claim: f.claimId })}
                  >
                    <span className={`role-dot ${findingDotTone(f.claimId)}`} />
                    <span className="home-finding-label">{f.label}</span>
                    <span className={`home-finding-value ${findingDotTone(f.claimId)}`}>
                      {f.value}
                    </span>
                    <span className="home-finding-evidence">
                      {f.evidenceCount} {f.evidenceCount === 1 ? "Partie" : "Partien"}
                    </span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <p className="home-prose dim">
              Noch kein Spielprofil erstellt. Ein Profil zeigt dir Hinweise aus gespeicherten
              Partien und Bewertungen – ohne zusätzliche Engineberechnung.
            </p>
          )}
        </div>

        <div className="home-side">
          <div className="home-panel">
            <div className="home-panel-head">
              <span className="home-panel-title">{since ?? "NEU DIESE WOCHE"}</span>
            </div>
            {summary.newGames.length === 0 ? (
              <p className="home-prose dim">Diese Woche keine neuen Partien.</p>
            ) : (
              <>
                <div className="home-new-rows">
                  {summary.newGames.map((g) => (
                    <button key={g.id} className="home-new-row" onClick={() => onOpenGame(g.id, 0)}>
                      <span className={`source-tag ${sourceTagTone(g.sourceKind, g.source)}`}>
                        {g.source}
                      </span>
                      <span className="home-new-title">
                        {g.white} — {g.black}
                      </span>
                      <span className="home-new-result">{g.result}</span>
                    </button>
                  ))}
                </div>
                <div className="home-new-foot">{newGamesFoot(summary)}</div>
              </>
            )}
          </div>
          <div className="home-panel">
            <div className="home-panel-head">
              <span className="home-panel-title">AKTIV</span>
            </div>
            {working ? (
              <>
                {netLine && (
                  <div className="home-progress">
                    <span className="home-progress-label">NETZWERK</span>
                    <span className="home-progress-detail">{netLine}</span>
                  </div>
                )}
                {engineWorking && (
                  <div className="home-progress">
                    <span className="home-progress-label">ENGINEAUFTRÄGE</span>
                    {batchFraction !== null && (
                      <span className="home-progress-track">
                        <span
                          className="home-progress-fill"
                          style={{ width: `${Math.round(batchFraction * 100)}%` }}
                        />
                      </span>
                    )}
                    <span className="home-progress-detail">
                      {batchFraction !== null
                        ? `${Math.round(batchFraction * 100)}%`
                        : `${jobs.pending} offen · ${jobs.running} aktiv`}
                    </span>
                  </div>
                )}
                <p className="home-prose dim">
                  {engineWorking
                    ? jobs.workerActive
                      ? "Die gestarteten Analyseaufträge werden bearbeitet."
                      : "Aufträge warten, die Engine ist derzeit ausgeschaltet."
                    : "Die Konten werden abgeglichen; die Engine bleibt ausgeschaltet."}
                </p>
              </>
            ) : (
              <p className="home-prose dim">Keine laufenden Aufgaben – die Engine ist ausgeschaltet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export interface HomeViewProps {
  /** Bumps when the database (re)opens — triggers a refetch. */
  dbOpen: boolean;
  batchFraction: number | null;
  /** App's shared network-worker poll (see HomeContentProps). */
  netProgress: NetProgress | null;
  onNavigate: (view: ViewId, params?: ViewParams) => void;
  onOpenGame: (gameId: number, ply: number, flipped?: boolean) => void;
}

/** Live Home: fetches home_summary + commitment + prep state. */
export default function HomeView({
  dbOpen,
  batchFraction,
  netProgress,
  onNavigate,
  onOpenGame,
}: HomeViewProps) {
  const [data, setData] = useState<HomeData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    if (!dbOpen) return;
    Promise.all([homeSummary(), commitmentGet().catch(() => null), prepStateGet().catch(() => [])])
      .then(([summary, commitment, prepState]) => {
        setData({ summary, commitment, prepState });
        setError(null);
      })
      .catch((e) => setError(String(e)));
  }, [dbOpen]);

  useEffect(refresh, [refresh]);

  if (!dbOpen) {
    // First-run welcome (2026-07-30, tester feedback: a fresh install
    // lands on an empty Home that reads as broken — "the board is
    // gone"). Say what this is and put the first step ON the screen,
    // not in the status strip.
    return (
      <div className="home">
        <p className="home-prose">
          Willkommen bei Kibitz! Schachbrett, Analyse und Training nutzen eine Partiedatenbank.
          Momentan ist noch keine Datenbank geöffnet.
        </p>
        <p className="home-prose dim">
          Erstelle zuerst eine Datenbank. Danach kannst du PGN-Partien importieren oder
          dein Lichess- bzw. Chess.com-Konto verbinden.
        </p>
        <div className="home-welcome-actions">
          <button className="btn-primary" onClick={() => onNavigate("database")}>
            Datenbank einrichten
          </button>
          <button className="btn-secondary" onClick={() => onNavigate("import")}>
            PGN importieren
          </button>
          <button className="btn-secondary" onClick={() => onNavigate("syncs")}>
            Konto verbinden
          </button>
        </div>
      </div>
    );
  }
  if (!data && !error) {
    return <div className="home"><p className="home-prose dim">Öffne eine Datenbank, um deine Übersicht anzuzeigen.</p></div>;
  }
  if (error) {
    return <div className="home"><p className="home-prose dim">Startseite nicht verfügbar: {error}</p></div>;
  }
  return (
    <HomeContent
      data={data!}
      batchFraction={batchFraction}
      netProgress={netProgress}
      onNavigate={onNavigate}
      onOpenGame={onOpenGame}
    />
  );
}
