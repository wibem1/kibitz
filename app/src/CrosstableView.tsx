/**
 * Crosstable modal (run 10): players × rounds grid for one event,
 * computed from the games the database actually holds (lib/crosstable.ts
 * owns the layout math). Events without usable round data degrade to the
 * scored player list — points, games, performance — and say so.
 *
 * Opened from the game-view header's event line or a Database row's
 * event cell; clicking any result cell opens that game.
 */
import { useEffect, useState } from "react";
import {
  buildCrosstable,
  crosstableGames,
  formatPoints,
  type Crosstable,
} from "./lib/crosstable";

interface CrosstableViewProps {
  event: string;
  onClose: () => void;
  /** Open a game from a cell (the modal closes itself first). */
  onOpenGame: (gameId: number) => void;
}

export default function CrosstableView({ event, onClose, onOpenGame }: CrosstableViewProps) {
  const [table, setTable] = useState<Crosstable | null>(null);
  const [truncated, setTruncated] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    crosstableGames(event)
      .then((g) => {
        if (cancelled) return;
        setTable(buildCrosstable(g.rows));
        setTruncated(g.total > g.rows.length ? g.total : null);
        setError(null);
      })
      .catch((e) => !cancelled && setError(String(e)));
    return () => {
      cancelled = true;
    };
  }, [event]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const cellButton = (
    c: { gameId: number; opponent: string; score: string; color: "w" | "b" },
    key: number,
  ) => (
    <button
      key={key}
      className={`xt-cell xt-${c.score === "1" ? "win" : c.score === "0" ? "loss" : "rest"}`}
      title={`${c.color === "w" ? "Weiß" : "Schwarz"} vs ${c.opponent} – klicken, um die Partie zu öffnen`}
      onClick={() => onOpenGame(c.gameId)}
    >
      {c.score}
      <span className="xt-cell-opp">{c.opponent.split(",")[0]}</span>
    </button>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal xt-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title xt-title">
          <span>Kreuztabelle – {event}</span>
          {table && (
            <span className="xt-meta">
              {table.games.toLocaleString("de-DE")} {table.games === 1 ? "Partie" : "Partien"} ·{" "}
              {table.players.length} {table.players.length === 1 ? "Spieler" : "Spieler"}
            </span>
          )}
        </div>

        {error && <div className="error">Kreuztabelle konnte nicht geladen werden: {error}</div>}
        {!table && !error && <div className="xt-note">Wird geladen …</div>}

        {table && table.games === 0 && (
          <p className="xt-note">Für dieses Turnier wurden in der geöffneten Datenbank keine Partien gefunden.</p>
        )}

        {table && table.games > 0 && (
          <div className="xt-scroll">
            <table className="xt-table">
              <thead>
                <tr>
                  <th className="xt-rank">#</th>
                  <th className="xt-player">SPIELER</th>
                  <th>ELO</th>
                  <th>PKT</th>
                  <th>PARTIEN</th>
                  <th title="Durchschnittliche Gegner-Elo + 800 × Punktausbeute − 400 (gewertete Partien)">
                    PERF
                  </th>
                  {table.mode === "grid" &&
                    table.rounds.map((r) => <th key={r}>R{r}</th>)}
                  {table.mode === "grid" && table.hasUnrounded && <th title="Partien ohne auswertbare Rundennummer">?</th>}
                </tr>
              </thead>
              <tbody>
                {table.players.map((p, i) => (
                  <tr key={p.name}>
                    <td className="xt-rank">{i + 1}</td>
                    <td className="xt-player">{p.name}</td>
                    <td>{p.elo ?? ""}</td>
                    <td className="xt-pts">
                      {formatPoints(p.points)}
                      <span className="xt-of">/{p.counted}</span>
                    </td>
                    <td>{p.games}</td>
                    <td>{p.perf ?? "—"}</td>
                    {table.mode === "grid" &&
                      p.cells.map((cell, j) => (
                        <td key={j} className="xt-round-cell">
                          {cell.map((c, k) => cellButton(c, k))}
                        </td>
                      ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {table && table.mode === "list" && table.games > 0 && (
          <p className="xt-note">
            Bei den meisten Partien fehlt eine auswertbare Rundennummer. Deshalb wird
            eine Spielerliste mit Punktestand statt einer Rundentabelle angezeigt.
          </p>
        )}
        {truncated !== null && (
          <p className="xt-note">
            Angezeigt werden {table?.games.toLocaleString("de-DE")} von{" "}
            {truncated.toLocaleString("de-DE")} Partien dieses Turniers.
          </p>
        )}

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
}
