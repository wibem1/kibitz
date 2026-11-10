/** Offline pass-and-play: deliberately isolated from Lichess and engines. */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Board, { type BoardMovable } from "./Board";
import ScreenHeader from "./shell/ScreenHeader";
import { usePromotionPicker } from "./PromotionPicker";
import type { PromoRole } from "./lib/promotion";
import type { BoardTreatmentChoice } from "./lib/gameView";
import { restoreOfflineSession, storeOfflineSession } from "./lib/offlineSession";
import { requestOfflineEngineMove } from "./lib/offlineEngine";
import { getSavedEnginePath } from "./lib/engine";
import {
  localLegalMoves, localPgn, localPosition, localResultText, newLocalGame,
  playLocalMove, playLocalUci, undoLocalTurn,
} from "./lib/localPlay";

interface Props { treatment: BoardTreatmentChoice }

export default function OfflinePlayView({ treatment }: Props) {
  const [restored] = useState(() => {
    try { return restoreOfflineSession(window.localStorage); }
    catch { return restoreOfflineSession({ getItem: () => { throw Error("blocked"); }, setItem: () => {} }); }
  });
  const [game, setGame] = useState(restored.game);
  const [flipped, setFlipped] = useState(restored.flipped);
  const [notice, setNotice] = useState(restored.warning ?? "");
  const [confirmNew, setConfirmNew] = useState(false);
  const [opponent, setOpponent] = useState<"human" | "stockfish">(restored.opponent);
  const [humanColor, setHumanColor] = useState<"white" | "black">(restored.humanColor);
  const [thinking, setThinking] = useState(false);
  const [failedFen, setFailedFen] = useState<string | null>(null);
  useEffect(() => {
    let saved = false;
    try { saved = storeOfflineSession(window.localStorage, game, flipped, opponent, humanColor); }
    catch { saved = false; }
    if (!saved) {
      setNotice("Automatisches Speichern ist auf diesem Rechner nicht verfügbar. Bitte die Partie als PGN sichern.");
    }
  }, [game, flipped, opponent, humanColor]);
  const pos = useMemo(() => localPosition(game), [game]);
  const completed = pos.isEnd();
  const fen = game.fens[game.fens.length - 1];
  const engineTurn = opponent === "stockfish" && !completed && pos.turn !== humanColor;

  useEffect(() => {
    if (!engineTurn || failedFen === fen) return;
    let cancelled = false;
    setThinking(true);
    let path = "";
    try { path = getSavedEnginePath(); } catch { /* use default binary search */ }
    requestOfflineEngineMove(fen, 20_000, path)
      .then((uci) => {
        if (cancelled) return;
        setThinking(false);
        const next = playLocalUci(game, uci);
        if (!next) {
          setFailedFen(fen);
          setNotice("Stockfish hat einen ungültigen Zug gemeldet.");
        } else {
          setGame(next);
          setNotice("");
        }
      })
      .catch((error) => {
        if (cancelled) return;
        setThinking(false);
        setFailedFen(fen);
        setNotice(`Stockfish konnte nicht ziehen: ${String(error)}`);
      });
    return () => { cancelled = true; };
  }, [engineTurn, failedFen, fen, game]);
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
      <ScreenHeader title="Offline spielen" subtitle="Gegen einen Menschen oder Stockfish · ohne Internetverbindung" />
      <div className="page-scroll">
        <div className="play-page">
          <div className="play-columns">
            <div className="play-board-col">
              <div className="play-player">
                {thinking ? "Stockfish überlegt…" : localResultText(game)}
              </div>
              <div style={{ position: "relative" }}>
                <Board fen={fen} movable={movable} lastMove={lastMove}
                  orientation={flipped ? "black" : "white"} treatment={treatment} />
                {promo.element}
              </div>
              <div className="play-actions">
                <button className="btn-secondary" onClick={() => setFlipped((v) => !v)}>Brett drehen</button>
                <button className="btn-secondary"
                  disabled={game.sans.length === 0 || (opponent === "stockfish" && undoLocalTurn(game, opponent, humanColor) === game)}
                  onClick={() => {
                    setGame(undoLocalTurn(game, opponent, humanColor));
                    setFailedFen(null);
                    setThinking(false);
                    setNotice("");
                  }}>
                  Zug zurücknehmen
                </button>
                <button className="btn-primary" onClick={savePgn}>PGN speichern</button>
              </div>
              {notice && <p role="status">{notice}</p>}
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
                    onChange={(e) => { setOpponent(e.target.value as "human" | "stockfish"); setFailedFen(null); }}>
                    <option value="human">Zwei Menschen</option>
                    <option value="stockfish">Stockfish (offline)</option>
                  </select>
                </label>
                {opponent === "stockfish" && (
                  <label>Meine Farbe{" "}
                    <select value={humanColor} disabled={game.sans.length > 0 || thinking}
                      onChange={(e) => { setHumanColor(e.target.value as "white" | "black"); setFailedFen(null); }}>
                      <option value="white">Weiß</option>
                      <option value="black">Schwarz</option>
                    </select>
                  </label>
                )}
                <div className="sync-card-head">PARTIEVERLAUF</div>
                <p className="sync-blurb">
                  {opponent === "human" ? "Die Figuren werden abwechselnd von beiden Spielern gezogen." : "Du spielst gegen Stockfish. Die Engine wird nur für ihre eigenen Züge gestartet."}
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
