// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import MovesPanel from "./MovesPanel";
import { movesRowsFromSans, type MovesRow } from "./lib/movesView";
import type { AnnotationMode } from "./lib/gameView";

const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const ROWS = movesRowsFromSans(["e4", "e5", "Nf3", "Nc6", "Bb5", "a6"], START);

function panel(currentPly: number, annotationMode: AnnotationMode = "full") {
  return (
    <MovesPanel
      rows={ROWS}
      currentPly={currentPly}
      evals={null}
      annotationMode={annotationMode}
      onAnnotationMode={() => {}}
      onSelectPly={() => {}}
      editing={null}
    />
  );
}

/** Geometry is mocked because jsdom does not lay out elements.
 * A current move lies outside the panel until the panel scrolls to it.
 * Crucially the outer page must never be scrolled. */
const scrollIntoViewSpy = vi.fn();
let outerScroll: HTMLDivElement | null = null;

beforeEach(() => {
  scrollIntoViewSpy.mockClear();
  Element.prototype.scrollIntoView = scrollIntoViewSpy;
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: Element) {
    const panel = this.closest(".moves-panel")?.querySelector<HTMLElement>(".moves-body");
    const top = this.classList.contains("moves-body")
      ? 100
      : this.classList.contains("mv-cell")
        ? 400 - (panel?.scrollTop ?? 0)
        : 0;
    const height = this.classList.contains("moves-body") ? 200 : 20;
    return { x: 0, y: top, top, left: 0, width: 400, height,
      right: 400, bottom: top + height, toJSON: () => ({}) } as DOMRect;
  });
  outerScroll = document.createElement("div");
  outerScroll.scrollTop = 73;
  document.body.append(outerScroll);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  outerScroll?.remove();
  outerScroll = null;
});

describe("MovesPanel follow-scroll (audit #14, game window stability)", () => {
  it("centers the move inside the moves list without scrolling ancestors", () => {
    const { container } = render(panel(4));
    const body = container.querySelector<HTMLElement>(".moves-body")!;
    expect(body.scrollTop).toBe(210);
    expect(scrollIntoViewSpy).not.toHaveBeenCalled();
    expect(outerScroll?.scrollTop).toBe(73);
  });

  it("follows stepping and reflows without unnecessary repeated scrolling", () => {
    const { container, rerender } = render(panel(4, "full"));
    const body = container.querySelector<HTMLElement>(".moves-body")!;
    const initial = body.scrollTop;
    rerender(panel(4, "hidden"));
    expect(body.scrollTop).toBe(initial);
    rerender(panel(2, "hidden"));
    expect(body.scrollTop).toBe(initial);
    rerender(panel(0));
    expect(body.scrollTop).toBe(0);
    expect(scrollIntoViewSpy).not.toHaveBeenCalled();
  });
});

describe("COACH narration rows are first-class (run 10 unification)", () => {
  // Two narrated plies so the current-ply gating is observable.
  const NARRATED: MovesRow[] = [
    ...movesRowsFromSans(["e4", "e5"], START),
    { kind: "narration", ply: 1, text: "The center is claimed." },
    { kind: "narration", ply: 2, text: "Black answers in kind." },
  ];

  function narratedPanel(
    currentPly: number,
    onSelectPly: (ply: number) => void,
    onNarrationHover?: (h: boolean) => void,
  ) {
    return (
      <MovesPanel
        rows={NARRATED}
        currentPly={currentPly}
        evals={null}
        annotationMode="full"
        onAnnotationMode={() => {}}
        onSelectPly={onSelectPly}
        editing={null}
        onNarrationHover={onNarrationHover}
      />
    );
  }

  it("clicking a COACH row navigates to its ply, like clicking the move", () => {
    const onSelectPly = vi.fn();
    render(narratedPanel(1, onSelectPly));
    fireEvent.click(screen.getByText("Black answers in kind."));
    expect(onSelectPly).toHaveBeenCalledWith(2);
  });

  it("hover fires the evidence callback ONLY on the current ply's row", () => {
    const hover = vi.fn();
    render(narratedPanel(1, () => {}, hover));
    const current = screen.getByText("The center is claimed.").closest("button")!;
    fireEvent.mouseEnter(current);
    expect(hover).toHaveBeenLastCalledWith(true);
    fireEvent.mouseLeave(current);
    expect(hover).toHaveBeenLastCalledWith(false);
    expect(current.className).toContain("evidence");

    hover.mockClear();
    const other = screen.getByText("Black answers in kind.").closest("button")!;
    fireEvent.mouseEnter(other);
    fireEvent.mouseLeave(other);
    expect(hover).not.toHaveBeenCalled();
    expect(other.className).not.toContain("evidence");
  });

  it("without the hover callback (Explain off / preview) rows still navigate", () => {
    const onSelectPly = vi.fn();
    render(narratedPanel(1, onSelectPly, undefined));
    const row = screen.getByText("The center is claimed.").closest("button")!;
    fireEvent.mouseEnter(row); // no callback — must not throw
    fireEvent.click(row);
    expect(onSelectPly).toHaveBeenCalledWith(1);
    expect(row.className).not.toContain("evidence");
  });
});
