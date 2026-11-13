import { describe, expect, it } from "vitest";
import { newLocalGame, playLocalMove } from "./localPlay";
import {
  decodeOfflineSave, encodeOfflineSave, OFFLINE_SAVE_KEY,
  restoreOfflineSession, storeOfflineSession,
} from "./offlineSession";

describe("Offline-Partie automatisch sichern", () => {
  it("speichert und rekonstruiert Züge und gedrehtes Brett", () => {
    let game = newLocalGame();
    game = playLocalMove(game, "e2", "e4")!;
    game = playLocalMove(game, "e7", "e5")!;
    const restored = decodeOfflineSave(encodeOfflineSave(game, true, "stockfish", "black"));
    expect(restored.warning).toBeNull();
    expect(restored.flipped).toBe(true);
    expect(restored.opponent).toBe("stockfish");
    expect(restored.humanColor).toBe("black");
    expect(restored.game).toEqual(game);
  });

  it("speichert und rekonstruiert Maia 2 ohne die Stockfish-Partie zu verändern", () => {
    let game = newLocalGame();
    game = playLocalMove(game, "e2", "e4")!;
    const restored = decodeOfflineSave(encodeOfflineSave(game, false, "maia2", "white"));
    expect(restored.warning).toBeNull();
    expect(restored.opponent).toBe("maia2");
    expect(restored.game).toEqual(game);
  });

  it("leerer Speicher beginnt eine neue Partie", () => {
    expect(decodeOfflineSave(null)).toEqual({
      game: newLocalGame(), flipped: false, opponent: "human", humanColor: "white", warning: null,
    });
  });

  it("weist fehlerhafte und manipulierte Daten zurück", () => {
    const bad = [
      "{", "null", "{}", JSON.stringify({ version: 2, moves: [], flipped: false }),
      JSON.stringify({ version: 1, moves: "e2e4", flipped: false }),
      JSON.stringify({ version: 1, moves: ["e2e5"], flipped: false }),
      JSON.stringify({ version: 1, moves: ["e2e4", "e2e4"], flipped: false }),
      JSON.stringify({ version: 1, moves: [], flipped: "yes" }),
      JSON.stringify({ version: 1, moves: [], flipped: false, opponent: "bot" }),
      JSON.stringify({ version: 1, moves: [], flipped: false, humanColor: "blue" }),
    ];
    for (const data of bad) {
      const restored = decodeOfflineSave(data);
      expect(restored.warning).not.toBeNull();
      expect(restored.game).toEqual(newLocalGame());
    }
  });

  it("speichert im vorgesehenen Schlüssel und liest wieder", () => {
    const items = new Map<string, string>();
    const storage = {
      getItem: (key: string) => items.get(key) ?? null,
      setItem: (key: string, value: string) => { items.set(key, value); },
    };
    const game = playLocalMove(newLocalGame(), "d2", "d4")!;
    expect(storeOfflineSession(storage, game, false)).toBe(true);
    expect(items.has(OFFLINE_SAVE_KEY)).toBe(true);
    expect(restoreOfflineSession(storage).game).toEqual(game);
  });

  it("behandelt verweigerten Speicherzugriff ohne Absturz", () => {
    const storage = {
      getItem: (_key: string): string | null => { throw Error("blocked"); },
      setItem: (_key: string, _value: string): void => { throw Error("blocked"); },
    };
    expect(restoreOfflineSession(storage).warning).not.toBeNull();
    expect(storeOfflineSession(storage, newLocalGame(), false)).toBe(false);
  });
});
