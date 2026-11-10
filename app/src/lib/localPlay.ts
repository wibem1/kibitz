/** Local two-person game model: no engine, API, network or database required. */
import { Chess, normalizeMove } from "chessops/chess";
import { chessgroundDests } from "chessops/compat";
import { makeFen, parseFen } from "chessops/fen";
import { makeSan } from "chessops/san";
import { makeUci, parseSquare } from "chessops/util";
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

export function undoLocalMove(game: LocalGame): LocalGame {
  if (game.sans.length === 0) return game;
  return {
    fens: game.fens.slice(0, -1),
    sans: game.sans.slice(0, -1),
    ucis: game.ucis.slice(0, -1),
  };
}

export function localPgn(game: LocalGame): string {
  const moves = game.sans.map((san, i) =>
    i % 2 === 0 ? `${Math.floor(i / 2) + 1}. ${san}` : san,
  ).join(" ");
  return [
    '[Event "Kibitz DE – Offline-Partie"]',
    '[Site "Lokal"]',
    '[White "Weiß"]',
    '[Black "Schwarz"]',
    '[Result "*"]',
    "",
    moves ? `${moves} *` : "*",
    "",
  ].join("\n");
}
