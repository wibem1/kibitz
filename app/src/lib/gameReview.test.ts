import { describe, expect, it } from "vitest";
import { reviewGame } from "./gameReview";
import type { AnalysisRow } from "./analyses";

const row = (ply: number, cp: number): AnalysisRow => ({
  ply, kind: "legacy-import", engine: "fixture", depth: 15, nodes: 1000,
  evalCp: cp, createdAt: "2026-11-12",
});

describe("whole-game error classification", () => {
  it("measures score losses from the side that actually moved", () => {
    // White blunders 250 cp; Black makes an 80 cp inaccuracy.
    const review = reviewGame(["e4", "e5"], [row(0, 0), row(1, -250), row(2, -170)]);
    expect(review.eligibleMoves).toBe(2);
    expect(review.moments).toMatchObject([
      { ply: 1, severity: "Grober Fehler", lossCp: 250 },
      { ply: 2, severity: "Ungenauigkeit", lossCp: 80 },
    ]);
    expect(review.keyMoments[0].ply).toBe(1);
  });

  it("never invents errors across missing evaluation gaps", () => {
    const review = reviewGame(["e4", "e5", "Nf3"], [row(0, 0), row(2, -300), row(3, -500)]);
    expect(review.eligibleMoves).toBe(1);
    expect(review.moments.map((m) => m.ply)).toEqual([3]);
    expect(review.coverage).toBeCloseTo(1 / 3);
  });

  it("handles empty analysis without dividing by zero", () => {
    expect(reviewGame([], []).coverage).toBe(0);
    expect(reviewGame(["e4"], []).keyMoments).toEqual([]);
  });

  it("uses fresh side-to-move evaluations correctly and prefers them", () => {
    const fresh: AnalysisRow = { ...row(1, 140), kind: "fresh" };
    const review = reviewGame(["e4"], [row(0, 0), row(1, 0), fresh]);
    expect(review.moments[0]).toMatchObject({ lossCp: 140, severity: "Fehler" });
  });
});
