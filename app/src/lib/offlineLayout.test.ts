import { describe, expect, it } from "vitest";
import { offlineBoardSize } from "./offlineLayout";

describe("Offline chessboard dimensions", () => {
  it("uses the large available area on an Intel Mac window", () => {
    // The screenshot that exposed the 520px default was 1536×~934.
    expect(offlineBoardSize(1536, 934)).toBe(720);
  });

  it("keeps the board smaller when the window is shorter", () => {
    expect(offlineBoardSize(1536, 760)).toBe(560);
  });

  it("keeps an 8px grid and its minimum under tight constraints", () => {
    expect(offlineBoardSize(1200, 720) % 8).toBe(0);
    expect(offlineBoardSize(780, 600)).toBe(496);
  });

  it("ignores move count and status text entirely", () => {
    const before = offlineBoardSize(1440, 900);
    expect(offlineBoardSize(1440, 900)).toBe(before);
  });
});
