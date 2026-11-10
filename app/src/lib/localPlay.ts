/** Local two-person game model: no engine, API, network or database required. */
import { Chess, normalizeMove } from "chessops/chess";
import { chessgroundDests } from "chessops/compat";
import { makeFen, parseFen } from "chessops/fen";
import { makeSan, makeSanAndPlay } from "chessops/san";
import { makeUci, parseSquare, parseUci } from "chessops/util";
import type { PromoRole } from "./promotion";

export interface LocalGame {
  fens: string[];
  sans: string[];
  ucis: string[];
}

export function newLocalGame(): LocalGame {
  return { fens: [makeFen(Chess.default().toSetup())], sans: [], ucis: [] };
}

export function localPosition(game: LocalGame) {
  const fen = game.fens[game.fens.length - 1];
  const setup = parseFen(fen);
  if (setup.isErr) throw new Error("Ungültige Stellung");
  const result = Chess.fromSetup(setup.unwrap());
  if (result.isErr) throw new Error("Ungültige Stellung");
  return result.unwrap();
}

export function localLegalMoves(game: LocalGame) {
  const pos = localPosition(game);
  return { color: pos.turn, dests: chessgroundDests(pos) };
}

export function playLocalMove(
  game: LocalGame, orig: string, dest: string, promotion?: PromoRole,
): LocalGame | null {
  const pos = localPosition(game);
  const from = parseSquare(orig);
  const to = parseSquare(dest);
  if (from === undefined || to === undefined) return null;
  const move = normalizeMove(pos, { from, to, promotion });
  if (!pos.isLegal(move)) return null;
  const san = makeSan(pos, move);
  const uci = makeUci(move);
  pos.play(move);
  return {
    fens: [...game.fens, makeFen(pos.toSetup())],
    sans: [...game.sans, san],
    ucis: [...game.ucis, uci],
  };
}

/** Validate a UCI bestmove against the exact current position before applying it. */
export function playLocalUci(game: LocalGame, uci: string): LocalGame | null {
  const pos = localPosition(game);
  const move = parseUci(uci);
  if (!move || !pos.isLegal(move) || pos.isEnd()) return null;
  const san = makeSanAndPlay(pos, move);
  return {
    fens: [...game.fens, makeFen(pos.toSetup())],
    sans: [...game.sans, san],
    ucis: [...game.ucis, uci],
  };
}

export function undoLocalMove(game: LocalGame): LocalGame {
  if (game.sans.length === 0) return game;
  return {
    fens: game.fens.slice(0, -1),
    sans: game.sans.slice(0, -1),
    ucis: game.ucis.slice(0, -1),
  };
}

/** Take back to the human's previous decision point in a local engine game.
 * This never leaves the engine to move (which would immediately trigger a replay).
 * Returns the unchanged game if there is no earlier human decision point. */
export function undoLocalTurn(
  game: LocalGame,
  opponent: "human" | "stockfish",
  humanColor: "white" | "black",
): LocalGame {
  if (opponent === "human") return undoLocalMove(game);
  let previous = game;
  for (let i = 0; i < 2 && previous.sans.length > 0; i++) {
    previous = undoLocalMove(previous);
    if (localPosition(previous).turn === humanColor) return previous;
  }
  return game;
}

/** The PGN result is based on the actual final position, never a guessed score. */
export function localResult(game: LocalGame): "1-0" | "0-1" | "1/2-1/2" | "*" {
  const outcome = localPosition(game).outcome();
  if (!outcome) return "*";
  if (!outcome.winner) return "1/2-1/2";
  return outcome.winner === "white" ? "1-0" : "0-1";
}

/** Short localized status derived from the same rules as the PGN export. */
export function localResultText(game: LocalGame): string {
  const pos = localPosition(game);
  const result = localResult(game);
  if (result === "*") return `${pos.turn === "white" ? "Weiß" : "Schwarz"} ist am Zug`;
  if (result === "1/2-1/2") return "Partie beendet – Remis";
  return `Schachmatt – ${result === "1-0" ? "Weiß" : "Schwarz"} gewinnt`;
}

export function localPgn(game: LocalGame): string {
  const result = localResult(game);
  const moves = game.sans.map((san, i) =>
    i % 2 === 0 ? `${Math.floor(i / 2) + 1}. ${san}` : san,
  ).join(" ");
  return [
    '[Event "Kibitz DE – Offline-Partie"]',
    '[Site "Lokal"]',
    '[White "Weiß"]',
    '[Black "Schwarz"]',
    `[Result "${result}"]`,
    "",
    moves ? `${moves} ${result}` : result,
    "",
  ].join("\n");
}
