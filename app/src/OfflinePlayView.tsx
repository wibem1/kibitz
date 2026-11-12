/** Offline pass-and-play: deliberately isolated from Lichess and engines. */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Board, { type BoardMovable } from "./Board";
import ScreenHeader from "./shell/ScreenHeader";
import { usePromotionPicker } from "./PromotionPicker";
import type { PromoRole } from "./lib/promotion";
import type { BoardTreatmentChoice } from "./lib/gameView";
import { numberedSans, type LoadedGame } from "./lib/game";
import { restoreOfflineSession, storeOfflineSession } from "./lib/offlineSession";
import { requestOfflineEngineMove, offlineEngineError } from "./lib/offlineEngine";
import { importPgnIntoDatabase } from "./lib/db";
import { getSavedEnginePath } from "./lib/engine";
import { offlineBoardSize } from "./lib/offlineLayout";
import { diagnoseEngineFailure, recordDiagnostic } from "./lib/diagnostics";
import {
  localGameFromFen, localLegalMoves, localPgn, localPosition, localResultText, newLocalGame,
  playLocalMove, playLocalUci, undoLocalTurn, type LocalGame,
} from "./lib/localPlay";

interface Props { treatment: BoardTreatmentChoice; onEngineSettings: () => void; onAnalyze: (pgn: string) => void; sourceGame?: LoadedGame | null; sourcePly?: number; onReturnToAnalysis?: () => void; onPlayerStateChange?: (game: LocalGame) => void }

