/** Offline pass-and-play: deliberately isolated from Lichess and engines. */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Board, { type BoardMovable } from "./Board";
import ScreenHeader from "./shell/ScreenHeader";
import { usePromotionPicker } from "./PromotionPicker";
import type { PromoRole } from "./lib/promotion";
import type { BoardTreatmentChoice } from "./lib/gameView";
import { restoreOfflineSession, storeOfflineSession } from "./lib/offlineSession";
import {
  localLegalMoves, localPgn, localPosition, localResultText, newLocalGame,
  playLocalMove, undoLocalMove,
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
  useEffect(() => {
    let saved = false;
    try { saved = storeOfflineSession(window.localStorage, game, flipped); }
    catch { saved = false; }
    if (!saved) {
      setNotice("Automatisches Speichern ist auf diesem Rechner nicht verfügbar. Bitte die Partie als PGN sichern.");
    }
  }, [game, flipped]);
  const [confirmNew, setConfirmNew] = useState(false);
  const pos = useMemo(() => localPosition(game), [game]);
  const completed = pos.isEnd();
  const fen = game.fens[game.fens.length - 1];
  const lastUci = game.ucis[game.ucis.length - 1];
  const lastMove: [string, string] | undefined = lastUci
    ? [lastUci.slice(0, 2), lastUci.slice(2, 4)] : undefined;

  const moveRef = useRef<(from: string, to: string, role?: PromoRole) => void>(() => {});
  const promo = usePromotionPicker((from, to, role) => moveRef.current(from, to, role));
  const handleMove = useCallback((from: string, to: string, role?: PromoRole) => {
    if (completed) return;
    if (!role && promo.guard(fen, from, to)) return;
    const next = playLocalMove(game, from, to, role);
    if (next) {
      setGame(next);
      setNotice("");
    } else {
      setNotice("Dieser Zug ist nicht erlaubt.");
    }
  }, [completed, promo, fen, game]);
  moveRef.current = handleMove;
  const legal = useMemo(() => localLegalMoves(game), [game]);
  const movable: BoardMovable | undefined = completed ? undefined : {
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
  }

  return (
    <>
      <ScreenHeader title="Offline spielen" subtitle="Zwei Menschen an einem Rechner · keine Internetverbindung nötig" />
      <div className="page-scroll">
        <div className="play-page">
          <div className="play-columns">
            <div className="play-board-col">
              <div className="play-player">
                {localResultText(game)}
              </div>
              <div style={{ position: "relative" }}>
                <Board fen={fen} movable={movable} lastMove={lastMove}
                  orientation={flipped ? "black" : "white"} treatment={treatment} />
                {promo.element}
              </div>
              <div className="play-actions">
                <button className="btn-secondary" onClick={() => setFlipped((v) => !v)}>Brett drehen</button>
                <button className="btn-secondary" disabled={game.sans.length === 0}
                  onClick={() => { setGame(undoLocalMove(game)); setNotice(""); }}>
                  Zug zurücknehmen
                </button>
                <button className="btn-primary" onClick={savePgn}>PGN speichern</button>
              </div>
              {notice && <p role="status">{notice}</p>}
            </div>
            <div className="play-side-col">
              <div className="sync-card">
                <div className="sync-card-head">PARTIEVERLAUF</div>
                <p className="sync-blurb">
                  Die Figuren werden abwechselnd von beiden Spielern gezogen.
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
