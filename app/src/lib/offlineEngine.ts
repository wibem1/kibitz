/** One bounded Stockfish move, isolated from the regular analysis engine. */
import { invoke } from "@tauri-apps/api/core";

export function requestOfflineEngineMove(
  fen: string,
  nodes = 20_000,
  userPath = "",
): Promise<string> {
  return invoke<string>("offline_engine_move", {
    fen,
    nodes,
    userPath: userPath.trim() || null,
  });
}
