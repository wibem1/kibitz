/** Review of a complete game from stored engine evaluations.
 * A move needs evaluated positions immediately before AND after it.
 * White-POV scores are converted to the perspective of the player moving.
 * This is a centipawn-loss classification, not an Lichess accuracy clone.
 */
import { evalsByPly, type AnalysisRow } from "./analyses";

export type Severity = "Ungenauigkeit" | "Fehler" | "Grober Fehler";
export interface ReviewMoment {
  ply: number;
  san: string;
  severity: Severity;
  lossCp: number;
  beforeCp: number;
  afterCp: number;
}

export interface ReviewResult {
  moments: ReviewMoment[];
  coverage: number;
  eligibleMoves: number;
  totalMoves: number;
  keyMoments: ReviewMoment[];
}

export function reviewGame(sans: readonly string[], rows: readonly AnalysisRow[]): ReviewResult {
  const evals = evalsByPly([...rows]);
  const moments: ReviewMoment[] = [];
  let eligibleMoves = 0;
  for (let ply = 1; ply <= sans.length; ply++) {
    const before = evals.get(ply - 1);
    const after = evals.get(ply);
    if (!before || !after) continue;
    eligibleMoves++;
    const sign = ply % 2 === 1 ? 1 : -1;
    const loss = Math.max(0, (before.whiteCp - after.whiteCp) * sign);
    const severity: Severity | null = loss >= 200 ? "Grober Fehler"
      : loss >= 100 ? "Fehler" : loss >= 50 ? "Ungenauigkeit" : null;
    if (severity) moments.push({
      ply, san: sans[ply - 1], severity, lossCp: loss,
      beforeCp: before.whiteCp, afterCp: after.whiteCp,
    });
  }
  // Highest-impact evaluated mistakes are candidates for key moments, not
  // proof that they are the most instructive strategic turning points.
  const keyMoments = [...moments].sort((a, b) => b.lossCp - a.lossCp || a.ply - b.ply).slice(0, 8);
  return {
    moments, keyMoments, eligibleMoves, totalMoves: sans.length,
    coverage: sans.length ? eligibleMoves / sans.length : 0,
  };
}
