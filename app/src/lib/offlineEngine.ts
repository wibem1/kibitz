/** One bounded Stockfish move, isolated from the regular analysis engine. */
import { invoke } from "@tauri-apps/api/core";

export function requestOfflineEngineMove(
  fen: string,
  nodes = 20_000,
  userPath = "",
  elo: number | null = null,
  opponentEngine: "stockfish" | "maia2" = "stockfish",
  opponentElo: number | null = null,
  plies?: number,
  recentOwnMoves?: Array<{ from: string; to: string }>,
): Promise<string> {
  return invoke<string>("offline_engine_move", {
    fen,
    nodes,
    userPath: userPath.trim() || null,
    elo,
    opponentEngine,
    opponentElo,
    maiaContext: opponentEngine === "maia2"
      ? { plies: plies ?? 0, recentOwnMoves: recentOwnMoves ?? [] }
      : null,
  });
}

/** Explain common local UCI setup failures without exposing backend English.
 * Unexpected errors retain their original text for diagnosis. */
export function offlineEngineError(error: unknown): string {
  const raw = String(error);
  if (raw.includes("No Stockfish binary found") ||
      raw.includes("Configured engine path does not exist")) {
    return "Kein ausführbares Stockfish-Programm gefunden. Öffne die Einstellungen unter „Engine“ und wähle eine zu deinem Computer passende Stockfish-Datei.";
  }
  if (raw.includes("Failed to spawn engine") ||
      raw.includes("Permission denied") ||
      raw.includes("Exec format error")) {
    return "Stockfish konnte nicht gestartet werden. Prüfe in den Einstellungen unter „Engine“, ob die ausgewählte Datei ausführbar und mit deinem Computer kompatibel ist.";
  }
  if (raw.includes("Timed out") || raw.includes("Zeitlimit")) {
    return "Stockfish hat nicht rechtzeitig geantwortet. Prüfe die Engine-Einstellungen und versuche den Zug erneut.";
  }
  return `Stockfish konnte nicht ziehen: ${raw}`;
}
