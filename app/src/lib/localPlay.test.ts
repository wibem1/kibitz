import { describe, expect, it } from "vitest";
import { localLegalMoves, localPgn, localPosition, localResult, localResultText, newLocalGame, playLocalMove, playLocalUci, undoLocalMove } from "./localPlay";

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
  it("erzeugt exportierbares PGN", () => {
    let g = newLocalGame();
    g = playLocalMove(g, "e2", "e4")!;
    g = playLocalMove(g, "e7", "e5")!;
    expect(localPgn(g)).toContain("1. e4 e5 *");
    expect(localPgn(g)).toContain('[Result "*"]');
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
