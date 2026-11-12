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
  opponent?: "human" | "stockfish" | "maia2";
  humanColor?: "white" | "black";
}

export interface OfflineRestore {
  game: LocalGame;
  flipped: boolean;
  opponent: "human" | "stockfish" | "maia2";
  humanColor: "white" | "black";
  warning: string | null;
}

export interface OfflineStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function fresh(warning: string | null = null): OfflineRestore {
  return { game: newLocalGame(), flipped: false, opponent: "human", humanColor: "white", warning };
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
    if (candidate.opponent !== undefined && candidate.opponent !== "human" && candidate.opponent !== "stockfish" && candidate.opponent !== "maia2") throw Error("Invalid opponent");
    if (candidate.humanColor !== undefined && candidate.humanColor !== "white" && candidate.humanColor !== "black") throw Error("Invalid color");
    return { game, flipped: candidate.flipped as boolean,
      opponent: (candidate.opponent ?? "human") as "human" | "stockfish" | "maia2",
      humanColor: (candidate.humanColor ?? "white") as "white" | "black",
      warning: null };
  } catch {
    return fresh("Der gespeicherte Partiestand ist ungültig. Eine neue Partie wurde geöffnet.");
  }
}

export function encodeOfflineSave(game: LocalGame, flipped: boolean, opponent: "human" | "stockfish" | "maia2" = "human", humanColor: "white" | "black" = "white"): string {
  const data: OfflineSave = { version: 1, moves: [...game.ucis], flipped, opponent, humanColor };
  return JSON.stringify(data);
}

export function restoreOfflineSession(storage: OfflineStorage): OfflineRestore {
  try {
    return decodeOfflineSave(storage.getItem(OFFLINE_SAVE_KEY));
  } catch {
    return fresh("Der gespeicherte Partiestand konnte nicht gelesen werden.");
  }
}

export function storeOfflineSession(storage: OfflineStorage, game: LocalGame, flipped: boolean, opponent: "human" | "stockfish" | "maia2" = "human", humanColor: "white" | "black" = "white"): boolean {
  try {
    storage.setItem(OFFLINE_SAVE_KEY, encodeOfflineSave(game, flipped, opponent, humanColor));
    return true;
  } catch {
    return false;
  }
}
