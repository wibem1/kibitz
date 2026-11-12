/** Offline pass-and-play: deliberately isolated from Lichess and engines. */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Board, { type BoardMovable } from "./Board";
import ScreenHeader from "./shell/ScreenHeader";
import { usePromotionPicker } from "./PromotionPicker";
import type { PromoRole } from "./lib/promotion";
import type { BoardTreatmentChoice } from "./lib/gameView";
import { restoreOfflineSession, storeOfflineSession } from "./lib/offlineSession";
import { requestOfflineEngineMove, offlineEngineError } from "./lib/offlineEngine";
import { getSavedEnginePath } from "./lib/engine";
import { offlineBoardSize } from "./lib/offlineLayout";
import { diagnoseEngineFailure, recordDiagnostic } from "./lib/diagnostics";
import {
  localLegalMoves, localPgn, localPosition, localResultText, newLocalGame,
  playLocalMove, playLocalUci, undoLocalTurn,
} from "./lib/localPlay";

interface Props { treatment: BoardTreatmentChoice; onEngineSettings: () => void; onAnalyze: (pgn: string) => void }

export default function OfflinePlayView({ treatment, onEngineSettings, onAnalyze }: Props) {
  const [restored] = useState(() => {
    try { return restoreOfflineSession(window.localStorage); }
    catch { return restoreOfflineSession({ getItem: () => { throw Error("blocked"); }, setItem: () => {} }); }
  });
  const [game, setGame] = useState(restored.game);
  const [flipped, setFlipped] = useState(restored.flipped);
  const [notice, setNotice] = useState(restored.warning ?? "");
  const [confirmNew, setConfirmNew] = useState(false);
  const [opponent, setOpponent] = useState<"human" | "stockfish" | "maia2">(restored.opponent);
  const [humanColor, setHumanColor] = useState<"white" | "black">(restored.humanColor);
  const [elo, setElo] = useState<number | null>(() => {
    try {
      const value = window.localStorage.getItem("kibitz.offlineStockfishElo.v1");
      const parsed = value === null || value === "full" ? null : Number(value);
      return parsed !== null && Number.isInteger(parsed) && parsed >= 1320 && parsed <= 3190 ? parsed : null;
    } catch { return null; }
  });
  const [maiaPath, setMaiaPath] = useState(() => {
    try { return window.localStorage.getItem("kibitz.offlineMaia2Path.v1") ?? ""; }
    catch { return ""; }
  });
  const [maiaElo, setMaiaElo] = useState(() => {
    try {
      const parsed = Number(window.localStorage.getItem("kibitz.offlineMaia2Elo.v1"));
      return Number.isInteger(parsed) && parsed >= 1000 && parsed <= 2200 ? parsed : 1500;
    } catch { return 1500; }
  });
  useEffect(() => {
    try {
      window.localStorage.setItem("kibitz.offlineMaia2Path.v1", maiaPath.trim());
      window.localStorage.setItem("kibitz.offlineMaia2Elo.v1", String(maiaElo));
    } catch { /* no storage */ }
  }, [maiaPath, maiaElo]);
  useEffect(() => {
    try { window.localStorage.setItem("kibitz.offlineStockfishElo.v1", elo === null ? "full" : String(elo)); }
    catch { /* private browsing may disable storage */ }
  }, [elo]);
  const [thinking, setThinking] = useState(false);
  const [failedFen, setFailedFen] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  // React can reuse the same .page-scroll DOM node across screens. Reset its
  // former scroll offset before paint, otherwise rank eight starts behind the
  // page header when opening Offline spielen from a scrolled screen.
  useLayoutEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, []);

  // Offline play has its own board layout. Never rely on Board's 520px
  // default: reserve enough room for the move list while using the remaining
  // space in the application window for an actually readable chessboard.
  const [windowSize, setWindowSize] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));
  useEffect(() => {
    const onResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const boardSize = offlineBoardSize(windowSize.width, windowSize.height);
  useEffect(() => {
    let saved = false;
    try { saved = storeOfflineSession(window.localStorage, game, flipped, opponent, humanColor); }
    catch { saved = false; }
    if (!saved) {
      recordDiagnostic("offline_autosave_failure");
      setNotice("Automatisches Speichern ist auf diesem Rechner nicht verfügbar. Bitte die Partie als PGN sichern.");
    }
  }, [game, flipped, opponent, humanColor]);
  const pos = useMemo(() => localPosition(game), [game]);
  const completed = pos.isEnd();
  const fen = game.fens[game.fens.length - 1];
  const engineTurn = opponent !== "human" && !completed && pos.turn !== humanColor;

  useEffect(() => {
    if (!engineTurn || failedFen === fen) return;
    let cancelled = false;
    setThinking(true);
    let path = "";
    try { path = getSavedEnginePath(); } catch { /* use default binary search */ }
    recordDiagnostic("offline_engine_request");
    const selectedPath = opponent === "maia2" ? maiaPath.trim() : path;
    requestOfflineEngineMove(fen, 20_000, selectedPath, opponent === "stockfish" ? elo : null,
      opponent === "maia2" ? "maia2" : "stockfish", opponent === "maia2" ? maiaElo : null)
      .then((uci) => {
        if (cancelled) return;
        setThinking(false);
        const next = playLocalUci(game, uci);
        if (!next) {
          setFailedFen(fen);
          recordDiagnostic("offline_engine_invalid_move");
          setNotice(`${opponent === "maia2" ? "Maia 2" : "Stockfish"} hat einen ungültigen Zug gemeldet.`);
        } else {
          recordDiagnostic("offline_engine_move");
          setGame(next);
          setNotice("");
        }
      })
      .catch((error) => {
        if (cancelled) return;
        setThinking(false);
        setFailedFen(fen);
        recordDiagnostic(diagnoseEngineFailure(error));
        setNotice(opponent === "maia2" ? `Maia 2 konnte nicht ziehen: ${String(error)}` : offlineEngineError(error));
      });
    return () => { cancelled = true; };
  }, [engineTurn, failedFen, fen, game, elo, maiaPath, maiaElo, opponent]);
  const lastUci = game.ucis[game.ucis.length - 1];
  const lastMove: [string, string] | undefined = lastUci
    ? [lastUci.slice(0, 2), lastUci.slice(2, 4)] : undefined;

  const moveRef = useRef<(from: string, to: string, role?: PromoRole) => void>(() => {});
  const promo = usePromotionPicker((from, to, role) => moveRef.current(from, to, role));
  const handleMove = useCallback((from: string, to: string, role?: PromoRole) => {
    if (completed || thinking || engineTurn) return;
    if (!role && promo.guard(fen, from, to)) return;
    const next = playLocalMove(game, from, to, role);
    if (next) {
      setGame(next);
      setNotice("");
    } else {
      setNotice("Dieser Zug ist nicht erlaubt.");
    }
  }, [completed, thinking, engineTurn, promo, fen, game]);
  moveRef.current = handleMove;
  const legal = useMemo(() => localLegalMoves(game), [game]);
  const movable: BoardMovable | undefined = completed || thinking || engineTurn ? undefined : {
    color: legal.color, dests: legal.dests, onMove: handleMove,
  };

  function savePgn() {
    const file = new Blob([localPgn(game)], { type: "application/x-chess-pgn;charset=utf-8" });
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Kibitz-DE-Offline-Partie.pgn";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setNotice("PGN-Datei zum Speichern bereitgestellt.");
  }

  function startNew() {
    setGame(newLocalGame());
    setNotice("");
    setConfirmNew(false);
    setFailedFen(null);
    setThinking(false);
  }

  return (
    <>
      <ScreenHeader title="Offline spielen" subtitle="Gegen einen Menschen, Stockfish oder Maia 2 · ohne Internetverbindung" />
      <div className="page-scroll" ref={scrollRef}>
        <div className="play-page offline-play-page">
          <div className="play-columns">
            <div className="play-board-col" style={{ width: boardSize + 32, maxWidth: "100%" }}>
              <div className="play-player">
                {thinking ? `${opponent === "maia2" ? "Maia 2" : "Stockfish"} überlegt…` : localResultText(game)}
              </div>
              <div style={{ position: "relative" }}>
                <Board fen={fen} movable={movable} lastMove={lastMove}
                  orientation={flipped ? "black" : "white"} treatment={treatment} size={boardSize} />
                {promo.element}
              </div>
              <div className="play-actions">
                <button className="btn-secondary" onClick={() => setFlipped((v) => !v)}>Brett drehen</button>
                <button className="btn-secondary"
                  disabled={game.sans.length === 0 || (opponent !== "human" && undoLocalTurn(game, opponent, humanColor) === game)}
                  onClick={() => {
                    setGame(undoLocalTurn(game, opponent, humanColor));
                    setFailedFen(null);
                    setThinking(false);
                    setNotice("");
                  }}>
                  Zug zurücknehmen
                </button>
                <button className="btn-primary" onClick={savePgn}>PGN speichern</button>
                <button className="btn-secondary" disabled={game.sans.length === 0}
                  onClick={() => onAnalyze(localPgn(game))}>Partie zur Analyse öffnen</button>
              </div>
              {notice && <p role="status">{notice}</p>}
              {opponent === "stockfish" && failedFen === fen && (
                <div className="offline-engine-help">
                  <button className="btn-secondary" onClick={onEngineSettings}>
                    Stockfish in Einstellungen einrichten
                  </button>
                  <p>Auf einem Intel-Mac muss eine passende Stockfish-Engine installiert sein.
                    Falls du Homebrew verwendest: <code>brew install stockfish</code>.
                    Danach unter „Einstellungen → Engineprogramm“ die Engine prüfen.
                    Die App lädt keine Engine ungefragt herunter.</p>
                </div>
              )}
              {engineTurn && failedFen === fen && (
                <button className="btn-secondary" onClick={() => { setFailedFen(null); setNotice(""); }}>
                  Engine-Zug erneut versuchen
                </button>
              )}
            </div>
            <div className="play-side-col">
              <div className="sync-card">
                <div className="sync-card-head">SPIELMODUS</div>
                <label>Gegner{" "}
                  <select value={opponent} disabled={game.sans.length > 0 || thinking}
                    onChange={(e) => { setOpponent(e.target.value as "human" | "stockfish" | "maia2"); setFailedFen(null); }}>
                    <option value="human">Zwei Menschen</option>
                    <option value="stockfish">Stockfish (offline)</option>
                    <option value="maia2">Maia 2 (menschenähnlich, offline)</option>
                  </select>
                </label>
                {opponent !== "human" && (
                  <label>Meine Farbe{" "}
                    <select value={humanColor} disabled={game.sans.length > 0 || thinking}
                      onChange={(e) => { setHumanColor(e.target.value as "white" | "black"); setFailedFen(null); }}>
                      <option value="white">Weiß</option>
                      <option value="black">Schwarz</option>
                    </select>
                  </label>
                )}
                {opponent === "stockfish" && (
                  <label>Stockfish-Spielstärke{" "}
                    <select value={elo === null ? "full" : String(elo)}
                      onChange={(e) => setElo(e.target.value === "full" ? null : Number(e.target.value))}>
                      <option value="1320">1320 Elo – leicht</option>
                      <option value="1500">1500 Elo</option>
                      <option value="1700">1700 Elo</option>
                      <option value="1900">1900 Elo</option>
                      <option value="2100">2100 Elo</option>
                      <option value="2400">2400 Elo</option>
                      <option value="2700">2700 Elo</option>
                      <option value="3000">3000 Elo</option>
                      <option value="full">Volle Stärke</option>
                    </select>
                    <span className="sync-blurb">Stockfish-Elo ist ein Näherungswert, keine garantierte Spielstärke.</span>
                  </label>
                )}
                {opponent === "maia2" && (
                  <>
                    <label>Maia-2-Spielstärke{" "}
                      <select value={maiaElo} disabled={thinking}
                        onChange={(e) => setMaiaElo(Number(e.target.value))}>
                        {[1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000, 2200].map((rating) => (
                          <option key={rating} value={rating}>{rating} Elo</option>
                        ))}
                      </select>
                    </label>
                    <label>Maia-2-Engineprogramm{" "}
                      <input type="text" value={maiaPath} disabled={thinking}
                        onChange={(e) => setMaiaPath(e.target.value)}
                        placeholder="/Pfad/zur/maia2-uci" />
                    </label>
                    <p className="sync-blurb">
                      Maia 2 benötigt eine separat installierte, für deinen Mac passende
                      UCI-Engine. Der Pfad wird nur auf diesem Rechner gespeichert.
                      Das Elo-Profil ahmt menschliche Zugentscheidungen nach; es ist
                      keine garantierte Spielstärke. Stockfish bleibt unabhängig.
                    </p>
                  </>
                )}
                <div className="sync-card-head">PARTIEVERLAUF</div>
                <p className="sync-blurb">
                  {opponent === "human" ? "Die Figuren werden abwechselnd von beiden Spielern gezogen." : `Du spielst gegen ${opponent === "maia2" ? "Maia 2" : "Stockfish"}. Die Engine wird nur für ihre eigenen Züge gestartet.`}
                  Alle Züge werden auf ihre Rechtmäßigkeit geprüft. Die Partie wird auf diesem Rechner automatisch gespeichert.
                </p>
                <div className="play-moves mono" aria-label="Zugliste">
                  {game.sans.length === 0 ? "Noch keine Züge" :
                    game.sans.map((san, i) => (
                      <span key={i}>{i % 2 === 0 ? `${Math.floor(i / 2) + 1}. ${san}` : san}{" "}</span>
                    ))}
                </div>
                {confirmNew ? (
                  <div className="play-actions">
                    <button className="btn-primary" onClick={startNew}>Neue Partie bestätigen</button>
                    <button className="btn-ghost" onClick={() => setConfirmNew(false)}>Abbrechen</button>
                  </div>
                ) : (
                  <button className="btn-secondary" onClick={() =>
                    game.sans.length ? setConfirmNew(true) : startNew()
                  }>Neue Partie</button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
