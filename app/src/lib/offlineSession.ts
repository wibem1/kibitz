/**
 * Versioned on-device autosave for the offline two-person board.
 * Persist UCI moves, not cached FENs: restore replays every move under chess rules.
 */
import { Chess } from "chessops/chess";
import { parseUci } from "chessops/util";
import { makeSanAndPlay } from "chessops/san";
import { makeFen } from "chessops/fen";
import { newLocalGame, type LocalGame } from "./localPlay";

export const OFFLINE_SAVE_KEY = "kibitz.offlineGame.v1";
const MAX_SAVED_PLIES = 2000;

export interface OfflineSave {
  version: 1;
  moves: string[];
  flipped: boolean;
}

export interface OfflineRestore {
  game: LocalGame;
  flipped: boolean;
  warning: string | null;
}

export interface OfflineStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function fresh(warning: string | null = null): OfflineRestore {
  return { game: newLocalGame(), flipped: false, warning };
}

export function decodeOfflineSave(raw: string | null): OfflineRestore {
  if (raw === null) return fresh();
  try {
    const data: unknown = JSON.parse(raw);
    if (typeof data !== "object" || data === null) throw Error("Invalid format");
    const candidate = data as Record<string, unknown>;
    if (candidate.version !== 1 ||
      typeof candidate.flipped !== "boolean" ||
      !Array.isArray(candidate.moves) ||
      candidate.moves.length > MAX_SAVED_PLIES ||
      !candidate.moves.every((m: unknown) => typeof m === "string" && /^[a-h][1-8][a-h][1-8][qrbn]?$/.test(m))) {
      throw Error("Invalid data");
    }
    const pos = Chess.default();
    const game = newLocalGame();
    for (const uci of candidate.moves as string[]) {
      if (pos.isEnd()) throw Error("Move after game end");
      const move = parseUci(uci);
      if (!move || !pos.isLegal(move)) throw Error("Illegal move");
      const san = makeSanAndPlay(pos, move);
      game.ucis.push(uci);
      game.sans.push(san);
      game.fens.push(makeFen(pos.toSetup()));
    }
    return { game, flipped: candidate.flipped as boolean, warning: null };
  } catch {
    return fresh("Der gespeicherte Partiestand ist ungültig. Eine neue Partie wurde geöffnet.");
  }
}

export function encodeOfflineSave(game: LocalGame, flipped: boolean): string {
  const data: OfflineSave = { version: 1, moves: [...game.ucis], flipped };
  return JSON.stringify(data);
}

export function restoreOfflineSession(storage: OfflineStorage): OfflineRestore {
  try {
    return decodeOfflineSave(storage.getItem(OFFLINE_SAVE_KEY));
  } catch {
    return fresh("Der gespeicherte Partiestand konnte nicht gelesen werden.");
  }
}

export function storeOfflineSession(storage: OfflineStorage, game: LocalGame, flipped: boolean): boolean {
  try {
    storage.setItem(OFFLINE_SAVE_KEY, encodeOfflineSave(game, flipped));
    return true;
  } catch {
    return false;
  }
}
