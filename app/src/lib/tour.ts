/**
 * First-run tour (design/handoff-2 §Help & first-run tour): one card per
 * rail group, anchored BESIDE the group it describes, never covering it.
 * Pure state machine + step data — no DOM — unit-testable; the overlay
 * component does the measuring and rendering.
 */

/** Which rail element a card anchors beside. */
export type TourAnchor = "header" | "study" | "coach" | "train" | "data" | "footer";

export interface TourStep {
  id: string;
  anchor: TourAnchor;
  /** Bolded lead-in ("This is Coach."). */
  title: string;
  /** Serif body prose. */
  body: string;
}

/** One card per rail group (header · four groups · footer = 6). */
export const TOUR_STEPS: TourStep[] = [
  {
    id: "rail",
    anchor: "header",
    title: "Das ist die Navigation.",
    body: "Hier erreichst du die Funktionen von Kibitz. Die kleinen Zahlen zeigen echte Daten an und bleiben sonst leer.",
  },
  {
    id: "study",
    anchor: "study",
    title: "Partien.",
    body: "Hier findest du die Partiedatenbank, das Schachbrett mit der Zugliste, den Eröffnungsbaum und die Stellungssuche.",
  },
  {
    id: "coach",
    anchor: "coach",
    title: "Analyse.",
    body: "Kibitz erklärt Stellungen und untersucht deine Partien. Das Spielerprofil zeigt Stärken und Schwächen, die Gegnervorbereitung hilft vor einer Partie. Die Engine läuft nicht ohne Anlass.",
  },
  {
    id: "train",
    anchor: "train",
    title: "Training.",
    body: "Übe Eröffnungen, Taktik und Endspiele. Wiederholungen helfen dabei, Varianten zu behalten.",
  },
  {
    id: "data",
    anchor: "data",
    title: "Datenverwaltung.",
    body: "Hier importierst du PGN- oder SCID-Daten, lädst TWIC-Partien, gleichst Konten ab und verwaltest Analyseaufträge.",
  },
  {
    id: "footer",
    anchor: "footer",
    title: "Einstellungen und Hilfe.",
    body: "Stelle die Darstellung und Engine ein. In der Hilfe findest du die Bedienungsanleitung und kannst diese Einführung erneut starten.",
  },
];

export interface TourState {
  step: number;
  done: boolean;
}

export type TourAction = { type: "next" } | { type: "skip" } | { type: "replay" };

export function initialTour(): TourState {
  return { step: 0, done: false };
}

/** next advances (finishing past the last card); skip ends immediately;
 * replay restarts from the first card. */
export function reduceTour(
  s: TourState,
  a: TourAction,
  total: number = TOUR_STEPS.length,
): TourState {
  switch (a.type) {
    case "next":
      return s.step + 1 >= total ? { ...s, done: true } : { step: s.step + 1, done: false };
    case "skip":
      return { ...s, done: true };
    case "replay":
      return { step: 0, done: false };
  }
}

/** The card's mono counter, e.g. "2 / 6". */
export function tourCounter(step: number, total: number = TOUR_STEPS.length): string {
  return `${step + 1} / ${total}`;
}
