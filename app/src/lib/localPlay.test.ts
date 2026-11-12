import { describe, expect, it } from "vitest";
import { loadGame } from "./game";
import { localGameFromFen, localLegalMoves, localPgn, localPosition, localResult, localResultText, newLocalGame, playLocalMove, playLocalUci, undoLocalMove, undoLocalTurn } from "./localPlay";

describe("Ganze Partie an Spielseite übergeben", () => {
  const imported = loadGame('[White "Test"]\\n[Black "Gegner"]\\n\\n1. e4 e5 2. Nf3 Nc6 3. Bb5 *');
  if (!imported.ok) throw new Error("Testpartie konnte nicht geladen werden");
  const original = imported.game;

  it("stellt jede Hauptlinien-Stellung ohne Änderung an der Originalpartie bereit", () => {
    const before = JSON.stringify(original);
    for (let ply = 0; ply <= original.sans.length; ply++) {
      const exercise = localGameFromFen(original.fens[ply]);
      expect(exercise.fens[0]).toBe(original.fens[ply]);
      expect(exercise.sans).toEqual([]);
      expect(exercise.ucis).toEqual([]);
      expect(localPosition(exercise).turn).toBe(ply % 2 ? "black" : "white");
    }
    expect(JSON.stringify(original)).toBe(before);
  });

  it("startet nach schwarzem Zug eine separate weiße Fortsetzung samt FEN im PGN", () => {
    const start = localGameFromFen(original.fens[2]);
    const continuation = playLocalMove(start, "d2", "d4");
    expect(continuation).not.toBeNull();
    expect(original.sans).toEqual(["e4", "e5", "Nf3", "Nc6", "Bb5"]);
    const pgn = localPgn(continuation!);
    expect(pgn).toContain('[SetUp "1"]');
    expect(pgn).toContain(`[FEN "${original.fens[2]}"]`);
    expect(pgn).toContain("2. d4");
    const reloaded = loadGame(pgn);
    expect(reloaded.ok).toBe(true);
    if (reloaded.ok) expect(reloaded.game.fens.at(-1)).toBe(continuation!.fens.at(-1));
  });

  it("beginnt nach weißem Zug korrekt mit schwarzer Zugnummer", () => {
    const start = localGameFromFen(original.fens[1]);
    const continuation = playLocalMove(start, "c7", "c5");
    expect(continuation).not.toBeNull();
    expect(localPgn(continuation!)).toContain("1... c5");
    expect(original.sans).toHaveLength(5);
  });
});

describe("Offline-Partie für zwei Menschen", () => {
  it("beginnt in der Ausgangsstellung mit legalen weißen Zügen", () => {
    const g = newLocalGame();
    expect(localLegalMoves(g).color).toBe("white");
    expect(localLegalMoves(g).dests.get("e2")).toContain("e4");
  });
  it("prüft Züge und wechselt die Farbe", () => {
    const g = newLocalGame();
    expect(playLocalMove(g, "e2", "e5")).toBeNull();
    const next = playLocalMove(g, "e2", "e4")!;
    expect(next.sans).toEqual(["e4"]);
    expect(localPosition(next).turn).toBe("black");
    expect(g.sans).toHaveLength(0);
  });
  it("prüft Engine-Züge wie menschliche Züge", () => {
    const g = newLocalGame();
    expect(playLocalUci(g, "e2e5")).toBeNull();
    expect(playLocalUci(g, "(none)")).toBeNull();
    const next = playLocalUci(g, "e2e4")!;
    expect(next.sans).toEqual(["e4"]);
    expect(localPosition(next).turn).toBe("black");
  });
  it("nimmt den letzten Zug verlustfrei zurück", () => {
    const g = newLocalGame();
    const next = playLocalMove(g, "e2", "e4")!;
    expect(undoLocalMove(next)).toEqual(g);
    expect(undoLocalMove(g)).toEqual(g);
  });
  it("Stockfish: Weiß nimmt Engine und eigenen Zug zurück", () => {
    const start = newLocalGame();
    const human = playLocalMove(start, "e2", "e4")!;
    const both = playLocalUci(human, "e7e5")!;
    expect(undoLocalTurn(both, "stockfish", "white")).toEqual(start);
    expect(undoLocalTurn(human, "stockfish", "white")).toEqual(start);
    expect(undoLocalTurn(both, "human", "white")).toEqual(human);
  });
  it("Stockfish: Schwarz nimmt eigenen Zug zurück, behält Engine-Eröffnung", () => {
    const start = newLocalGame();
    const engine = playLocalUci(start, "e2e4")!;
    const both = playLocalMove(engine, "e7", "e5")!;
    expect(undoLocalTurn(engine, "stockfish", "black")).toEqual(engine);
    expect(undoLocalTurn(both, "stockfish", "black")).toEqual(engine);
    const engineAgain = playLocalUci(both, "g1f3")!;
    expect(undoLocalTurn(engineAgain, "stockfish", "black")).toEqual(engine);
  });
  it("erzeugt exportierbares PGN", () => {
    let g = newLocalGame();
    g = playLocalMove(g, "e2", "e4")!;
    g = playLocalMove(g, "e7", "e5")!;
    expect(localPgn(g)).toContain("1. e4 e5 *");
    expect(localPgn(g)).toContain('[Result "*"]');
  });
  it("übergibt eine laufende Offline-Partie verlustfrei an die Analyseansicht", () => {
    let g = newLocalGame();
    g = playLocalMove(g, "d2", "d4")!;
    g = playLocalUci(g, "d7d5")!;
    const loaded = loadGame(localPgn(g));
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(loaded.game.ucis).toEqual(g.ucis);
    expect(loaded.game.fens).toEqual(g.fens);
    expect(loaded.game.sans).toEqual(g.sans);
  });
  it("erkennt ein Matt als Partieende", () => {
    let g = newLocalGame();
    for (const [from,to] of [["f2","f3"],["e7","e5"],["g2","g4"],["d8","h4"]]) {
      g = playLocalMove(g,from,to)!;
    }
    expect(localPosition(g).isEnd()).toBe(true);
    expect(localResult(g)).toBe("0-1");
    expect(localResultText(g)).toContain("Schwarz gewinnt");
    expect(localPgn(g)).toContain('[Result "0-1"]');
    expect(localPgn(g)).toContain("Qh4# 0-1");
  });
});
