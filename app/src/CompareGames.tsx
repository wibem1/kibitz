/** A deliberately bounded, real comparison of two saved games.
 * No new engine search: only existing PGN metadata and stored evaluations.
 * The player-wide profile uses a different backend and remains unchanged.
 */
import { useEffect, useState } from "react";
import { evalsByPly } from "./lib/analyses";
import { gameAnalyses, listGames, type GameRow, type GameSortBy } from "./lib/db";
import { dateBoundParam, isValidDateBound } from "./lib/filters";

interface Props { onLoadGameAt: (gameId: number, ply: number) => void }
const PAGE_SIZE = 50;

interface GameComparison {
  game: GameRow;
  positions: number;
  startEval: number | null;
  endEval: number | null;
  moveCount: number;
}

export default function CompareGames({ onLoadGameAt }: Props) {
  const [query, setQuery] = useState("");
  const [dateMin, setDateMin] = useState("");
  const [dateMax, setDateMax] = useState("");
  const [resultFilter, setResultFilter] = useState("");
  const [eco, setEco] = useState("");
  const [sortBy, setSortBy] = useState<GameSortBy>("date");
  const [descending, setDescending] = useState(true);
  const [page, setPage] = useState(0);
  const [games, setGames] = useState<GameRow[]>([]);
  const [total, setTotal] = useState(0);
  const [chosen, setChosen] = useState<GameRow[]>([]);
  const [results, setResults] = useState<GameComparison[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    if (!isValidDateBound(dateMin) || !isValidDateBound(dateMax)) {
      setGames([]);
      setTotal(0);
      setError("Datum bitte als JJJJ, JJJJ.MM oder JJJJ.MM.TT eingeben.");
      return () => { cancelled = true; };
    }
    listGames({
      playerSubstring: query.trim() || undefined,
      dateMin: dateBoundParam(dateMin),
      dateMax: dateBoundParam(dateMax),
      result: resultFilter || undefined,
      eco: eco.trim() || undefined,
    }, page * PAGE_SIZE, PAGE_SIZE, { by: sortBy, descending })
      .then((v) => { if (!cancelled) { setGames(v.rows); setTotal(v.total); } })
      .catch((e) => { if (!cancelled) { setGames([]); setTotal(0); setError(String(e)); } });
    return () => { cancelled = true; };
  }, [query, dateMin, dateMax, resultFilter, eco, sortBy, descending, page]);

  const toggle = (g: GameRow) => {
    setResults(null);
    setChosen((previous) => previous.some((x) => x.id === g.id)
      ? previous.filter((x) => x.id !== g.id)
      : previous.length < 2 ? [...previous, g] : previous);
  };

  const compare = async () => {
    if (chosen.length !== 2) return;
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const out = await Promise.all(chosen.map(async (game) => {
        const evals = evalsByPly(await gameAnalyses(game.id));
        const ordered = [...evals].sort((a, b) => a[0] - b[0]);
        return {
          game, positions: evals.size, moveCount: Math.ceil(game.plyCount / 2),
          startEval: ordered.length ? ordered[0][1].whiteCp : null,
          endEval: ordered.length ? ordered[ordered.length - 1][1].whiteCp : null,
        };
      }));
      setResults(out);
    } catch (e) { setError(String(e)); }
    finally { setLoading(false); }
  };

  const formatEval = (cp: number | null) => cp === null
    ? "Nicht vorhanden" : `${cp >= 0 ? "+" : ""}${(cp / 100).toFixed(2)} (aus Sicht von Weiß)`;

  return (
    <section className="pf2-build" aria-label="Zwei Partien vergleichen">
      <p className="pf2-build-prose">
        Wähle genau zwei Partien aus der Datenbank. Verglichen werden Partiedaten und vorhandene
        Enginebewertungen. Das ist noch kein strategischer KI-Vergleich; die Engine wird nicht gestartet.
      </p>
      <input
        type="search" value={query} placeholder="Partien nach Spieler suchen …"
        aria-label="Partien nach Spieler suchen"
        onChange={(e) => { setQuery(e.target.value); setPage(0); }}
      />
      <div className="pf2-build-row">
        <input aria-label="Datum von" placeholder="Von JJJJ.MM.TT" value={dateMin}
          onChange={(e) => { setDateMin(e.target.value); setPage(0); }} />
        <input aria-label="Datum bis" placeholder="Bis JJJJ.MM.TT" value={dateMax}
          onChange={(e) => { setDateMax(e.target.value); setPage(0); }} />
        <input aria-label="Eröffnung (ECO)" placeholder="ECO z. B. B12" value={eco}
          onChange={(e) => { setEco(e.target.value); setPage(0); }} />
        <select aria-label="Ergebnis" value={resultFilter}
          onChange={(e) => { setResultFilter(e.target.value); setPage(0); }}>
          <option value="">Alle Ergebnisse</option>
          <option value="1-0">1–0</option>
          <option value="0-1">0–1</option>
          <option value="1/2-1/2">½–½</option>
          <option value="*">Offen</option>
        </select>
      </div>
      <div className="pf2-build-row">
        <label htmlFor="compare-sort">Sortieren nach</label>
        <select id="compare-sort" value={sortBy}
          onChange={(e) => { setSortBy(e.target.value as GameSortBy); setPage(0); }}>
          <option value="date">Datum</option>
          <option value="white">Weiß</option>
          <option value="black">Schwarz</option>
          <option value="result">Ergebnis</option>
          <option value="eco">Eröffnung</option>
          <option value="event">Turnier</option>
          <option value="moves">Zugzahl</option>
          <option value="import">Importreihenfolge</option>
        </select>
        <button className="btn-secondary" onClick={() => { setDescending((d) => !d); setPage(0); }}>
          {descending ? "Absteigend ↓" : "Aufsteigend ↑"}
        </button>
        <button className="btn-secondary" onClick={() => {
          setQuery(""); setDateMin(""); setDateMax(""); setEco(""); setResultFilter("");
          setSortBy("date"); setDescending(true); setPage(0);
        }}>Filter zurücksetzen</button>
      </div>
      <p className="hint">{total.toLocaleString("de-DE")} Partien gefunden · {chosen.length} von 2 ausgewählt</p>
      {chosen.length > 0 && <p className="hint">Auswahl: {chosen.map((g) => `${g.white} – ${g.black} (#${g.id})`).join(" · ")}</p>}
      <div style={{ maxHeight: 280, overflowY: "auto" }}>
        {games.map((g) => {
          const checked = chosen.some((x) => x.id === g.id);
          return <label key={g.id} style={{ display: "block", padding: "5px 0" }}>
            <input type="checkbox" checked={checked}
              disabled={!checked && chosen.length === 2}
              onChange={() => toggle(g)} />
            {" "}{g.white} – {g.black} · {g.date ?? "ohne Datum"} · {g.result} · {g.eco ?? "ECO unbekannt"}
          </label>;
        })}
      </div>
      <div className="pf2-build-row">
        <button className="btn-secondary" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Zurück</button>
        <span className="hint">Seite {page + 1} von {Math.max(1, Math.ceil(total / PAGE_SIZE))}</span>
        <button className="btn-secondary" disabled={(page + 1) * PAGE_SIZE >= total} onClick={() => setPage((p) => p + 1)}>Weiter</button>
        <button className="btn-primary" disabled={loading || chosen.length !== 2} onClick={() => void compare()}>
          {loading ? "Vergleich läuft …" : "Zwei Partien vergleichen"}
        </button>
      </div>
      {error && <div className="error">{error}</div>}
      {results && <div className="pf2-grid">
        {results.map((r) => <div key={r.game.id} className="pf2-panel" style={{ padding: 16 }}>
          <strong>{r.game.white} – {r.game.black}</strong>
          <p>Ergebnis: {r.game.result} · Eröffnung: {r.game.eco ?? "Unbekannt"} · {r.moveCount} Züge</p>
          <p>Gespeicherte Stellungsbewertungen: {r.positions} von höchstens {r.game.plyCount + 1} Positionen</p>
          <p>Erste gespeicherte Bewertung: {formatEval(r.startEval)}</p>
          <p>Letzte gespeicherte Bewertung: {formatEval(r.endEval)}</p>
          <button className="btn-secondary" onClick={() => onLoadGameAt(r.game.id, 0)}>Partie öffnen</button>
        </div>)}
      </div>}
      {results && <p className="hint">Direkter Vergleich: {results[0].game.result === results[1].game.result ? "Gleiches Partieergebnis" : "Unterschiedliche Partieergebnisse"} · {results[0].game.eco && results[0].game.eco === results[1].game.eco ? "gleicher ECO-Eröffnungscode" : "unterschiedliche oder unbekannte Eröffnungscodes"} · Zugzahl: {results[0].moveCount} gegenüber {results[1].moveCount}.</p>}
      {results && <p className="hint">Die Bewertungen beziehen sich auf die jeweils erste und letzte vorhandene analysierte Stellung, nicht zwangsläufig auf den Partieanfang oder das Partieende. Unterschiedliche Analyseabdeckung kann den Vergleich einschränken.</p>}
    </section>
  );
}