export default function OfflinePlayView({ treatment, onEngineSettings, onAnalyze, sourceGame, sourcePly = 0, onReturnToAnalysis, onPlayerStateChange }: Props) {
  const [restored] = useState(() => {
    if (sourceGame) {
      const seeded = localGameFromFen(sourceGame.fens[Math.max(0, Math.min(sourcePly, sourceGame.sans.length))]);
      const turn = localPosition(seeded).turn;
      return { game: seeded, flipped: turn === "black", opponent: "stockfish" as const,
        humanColor: turn, warning: "Gesamte Partie übernommen. Wähle eine Stellung und starte erst dann das Weiterspielen." };
    }
    try { return restoreOfflineSession(window.localStorage); }
    catch { return restoreOfflineSession({ getItem: () => { throw Error("blocked"); }, setItem: () => {} }); }
  });
  const [game, setGame] = useState(restored.game);
  const [savedFingerprint, setSavedFingerprint] = useState<string | null>(null);
  const [browsePly, setBrowsePly] = useState(() => Math.max(0, Math.min(sourcePly, sourceGame?.sans.length ?? 0)));
  const [browsing, setBrowsing] = useState(Boolean(sourceGame));
  useEffect(() => {
    // A loaded source game is read-only until the user chooses a variation.
    // Only an actually playing continuation becomes the next player snapshot.
    if (!browsing) onPlayerStateChange?.(game);
  }, [browsing, game, onPlayerStateChange]);
  const [flipped, setFlipped] = useState(restored.flipped);
  const [notice, setNotice] = useState(restored.warning ?? "");
  const [databaseSave, setDatabaseSave] = useState<"idle" | "saving" | "saved" | "error">("idle");
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
    // A forked exercise must never overwrite the saved normal offline game.
    if (sourceGame) return;
    let saved = false;
    try { saved = storeOfflineSession(window.localStorage, game, flipped, opponent, humanColor); }
    catch { saved = false; }
    if (!saved) {
      recordDiagnostic("offline_autosave_failure");
      setNotice("Automatisches Speichern ist auf diesem Rechner nicht verfügbar. Bitte die Partie als PGN sichern.");
    }
  }, [game, flipped, opponent, humanColor, sourceGame]);
  const gameFingerprint = useMemo(() => game.fens[0] + "|" + game.ucis.join(","), [game]);
  const savedInDatabase = databaseSave === "saved" && savedFingerprint === gameFingerprint;
  const pos = useMemo(() => localPosition(game), [game]);
  const completed = pos.isEnd();
  const fen = game.fens[game.fens.length - 1];
  const engineTurn = !browsing && opponent !== "human" && !completed && pos.turn !== humanColor;

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
    if (browsing || completed || thinking || engineTurn) return;
    if (!role && promo.guard(fen, from, to)) return;
    const next = playLocalMove(game, from, to, role);
    if (next) {
      setGame(next);
      setNotice("");
    } else {
      setNotice("Dieser Zug ist nicht erlaubt.");
    }
  }, [browsing, completed, thinking, engineTurn, promo, fen, game]);
  moveRef.current = handleMove;
  const legal = useMemo(() => localLegalMoves(game), [game]);
  const movable: BoardMovable | undefined = browsing || completed || thinking || engineTurn ? undefined : {
    color: legal.color, dests: legal.dests, onMove: handleMove,
  };

  const startFromSelectedPly = () => {
    if (!sourceGame) return;
    try {
      const start = localGameFromFen(sourceGame.fens[browsePly]);
      if (localPosition(start).isEnd()) {
        setNotice("Diese Stellung ist bereits eine beendete Partie. Wähle einen früheren Zug.");
        return;
      }
      setGame(start);
      const turn = localPosition(start).turn;
      setHumanColor(turn);
      setFlipped(turn === "black");
      setOpponent("stockfish");
      setBrowsing(false);
      setFailedFen(null);
      setThinking(false);
      setNotice(`Neue Fortsetzung ab Halbzug ${browsePly}. Die Originalpartie bleibt vollständig erhalten.`);
    } catch (e) { setNotice(String(e)); }
  };

  async function saveToDatabase() {
    if (browsing || game.sans.length === 0 || databaseSave === "saving") return;
    const fingerprint = gameFingerprint;
    setDatabaseSave("saving");
    try {
      const report = await importPgnIntoDatabase(
        localPgn(game),
        sourceGame ? "Kibitz DE – Übungsfortsetzung" : "Kibitz DE – Offline-Partie",
      );
      if (report.imported === 1 || report.duplicates >= 1) {
        setSavedFingerprint(fingerprint);
        setDatabaseSave("saved");
        setNotice(report.imported === 1
          ? "Partie dauerhaft in der geöffneten Kibitz-Datenbank gespeichert."
          : "Diese Partie ist bereits in der geöffneten Datenbank vorhanden (Duplikat erkannt).");
      } else {
        setDatabaseSave("error");
        setNotice(`Datenbankspeicherung nicht bestätigt: ${report.failed} Fehler. ${report.failures.join(" · ")}`);
      }
    } catch (e) {
      setDatabaseSave("error");
      setNotice(`Nicht in der Datenbank gespeichert: ${String(e)}. Die Partie bleibt geöffnet; als PGN exportieren ist weiterhin möglich.`);
    }
  }

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
    if (sourceGame) { startFromSelectedPly(); setConfirmNew(false); return; }
    setGame(newLocalGame());
    setNotice("");
    setConfirmNew(false);
    setFailedFen(null);
    setThinking(false);
  }

  return (
    <>
      <ScreenHeader title={sourceGame ? "Partie auf der Spielseite" : "Offline spielen"} subtitle={sourceGame ? "Gesamten Partieablauf durchgehen und ab jeder spielbaren Stellung gegen Stockfish fortsetzen" : "Gegen einen Menschen, Stockfish oder Maia 2 · ohne Internetverbindung"} />
      <div className="page-scroll" ref={scrollRef}>
        <div className="play-page offline-play-page">
          <div className="play-columns">
            <div className="play-board-col" style={{ width: boardSize + 32, maxWidth: "100%" }}>
              <div className="play-player">
                {browsing ? `Originalpartie · Halbzug ${browsePly} von ${sourceGame?.sans.length ?? 0}` : thinking ? `${opponent === "maia2" ? "Maia 2" : "Stockfish"} überlegt…` : localResultText(game)}
              </div>
              <div style={{ position: "relative" }}>
                <Board fen={browsing && sourceGame ? sourceGame.fens[browsePly] : fen} movable={movable} lastMove={browsing && sourceGame && browsePly > 0 ? [sourceGame.ucis[browsePly - 1].slice(0, 2), sourceGame.ucis[browsePly - 1].slice(2, 4)] : lastMove}
                  orientation={flipped ? "black" : "white"} treatment={treatment} size={boardSize} />
                {promo.element}
              </div>
              {sourceGame && <div className="play-actions" aria-label="Originalpartie durchgehen">
                <button className="btn-secondary" disabled={browsePly === 0} onClick={() => setBrowsePly(0)}>|◀</button>
                <button className="btn-secondary" disabled={browsePly === 0} onClick={() => setBrowsePly((p) => Math.max(0, p - 1))}>◀ Zurück</button>
                <span>Originalpartie: {browsePly} / {sourceGame.sans.length} Halbzüge</span>
                <button className="btn-secondary" disabled={browsePly === sourceGame.sans.length} onClick={() => setBrowsePly((p) => Math.min(sourceGame.sans.length, p + 1))}>Weiter ▶</button>
                <button className="btn-secondary" disabled={browsePly === sourceGame.sans.length} onClick={() => setBrowsePly(sourceGame.sans.length)}>▶|</button>
                {browsing && <button className="btn-primary" onClick={startFromSelectedPly}>Ab dieser Stellung gegen Stockfish spielen</button>}
                {onReturnToAnalysis && <button className="btn-secondary" onClick={onReturnToAnalysis}>Zur Partieanalyse zurück</button>}
                {!browsing && <button className="btn-secondary" onClick={() => {
                  setBrowsing(true); setFailedFen(null); setNotice("Wähle eine andere Ausgangsstellung.");
                }}>Andere Ausgangsstellung wählen</button>}
              </div>}
              <div className="play-actions">
                <button className="btn-secondary" onClick={() => setFlipped((v) => !v)}>Brett drehen</button>
                <button className="btn-secondary"
                  disabled={browsing || game.sans.length === 0 || (opponent !== "human" && undoLocalTurn(game, opponent, humanColor) === game)}
                  onClick={() => {
                    setGame(undoLocalTurn(game, opponent, humanColor));
                    setFailedFen(null);
                    setThinking(false);
                    setNotice("");
                  }}>
                  Zug zurücknehmen
                </button>
                <button className="btn-primary" disabled={browsing} onClick={savePgn}>{sourceGame ? "Fortsetzung als PGN speichern" : "PGN speichern"}</button>
                <button className="btn-primary"
                  disabled={browsing || game.sans.length === 0 || databaseSave === "saving" || savedInDatabase}
                  onClick={() => void saveToDatabase()}>
                  {databaseSave === "saving" ? "Speichert …" : savedInDatabase ? "In Datenbank gesichert ✓" : "In Datenbank speichern"}
                </button>
                <button className="btn-secondary" disabled={browsing || game.sans.length === 0}
                  onClick={() => onAnalyze(localPgn(game))}>Partie zur Analyse öffnen</button>
              </div>
              {sourceGame && <p className="sync-blurb">Speicherort: Übungsfortsetzungen sind erst nach bestätigtem Datenbankimport oder PGN-Export dauerhaft gesichert. Die ursprüngliche Partie bleibt unabhängig erhalten.</p>}
              {!sourceGame && <p className="sync-blurb">Speicherort: Die laufende Offline-Partie wird lokal automatisch zwischengespeichert. Mit „In Datenbank speichern“ legst du eine dauerhafte Datenbankkopie an.</p>}
              {!browsing && game.sans.length > 0 && <p role="status">
                Datenbank: {savedInDatabase ? "Diese Fassung gespeichert" : "Aktuelle Fassung nicht in der Datenbank bestätigt"}
              </p>}
              {notice && <p role="status">{notice}</p>
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
                {sourceGame && <p className="sync-blurb">Die vollständige Originalpartie steht hier zur Verfügung. Du kannst zu jeder Stellung springen und von dort eine unabhängige Übungspartie gegen Stockfish beginnen.</p>}
                <label>Gegner{" "}
                  <select value={opponent} disabled={Boolean(sourceGame) || game.sans.length > 0 || thinking}
                    onChange={(e) => { setOpponent(e.target.value as "human" | "stockfish" | "maia2"); setFailedFen(null); }}>
                    <option value="human">Zwei Menschen</option>
                    <option value="stockfish">Stockfish (offline)</option>
                    <option value="maia2">Maia 2 (menschenähnlich)</option>
                  </select>
                </label>
                {opponent !== "human" && (
                  <label>Meine Farbe{" "}
                    <select value={humanColor} disabled={Boolean(sourceGame) || game.sans.length > 0 || thinking}
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
                        placeholder="Integrierte Maia 2 verwenden (leer lassen)" />
                    </label>
                    <p className="sync-blurb">
                      Die Intel-Mac-Testversion enthält Maia 2 bereits. Das Feld darf leer
                      bleiben. Nur für eine eigene Maia-Engine einen Pfad eintragen.
                      Das Elo-Profil ahmt menschliche Zugentscheidungen nach;
                      es ist keine garantierte Spielstärke. Stockfish bleibt unabhängig.
                    </p>
                  </>
                )}
                <div className="sync-card-head">PARTIEVERLAUF</div>
                <p className="sync-blurb">
                  {opponent === "human" ? "Die Figuren werden abwechselnd von beiden Spielern gezogen." : `Du spielst gegen ${opponent === "maia2" ? "Maia 2" : "Stockfish"}. Die Engine wird nur für ihre eigenen Züge gestartet.`}
                  Alle Züge werden auf ihre Rechtmäßigkeit geprüft. {sourceGame ? "Die Originalpartie bleibt erhalten; eigene Fortsetzungen bitte als PGN speichern." : "Die Partie wird auf diesem Rechner automatisch gespeichert."}
                </p>
                {sourceGame && <>
                  <div className="sync-card-head">ÜBERNOMMENE ORIGINALPARTIE</div>
                  <p className="sync-blurb">
                    {sourceGame.headers.White ?? "Weiß"} – {sourceGame.headers.Black ?? "Schwarz"}
                    {" · "}{sourceGame.headers.Result ?? "Ergebnis unbekannt"}
                    {" · "}{sourceGame.sans.length} Halbzüge
                  </p>
                  <div className="play-moves mono" aria-label="Vollständige originale Zugliste">
                    <button className={browsePly === 0 ? "btn-primary" : "btn-secondary"}
                      onClick={() => setBrowsePly(0)}>Start</button>
                    {numberedSans(sourceGame).map((san, i) => <button key={i}
                      className={browsePly === i + 1 ? "btn-primary" : "btn-secondary"}
                      aria-current={browsePly === i + 1 ? "step" : undefined}
                      onClick={() => setBrowsePly(i + 1)}>{san}</button>)}
                  </div>
                  <p className="sync-blurb">Zum Prüfen auf einen Zug klicken. Die ausgewählte Stellung bleibt zum Starten einer neuen Fortsetzung verfügbar.</p>
                  <div className="sync-card-head">EIGENE FORTSETZUNG</div>
                </>}
                <div className="play-moves mono" aria-label="Zugliste">
                  {game.sans.length === 0 ? "Noch keine Züge" :
                    game.sans.map((san, i) => (
                      <span key={i}>{i % 2 === 0 ? `${Math.floor(i / 2) + 1}. ${san}` : san}{" "}</span>
                    ))}
                </div>
                {!browsing && (confirmNew ? (
                  <div className="play-actions">
                    <button className="btn-primary" onClick={startNew}>Neue Partie bestätigen</button>
                    <button className="btn-ghost" onClick={() => setConfirmNew(false)}>Abbrechen</button>
                  </div>
                ) : (
                  <button className="btn-secondary" onClick={() =>
                    game.sans.length ? setConfirmNew(true) : startNew()
                  }>{sourceGame ? "Fortsetzung neu beginnen" : "Neue Partie"}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
