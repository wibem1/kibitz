/**
 * The game view (design/handoff-1 §Screen 2): header bar → board column
 * (eval bar + walnut board + move controls) → right pane (Explain over
 * Moves). Owns the prose⇄board linkage wiring; all derivations live in
 * lib/gameView.ts.
 */
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { CSSProperties } from "react";
import Board, { type BoardMovable } from "./Board";
import EvalBar from "./EvalBar";
import ExplainPanel from "./ExplainPanel";
import MovesPanel, { type MovesEditing } from "./MovesPanel";
import { evalsByPly, type AnalysisRow } from "./lib/analyses";
import { reviewGame } from "./lib/gameReview";
import {
  annotateGame,
  batchPause,
  exportGamePgn,
  jobsStatus,
  reanalyzeGame,
  runJobs,
  type AnnotateSummary,
  type JobsStatus,
} from "./lib/db";
import { repGlyphsByPly, type RepertoireMark } from "./lib/repMarks";
import {
  analyzeLive,
  analyzePosition,
  getSavedEnginePath,
  onEngineDone,
  onEngineInfo,
  stopAnalysis,
} from "./lib/engine";
import { formatScore, summarizeInfo, type EngineInfo } from "./lib/engineView";
import { boardGeometry } from "./lib/evidence";
import { liveInitial, liveReduce, type LiveEvent } from "./lib/liveAnalysis";
import {
  numberSanLine,
  uciPvToSan,
  PV_DISPLAY_PLIES,
  PV_INSERT_PLIES,
} from "./lib/pv";
import type { VariationPreview } from "./lib/preview";
import {
  COACH_HOVER_INDEX,
  deriveEvidence,
  deriveIntensity,
  fitGameBoardSize,
  selectPlyAnalysis,
  type ExplanationJson,
  type GameViewAction,
  type GameViewState,
} from "./lib/gameView";
import type { LoadedGame } from "./lib/game";
import type { VerificationState } from "./lib/verifyChips";
import {
  gameEngines,
  movesRows,
  movesRowsFromSans,
  type MovesRow,
} from "./lib/movesView";
import { buildAnnView, insertVariation } from "./lib/tokens";
import { crosstableEligible } from "./lib/crosstable";

interface PendingVariation {
  ply: number;
  san: string;
  label: string;
}

interface GameViewProps {
  game: LoadedGame | null;
  fen: string;
  lastMove?: [string, string];
  movable?: BoardMovable;
  /** Promotion picker overlay element (rendered over the board). */
  promoElement: React.ReactNode;
  gv: GameViewState;
  dispatch: (a: GameViewAction) => void;
  plyCount: number;
  /** Database-game context (annotation editing + header actions). */
  gameId: number | null;
  editing: MovesEditing | null;
  analysisRows: AnalysisRow[];
  /** Repertoire marks for the loaded game (empty = no repertoire). */
  repMarks: RepertoireMark[];
  explainOn: boolean;
  explanation: ExplanationJson | null;
  explaining: boolean;
  explainedPlies: number[];
  /** CONSIDER-chip verification state for the current ply (run 11). */
  verification: VerificationState | null;
  onExplain: () => void;
  onExplainGame: () => Promise<void>;
  gameExplainProgress: string | null;
  pendingVar: PendingVariation | null;
  onAcceptVar: () => void;
  onDismissVar: () => void;
  onAddToRepertoire: (color: "white" | "black") => void;
  onReload: () => void;
  onStatus: (s: string) => void;
  /** Variation preview (run-9 round 2): non-null while previewing. */
  preview: VariationPreview | null;
  onPreviewVariation: (row: Extract<MovesRow, { kind: "variation" }>) => void;
  onPreviewStep: (delta: number) => void;
  onExitPreview: () => void;
  /** Event-line click — the parent opens the crosstable modal (run 10). */
  onCrosstable: (event: string) => void;
  onPlayFromPosition: () => void;
}

/** Percent position of a square in the grid for an orientation. */
function squarePos(square: string, flipped: boolean): CSSProperties {
  const f = square.charCodeAt(0) - 97;
  const r = square.charCodeAt(1) - 49;
  const x = flipped ? 7 - f : f;
  const y = flipped ? r : 7 - r;
  return { left: `${x * 12.5}%`, top: `${y * 12.5}%` };
}

/** Square name from a click position inside the grid overlay. */
function squareAt(
  xFrac: number,
  yFrac: number,
  flipped: boolean,
): string | null {
  if (xFrac < 0 || xFrac >= 1 || yFrac < 0 || yFrac >= 1) return null;
  let file = Math.floor(xFrac * 8);
  let rank = 7 - Math.floor(yFrac * 8);
  if (flipped) {
    file = 7 - file;
    rank = 7 - rank;
  }
  return `${String.fromCharCode(97 + file)}${rank + 1}`;
}

export default function GameView({
  game,
  fen,
  lastMove,
  movable,
  promoElement,
  gv,
  dispatch,
  plyCount,
  gameId,
  editing,
  analysisRows,
  repMarks,
  explainOn,
  explanation,
  explaining,
  explainedPlies,
  verification,
  onExplain,
  onExplainGame,
  gameExplainProgress,
  pendingVar,
  onAcceptVar,
  onDismissVar,
  onAddToRepertoire,
  onReload,
  onStatus,
  preview,
  onPreviewVariation,
  onPreviewStep,
  onExitPreview,
  onCrosstable,
  onPlayFromPosition,
}: GameViewProps) {
  const colRef = useRef<HTMLDivElement | null>(null);
  const [boardSize, setBoardSize] = useState(656);

  /* ---- live analysis (run-8): explicit toggle, go-infinite, hard stop ---- */
  const [live, setLive] = useState(liveInitial);
  // Each info payload arrives stamped (by the backend) with the FEN the
  // search was STARTED on, so a stale PV/eval from the previous position
  // is never rendered against the new one — it would flip the score's
  // sign (audit 2026-07 #5) and produce an illegal SAN line. Stamping
  // client-side with "the fen we are currently searching" is NOT enough:
  // infos from a just-stopped search keep streaming after a restart.
  const [liveInfo, setLiveInfo] = useState<{
    info: EngineInfo;
    fen: string;
  } | null>(null);
  const [singleEval, setSingleEval] = useState<{
    fen: string;
    status: "running" | "done" | "error";
    info: EngineInfo | null;
    error?: string;
  } | null>(null);
  const singleEvalRef = useRef<string | null>(null);
  const [engineEventsReady, setEngineEventsReady] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const liveRef = useRef(live);
  liveRef.current = live;
  const liveDispatch = useCallback((event: LiveEvent) => {
    const { next, commands } = liveReduce(liveRef.current, event);
    liveRef.current = next;
    setLive(next);
    if (event.type === "toggle" && next.on) setLiveError(null);
    for (const c of commands) {
      if (c.kind === "stop") {
        void stopAnalysis().catch((e) => onStatus(`Stockfish konnte nicht gestoppt werden: ${String(e)}`));
      } else {
        void analyzeLive(c.fen, getSavedEnginePath()).catch((e) => {
          setLiveError(String(e));
          onStatus(`Stockfish-Live-Analyse fehlgeschlagen: ${String(e)}`);
          liveRef.current = liveInitial;
          setLive(liveInitial);
        });
      }
    }
    if (!next.on) setLiveInfo(null);
  }, [onStatus]);
  useEffect(() => {
    // Follow the shown position while live; no-op when off.
    liveDispatch({ type: "fenChanged", fen });
  }, [fen, liveDispatch]);
  useEffect(() => {
    // Subscribe before enabling explicit position evaluation. Every info
    // is stamped by the backend with the actual FEN searched.
    let cancelled = false;
    let unsubscribeInfo: (() => void) | undefined;
    let unsubscribeDone: (() => void) | undefined;
    Promise.all([
      onEngineInfo((info) => {
        if (liveRef.current.on && info.fen) {
          setLiveInfo({ info, fen: info.fen });
        }
        if (singleEvalRef.current === info.fen) {
          setSingleEval((v) =>
            v?.fen === info.fen ? { ...v, info } : v,
          );
        }
      }),
      onEngineDone((done) => {
        const searchedFen = singleEvalRef.current;
        if (searchedFen === null) {
          // Live mode is unbounded; an unexpected engine-done means
          // the search stopped or failed. Never leave "Engine rechnet"
          // indefinitely without an explanation.
          if (liveRef.current.on) {
            const message = done.error
              ? `Stockfish-Fehler: ${done.error}`
              : "Stockfish hat die Live-Analyse beendet.";
            setLiveError(message);
            liveRef.current = liveInitial;
            setLive(liveInitial);
            onStatus(message);
          }
          return;
        }
        singleEvalRef.current = null;
        setSingleEval((v) => {
          if (v?.fen !== searchedFen) return v;
          if (done.error) return { ...v, status: "error", error: done.error };
          if (!v.info) return {
            ...v, status: "error", error: "Stockfish beendete die Berechnung ohne Stellungsbewertung.",
          };
          return { ...v, status: "done" };
        });
      }),
    ]).then(([unInfo, unDone]) => {
      if (cancelled) { unInfo(); unDone(); }
      else {
        unsubscribeInfo = unInfo;
        unsubscribeDone = unDone;
        setEngineEventsReady(true);
      }
    }).catch((e) => onStatus(`Stockfish-Ereignisse konnten nicht abonniert werden: ${String(e)}`));
    return () => {
      cancelled = true;
      unsubscribeInfo?.();
      unsubscribeDone?.();
    };
  }, [onStatus]);

  const doSingleEvaluation = useCallback(() => {
    if (!engineEventsReady || singleEvalRef.current !== null || liveRef.current.on) return;
    const searchedFen = fen;
    singleEvalRef.current = searchedFen;
    setSingleEval({ fen: searchedFen, status: "running", info: null });
    // A bounded request terminates with engine-done; unlike "go infinite"
    // it produces a stable result for the user's explicit evaluation button.
    void analyzePosition(searchedFen, 250_000, getSavedEnginePath()).catch((e) => {
      if (singleEvalRef.current === searchedFen) {
        singleEvalRef.current = null;
        setSingleEval({ fen: searchedFen, status: "error", info: null, error: String(e) });
      }
    });
  }, [engineEventsReady, fen]);

  useEffect(() => {
    if (singleEvalRef.current !== null && singleEvalRef.current !== fen) {
      singleEvalRef.current = null;
      void stopAnalysis().catch(() => {});
    }
  }, [fen]);
  useEffect(
    () => () => {
      // Unmount (view change / game close) hard-stops the search.
      liveDispatch({ type: "leave" });
    },
    [liveDispatch],
  );

  // Info for the SHOWN position only (see the stamped-fen note above).
  const liveCur = liveInfo && liveInfo.fen === fen ? liveInfo.info : null;
  const currentSingleEval = singleEval?.fen === fen ? singleEval : null;
  // A running engine with no score is not a successful analysis. Make the
  // missing stream visible instead of showing a perpetual "rechnet".
  useEffect(() => {
    if (!live.on || liveCur) return;
    const timeout = window.setTimeout(() => {
      setLiveError((prev) => prev ?? "Stockfish liefert nach 12 Sekunden noch keine Bewertungsdaten. Engine-Pfad und Ereignisübertragung prüfen.");
    }, 12000);
    return () => window.clearTimeout(timeout);
  }, [live.on, liveCur, fen]);
  const pvSans = useMemo(
    () => (liveCur?.pv ? uciPvToSan(fen, liveCur.pv) : []),
    [liveCur, fen],
  );
  const pvLineShort = useMemo(
    () =>
      pvSans.length > 0 ? numberSanLine(fen, pvSans, PV_DISPLAY_PLIES) : "",
    [fen, pvSans],
  );
  const pvLineFull = useMemo(
    () => (pvSans.length > 0 ? numberSanLine(fen, pvSans) : ""),
    [fen, pvSans],
  );
  // "Add as variation": a db game is loaded (editing exists), the PV is
  // non-empty, and there is a mainline move at the current ply to vary.
  // Disabled while previewing a variation (the PV belongs to the preview
  // position, not to any mainline ply).
  const canAddPv =
    editing !== null &&
    pvSans.length > 0 &&
    gv.ply < plyCount &&
    preview === null;
  const addPvAsVariation = () => {
    if (!editing || !liveCur || !canAddPv) return;
    const tag = `ENGINE${liveCur.depth !== undefined ? ` d${liveCur.depth}` : ""} ${formatScore(liveCur, fen)}`;
    editing.onChange(
      insertVariation(
        editing.tokens,
        gv.ply + 1,
        pvSans.slice(0, PV_INSERT_PLIES),
        tag,
      ),
    );
    onStatus(
      `Engine-Variante zu ${game?.sans[gv.ply] ?? "dem nächsten Zug"} eingefügt. Bitte speichern.`,
    );
  };

  const [exportText, setExportText] = useState<string | null>(null);
  const [acting, setActing] = useState(false);

  /* ---- run-9: Re-analyze / Annotate run immediately on click ----
   * An explicit click IS an explicit engine request — the engine-off
   * principle (CLAUDE.md #6) governs defaults, not user actions. The
   * click enqueues AND starts the jobs worker; this inline row shows the
   * batch progressing right here in the game view. */
  interface GameBatch {
    kind: "reanalyze" | "annotate";
    /** Jobs this click enqueued (the label's honest count). */
    positions: number;
    /** pending+running snapshot once the worker was started — the
     * progress base (covers this enqueue plus anything already queued). */
    total: number;
    done: boolean;
  }
  const [gameBatch, setGameBatch] = useState<GameBatch | null>(null);
  const [batchJobs, setBatchJobs] = useState<JobsStatus | null>(null);
  const [pausing, setPausing] = useState(false);

  /** Enqueue happened — start the worker (or join the active one) and
   * snapshot the progress base. Returns true when a worker was already
   * running (our jobs joined its queue). */
  const startGameBatch = async (kind: GameBatch["kind"], positions: number) => {
    let joined = false;
    try {
      await runJobs();
    } catch {
      joined = true;
    }
    const j = await jobsStatus().catch(() => null);
    const total = Math.max(positions, (j?.pending ?? 0) + (j?.running ?? 0));
    setBatchJobs(j);
    setGameBatch({ kind, positions, total, done: false });
    return joined;
  };

  // Poll jobs_status at 1s while our batch runs — the inline row's counts.
  // (App's 3s shell poll stays untouched; this one is scoped to the batch
  // and stops the moment the row reaches its done-state.)
  useEffect(() => {
    if (!gameBatch || gameBatch.done) return;
    let cancelled = false;
    const tick = () => {
      jobsStatus()
        .then((j) => {
          if (!cancelled) setBatchJobs(j);
        })
        .catch(() => {});
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [gameBatch]);

  // Batch completion: worker idle with nothing left → done-state row.
  // App also reloads on worker-idle; onReload here covers a run that
  // finishes between App's 3s polls, so results always appear.
  useEffect(() => {
    if (!gameBatch || gameBatch.done || !batchJobs) return;
    if (
      !batchJobs.workerActive &&
      batchJobs.pending + batchJobs.running === 0
    ) {
      setGameBatch({ ...gameBatch, done: true });
      onReload();
    }
  }, [batchJobs, gameBatch, onReload]);
  useEffect(() => {
    if (!gameBatch?.done) return;
    const t = setTimeout(() => setGameBatch(null), 6000);
    return () => clearTimeout(t);
  }, [gameBatch]);
  // A different game loaded: the row's context is gone.
  useEffect(() => setGameBatch(null), [gameId]);

  const batchRemaining = batchJobs
    ? batchJobs.pending + batchJobs.running
    : null;
  const batchFraction =
    gameBatch === null
      ? 0
      : gameBatch.done || gameBatch.total === 0
        ? 1
        : Math.max(
            0,
            Math.min(
              1,
              1 - (batchRemaining ?? gameBatch.total) / gameBatch.total,
            ),
          );

  const doPauseBatch = async () => {
    setPausing(true);
    try {
      const was = await batchPause();
      onStatus(
        was
          ? "Pausing between jobs — everything unstarted stays pending; Re-analyze or Jobs resumes."
          : "Nothing was running.",
      );
    } catch (e) {
      onStatus(`Pause failed: ${e}`);
    } finally {
      setPausing(false);
    }
  };

  // Resize (deliverable 2c): the board column absorbs extra width; the
  // board snaps to the largest multiple of 8 that fits (min 496).
  //
  // Stable board geometry: measure the BOARD COLUMN, not the remaining
  // flexible stage. Conditional live/preview/explanation rows must never
  // resize or vertically recenter the board when stepping through moves.
  // Keep room for controls and optional strips; on smaller windows the
  // column scrolls instead of cropping the board.
  useLayoutEffect(() => {
    const el = colRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setBoardSize(fitGameBoardSize(r.width, r.height, gv.boardTreatment));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [gv.boardTreatment]);

  // Summary-first (round-3 change note): only the first finding renders
  // until the pinned-foot expander opens the rest — per position, so it
  // resets on every step. The whole-body collapse (header caret) is the
  // fast-stepping state and deliberately SURVIVES steps. Neither state
  // feeds the board: the overlay always shows the union of all findings.
  const [findingsExpanded, setFindingsExpanded] = useState(false);
  useEffect(() => setFindingsExpanded(false), [explanation]);
  const [explainCollapsed, setExplainCollapsed] = useState(false);

  const evidence = useMemo(
    () =>
      explainOn
        ? deriveEvidence(explanation, gv.hoverSentence, {
            previewing: preview !== null,
          })
        : null,
    [explainOn, explanation, gv.hoverSentence, preview],
  );
  const intensity = deriveIntensity(gv.hoverSentence);

  const geo = boardGeometry(boardSize, gv.boardTreatment);
  const gridOffset = { top: geo.framePad, left: geo.framePad + geo.gutter };

  // Square click → selection (ring + prose filter). The overlay covers
  // exactly the grid; clicks bubble up from chessground untouched.
  const gridOverlayRef = useRef<HTMLDivElement | null>(null);
  const onBoardClick = useCallback(
    (e: React.MouseEvent) => {
      const el = gridOverlayRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const sq = squareAt(
        (e.clientX - r.left) / r.width,
        (e.clientY - r.top) / r.height,
        gv.flipped,
      );
      if (sq) dispatch({ type: "selectSquare", square: sq });
    },
    [dispatch, gv.flipped],
  );

  const rows: MovesRow[] = useMemo(() => {
    if (editing && game) {
      const view = buildAnnView(game.fens[0], editing.tokens);
      if (!view.error || view.items.length > 0) {
        return movesRows(
          view,
          game.fens[0],
          gameEngines(analysisRows),
          editing.narrations,
        );
      }
    }
    return game ? movesRowsFromSans(game.sans, game.fens[0]) : [];
  }, [editing, game, analysisRows]);

  const evalsMap = useMemo(() => evalsByPly(analysisRows), [analysisRows]);
  const review = useMemo(() => reviewGame(game?.sans ?? [], analysisRows), [game, analysisRows]);
  const [reviewOpen, setReviewOpen] = useState(false);
  // Marks only render when repertoires exist — no toggle needed (run-9).
  const repGlyphs = useMemo(
    () => (repMarks.length > 0 ? repGlyphsByPly(repMarks) : null),
    [repMarks],
  );
  const evalRow = useMemo(
    () => selectPlyAnalysis(analysisRows, gv.ply),
    [analysisRows, gv.ply],
  );
  // Mate distance for the eval bar, when the current explanation knows it.
  const mate = explanation?.eval?.mate ?? null;

  const step = (delta: number) => dispatch({ type: "step", delta, plyCount });
  const setPly = (ply: number) => dispatch({ type: "setPly", ply, plyCount });

  const headers = game?.headers ?? {};
  const title = game
    ? `${headers["White"] ?? "?"} — ${headers["Black"] ?? "?"}`
    : "Keine Partie geladen";
  const meta = game
    ? [
        [headers["Site"], headers["Date"]?.slice(0, 4)]
          .filter(Boolean)
          .join(", "),
        // "Philidor Defence, C41" when the db resolved the opening name.
        [headers["Opening"], headers["ECO"]].filter(Boolean).join(", "),
        `${game.sans.length} plies`,
        gameId !== null ? `database #${gameId}` : "pasted PGN",
      ]
        .filter(Boolean)
        .join(" · ")
    : "Open a game from the Database, or paste a PGN under Import.";

  const doAnnotate = async () => {
    if (gameId === null) {
      setActing(true);
      try { await onExplainGame(); }
      finally { setActing(false); }
      return;
    }
    setActing(true);
    try {
      const s: AnnotateSummary = await annotateGame(gameId);
      onReload();
      if (s.jobsEnqueued > 0) {
        // Run the confirm jobs now — the click asked for them (run-9).
        const joined = await startGameBatch("annotate", s.jobsEnqueued);
        onStatus(
          `Annotated: ${s.positionsAnalyzed} positions, ${s.screensFired} screens fired, ` +
            `${s.commentsAdded} comments — ${s.jobsEnqueued} engine confirmation(s) ` +
            (joined ? "added to the already-running worker." : "running now."),
        );
      } else {
        onStatus(
          s.screensFired > 0
            ? `Narrations regenerated (${s.commentsAdded} comments over ` +
                `${s.positionsAnalyzed} positions) — all ${s.screensFired} tactical ` +
                `screens were already engine-verified, so nothing changed visibly.`
            : `Annotated: ${s.positionsAnalyzed} positions, ${s.commentsAdded} comments — ` +
                `no tactical screens fired, nothing for the engine to confirm.`,
        );
      }
    } catch (e) {
      onStatus(`Annotate failed: ${e}`);
    } finally {
      setActing(false);
    }
  };
  const doReanalyze = async () => {
    if (gameId === null) return;
    setActing(true);
    try {
      const n = await reanalyzeGame(gameId);
      if (n === 0) {
        onStatus(
          "Nothing to enqueue — every position is already queued or freshly analyzed.",
        );
        return;
      }
      const joined = await startGameBatch("reanalyze", n);
      onStatus(
        `${n} position(s) ` +
          (joined
            ? "added to the already-running worker — progress above."
            : "queued and running now — evals and annotations refresh when it finishes."),
      );
    } catch (e) {
      onStatus(`Re-analyze failed: ${e}`);
    } finally {
      setActing(false);
    }
  };
  const doExport = async () => {
    if (gameId === null) return;
    try {
      setExportText(await exportGamePgn(gameId));
    } catch (e) {
      onStatus(`Export failed: ${e}`);
    }
  };

  return (
    <div className="game-view">
      <header className="header-bar">
        <div className="header-title-block">
          <div className="header-title-row">
            <span className="header-title">{title}</span>
            {game && (
              <span className="header-result">{headers["Result"] ?? ""}</span>
            )}
          </div>
          <div className="header-meta">{meta}</div>
          {game && crosstableEligible(headers["Event"]) && (
            <button
              className="header-event-link"
              title="Kreuztabelle dieses Turniers öffnen"
              onClick={() => onCrosstable(headers["Event"]!)}
            >
              {headers["Event"]} · Kreuztabelle
            </button>
          )}
        </div>
        <div className="header-actions">
          <span className="seg" role="group" aria-label="Brettdarstellung">
            {(["walnut", "instrument"] as const).map((t) => (
              <button
                key={t}
                className={gv.boardTreatment === t ? "cur" : ""}
                onClick={() => dispatch({ type: "setTreatment", treatment: t })}
              >
                {t === "walnut" ? "Holz" : "Neutral"}
              </button>
            ))}
          </span>
          <span className="header-divider" />
          <button
            className="btn"
            onClick={() => void doAnnotate()}
            disabled={!game || acting || gameExplainProgress !== null}
            title={gameId === null ? "Alle Stellungen ohne Datenbank erläutern (ohne Enginebewertung)" : "Die ganze Partie erläutern; taktische Hinweise bei Bedarf mit der Engine prüfen"}
          >
            Partie erläutern
          </button>
          <button
            className="btn"
            onClick={() => gameId === null
              ? doSingleEvaluation()
              : void doReanalyze()}
            disabled={!game || acting || (gameId === null && (!engineEventsReady || live.on || singleEvalRef.current !== null))}
            title={gameId === null ? "Einmalige Stockfish-Bewertung der aktuellen Stellung (250.000 Knoten)" : "Alle Stellungen neu mit der Engine bewerten"}
          >
            {gameId === null ? (currentSingleEval?.status === "running" ? "Stockfish bewertet …" : "Stellung bewerten") : "Neu bewerten"}
          </button>
          <button className="btn" disabled={!game}
            title="Neue Übungspartie ab der angezeigten Stellung gegen Stockfish starten"
            onClick={onPlayFromPosition}>Ab hier gegen Stockfish spielen</button>
          <button className="btn" disabled={!game}
            onClick={() => setReviewOpen((open) => !open)}>
            {reviewOpen ? "Partieübersicht schließen" : "Fehler und Schlüsselstellen"}
          </button>
          <button
            className="btn"
            onClick={() => void doExport()}
            disabled={gameId === null}
          >
            PGN exportieren
          </button>
        </div>
      </header>

      {reviewOpen && game && <section className="game-inline-job" aria-label="Fehler und Schlüsselstellen">
        <h3>Partieauswertung – gespeicherte Enginebewertungen</h3>
        <p>{review.eligibleMoves} von {review.totalMoves} Halbzügen haben Bewertungen unmittelbar davor und danach.
          {review.coverage < 1 ? " Ohne vollständige Bewertungsabdeckung sind die Fehlerzahlen unvollständig." : ""}</p>
        <p>Ungenauigkeiten: {review.moments.filter((m) => m.severity === "Ungenauigkeit").length} ·
          Fehler: {review.moments.filter((m) => m.severity === "Fehler").length} ·
          Grobe Fehler: {review.moments.filter((m) => m.severity === "Grober Fehler").length}</p>
        {review.eligibleMoves === 0 && <p>Keine aufeinanderfolgenden Stellungsbewertungen vorhanden.
          Bei gespeicherten Datenbankpartien zuerst „Neu bewerten“ ausführen. Bei geladenen PGN-Partien
          ist vor einer vollständigen Bewertung ein Datenbankimport erforderlich.</p>}
        <h4>Schlüsselstellen – größte gemessene Bewertungsverluste</h4>
        {review.keyMoments.length === 0 && <p>Keine nachweisbaren Fehlerstellen in den bislang bewerteten Zügen.</p>}
        {review.keyMoments.map((m) => <div key={m.ply} className="play-actions">
          <button className="btn-secondary" onClick={() => setPly(m.ply)}>
            {Math.ceil(m.ply / 2)}{m.ply % 2 === 1 ? "." : "..."} {m.san} · {m.severity} · −{(m.lossCp / 100).toFixed(2)} Bauern
            {" — Stellung zeigen"}
          </button>
        </div>)}
        <h4>Alle erkannten Fehler</h4>
        {review.moments.map((m) => <button key={m.ply} className="btn-secondary"
          onClick={() => setPly(m.ply)}>
          {Math.ceil(m.ply / 2)}{m.ply % 2 === 1 ? "." : "..."} {m.san}: {m.severity}
        </button>)}
        <p>Die Schwellenwerte (0,50/1,00/2,00 Bauern) sind eine einfache Einordnung anhand vorhandener Bewertungen.
          Die Schlüsselstellen sind vorläufig die größten Bewertungsverluste, noch keine strategische KI-Auswahl.
          Auf einen Eintrag klicken, zur Stellung springen und anschließend „Ab hier gegen Stockfish spielen“ wählen.</p>
      </section>}
      {gameExplainProgress && <p role="status" className="game-inline-job">{gameExplainProgress}</p>}
      {gameId === null && currentSingleEval && (
        <div className="game-inline-job" role="status">
          {currentSingleEval.status === "error"
            ? `Stockfish-Fehler: ${currentSingleEval.error}`
            : currentSingleEval.info
              ? `Stockfish: ${formatScore(currentSingleEval.info, fen)}${currentSingleEval.info.depth !== undefined ? ` · Tiefe ${currentSingleEval.info.depth}` : ""}${currentSingleEval.status === "running" ? " · rechnet …" : " · fertig"}`
              : "Stockfish berechnet die Stellung …"}
        </div>
      )}
      {liveError && <p role="alert" className="game-inline-job">{liveError}</p>}
      {gameBatch && (
        <div className="inline-job-row game-inline-job" role="status">
          <span className="inline-job-label">
            {gameBatch.kind === "reanalyze" ? "NEUBEWERTUNG" : "ERLÄUTERUNG"} ·{" "}
            {gameBatch.positions.toLocaleString("en-US")} position
            {gameBatch.positions === 1 ? "" : "s"}
          </span>
          <span className="inline-job-track">
            <span
              className="inline-job-fill"
              style={{ width: `${Math.round(batchFraction * 100)}%` }}
            />
          </span>
          <span className="inline-job-detail">
            {gameBatch.done
              ? "Fertig – Bewertungen und Kommentare aktualisiert"
              : `${Math.round(batchFraction * 100)}% · ${Math.max(
                  0,
                  gameBatch.total - (batchRemaining ?? gameBatch.total),
                ).toLocaleString(
                  "en-US",
                )} / ${gameBatch.total.toLocaleString("en-US")} jobs`}
          </span>
          {gameBatch.done ? (
            <button
              className="btn-ghost"
              onClick={() => setGameBatch(null)}
              title="Schließen"
            >
              ✕
            </button>
          ) : (
            <button
              className="btn-ghost"
              onClick={() => void doPauseBatch()}
              disabled={pausing}
            >
              {pausing ? "Wird pausiert …" : "Pause"}
            </button>
          )}
        </div>
      )}

      <div className="game-main">
        <div className="board-column" ref={colRef}>
          <div className="board-stage">
            <div className="board-row">
              <EvalBar
                row={preview ? null : evalRow}
                mate={preview ? null : mate}
                height={boardSize}
              />
              <div className="board-wrap" onClick={onBoardClick}>
                <Board
                  fen={fen}
                  lastMove={lastMove}
                  movable={movable}
                  orientation={gv.flipped ? "black" : "white"}
                  treatment={gv.boardTreatment}
                  size={boardSize}
                  evidence={evidence}
                  intensity={intensity}
                />
                {/* Selection ring overlay — aligned to the grid, above it. */}
                <div
                  ref={gridOverlayRef}
                  className="board-sel-overlay"
                  style={
                    {
                      top: gridOffset.top,
                      left: gridOffset.left,
                      width: geo.size,
                      height: geo.size,
                      "--sb-cell": `${geo.cell}px`,
                    } as CSSProperties
                  }
                  aria-hidden
                >
                  {gv.selectedSquare && !preview && (
                    <div
                      className="kibitz-mark kibitz-mark-selected"
                      style={squarePos(gv.selectedSquare, gv.flipped)}
                    />
                  )}
                </div>
                {promoElement}
              </div>
            </div>
          </div>

          {preview && (
            <div className="preview-pill" role="status">
              <span className="preview-tag">VARIANTE ANSEHEN</span>
              <span className="preview-label">{preview.label}</span>
              <span className="btn-group preview-nav">
                <button
                  onClick={() => onPreviewStep(-1)}
                  disabled={preview.at === 0}
                  title="In der Variante zurück (←)"
                >
                  ◀
                </button>
                <button
                  onClick={() => onPreviewStep(1)}
                  disabled={preview.at >= preview.sans.length}
                  title="In der Variante vorwärts (→)"
                >
                  ▶
                </button>
              </span>
              <span className="ply-pill">
                Zug {preview.at} / {preview.sans.length}
              </span>
              <button
                className="btn preview-exit"
                onClick={onExitPreview}
                title="Auch Esc beendet die Vorschau"
              >
                ← Zur Partie
              </button>
            </div>
          )}

          <div className="move-controls">
            <span className="btn-group">
              <button
                onClick={() => setPly(0)}
                disabled={!game || gv.ply === 0}
                title="Partieanfang (Pos1)"
              >
                |◀
              </button>
              <button onClick={() => step(-1)} disabled={!game || gv.ply === 0}>
                ◀ Zurück
              </button>
              <button
                onClick={() => step(1)}
                disabled={!game || gv.ply >= plyCount}
              >
                Weiter ▶
              </button>
              <button
                onClick={() => setPly(plyCount)}
                disabled={!game || gv.ply >= plyCount}
                title="Partieende (Ende)"
              >
                ▶|
              </button>
            </span>
            <span className="ply-pill">
              Halbzug {gv.ply} / {plyCount}
            </span>
            <button
              className="btn"
              onClick={() => dispatch({ type: "toggleFlip" })}
            >
              Brett drehen
            </button>
            <button
              className={`btn live-toggle${live.on ? " live-on" : ""}`}
              onClick={() => {
                setLiveError(null);
                liveDispatch({ type: "toggle", fen });
              }}
              title="Fortlaufende Engineanalyse der angezeigten Stellung bis zum Ausschalten"
            >
              {live.on ? "■ Live-Analyse" : "Live-Analyse"}
            </button>
            <span className="kbd-hint">
              ← → Zug · ↑ ↓ 5 Züge · f Brett drehen · e erklären
            </span>
          </div>

          {live.on && (
            <div className="live-strip" role="status">
              <span className="live-dot" aria-hidden />
              {liveCur ? (
                <>
                  <span className="live-score">
                    {formatScore(liveCur, fen)}
                  </span>
                  {liveCur.depth !== undefined && (
                    <span className="live-depth">d{liveCur.depth}</span>
                  )}
                  <span
                    className="live-line"
                    title={
                      pvLineFull
                        ? `${pvLineFull}\n${summarizeInfo(liveCur, fen)}`
                        : summarizeInfo(liveCur, fen)
                    }
                  >
                    {pvLineShort || "…"}
                  </span>
                  <button
                    className="btn live-add"
                    onClick={addPvAsVariation}
                    disabled={!canAddPv}
                    title={
                      canAddPv
                        ? `Die ersten ${Math.min(pvSans.length, PV_INSERT_PLIES)} Halbzüge als Variante einfügen`
                        : editing === null
                          ? "Zum Einfügen einer Variante eine Datenbankpartie öffnen"
                          : preview !== null
                            ? "Zuerst die Variantenvorschau schließen"
                            : gv.ply >= plyCount
                              ? "Am Ende der Hauptvariante ist kein weiterer Zug vorhanden"
                              : "Warte auf die Engine-Variante"
                    }
                  >
                    + Als Variante
                  </button>
                </>
              ) : (
                <span className="live-text">Engine rechnet …</span>
              )}
            </div>
          )}

          {pendingVar && (
            <div className="var-offer">
              <span>
                {pendingVar.label} als Variante zu{" "}
                {game?.sans[pendingVar.ply - 1]}?
              </span>
              <button className="btn" onClick={onAcceptVar}>
                Als Variante einfügen
              </button>
              <button className="btn" onClick={onDismissVar}>
                Verwerfen
              </button>
            </div>
          )}
        </div>

        <div className="right-pane">
          {explainOn && preview && (
            <div className="preview-note">
              Variantenvorschau: Erklärung und Bewertungsanzeige beziehen sich
              weiterhin auf die Hauptvariante.{" "}
              <button onClick={onExitPreview}>Zur Partie</button>
            </div>
          )}
          {explainOn && !preview && (
            <ExplainPanel
              explanation={explanation}
              explaining={explaining}
              verification={verification}
              voice={gv.voice}
              onVoice={(v) => dispatch({ type: "setVoice", voice: v })}
              hoverSentence={gv.hoverSentence}
              onHoverSentence={(i) =>
                dispatch({ type: "hoverSentence", index: i })
              }
              selectedSquare={gv.selectedSquare}
              onExplain={onExplain}
              explainedPlies={explainedPlies}
              findingsExpanded={findingsExpanded}
              onToggleFindings={() => setFindingsExpanded((v) => !v)}
              collapsed={explainCollapsed}
              onToggleCollapsed={() => setExplainCollapsed((v) => !v)}
            />
          )}
          <MovesPanel
            rows={rows}
            currentPly={gv.ply}
            evals={evalsMap}
            annotationMode={gv.annotationMode}
            onAnnotationMode={(m) =>
              dispatch({ type: "setAnnotationMode", mode: m })
            }
            onSelectPly={setPly}
            editing={editing}
            repGlyphs={repGlyphs}
            onPreviewVariation={onPreviewVariation}
            previewVarIndex={preview?.varStartIndex ?? null}
            onNarrationHover={
              // COACH-row hover lights the current ply's evidence union
              // through the ONE hover pipeline (COACH_HOVER_INDEX);
              // meaningless while Explain is off or a preview repaints
              // the board (audit #4 kept: no stale overlays).
              explainOn && !preview
                ? (h) =>
                    dispatch({
                      type: "hoverSentence",
                      index: h ? COACH_HOVER_INDEX : null,
                    })
                : undefined
            }
          />
          {game && game.sans.length > 0 && (
            <div className="rep-footer">
              <span title="Übernimmt die Züge bis zum aktuellen Halbzug als Trainingskarten">
                {gv.ply > 0 ? `Variante (erste ${gv.ply} Halbzüge)` : "Hauptvariante"} →
                Repertoire:
              </span>
              <button onClick={() => onAddToRepertoire("white")}>
                für Weiß
              </button>
              <button onClick={() => onAddToRepertoire("black")}>
                für Schwarz
              </button>
            </div>
          )}
        </div>
      </div>

      {exportText !== null && (
        <div className="modal-overlay" onClick={() => setExportText(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>PGN exportieren</h3>
            <textarea readOnly value={exportText} spellCheck={false} />
            <div className="modal-buttons">
              <button
                className="btn"
                onClick={() => {
                  void navigator.clipboard?.writeText(exportText);
                }}
              >
                Kopieren
              </button>
              <button className="btn" onClick={() => setExportText(null)}>
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
