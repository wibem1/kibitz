// @vitest-environment jsdom
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import SettingsView from "./SettingsView";

/* IPC is mocked at the lib/db boundary; pure helpers are re-implemented
 * minimally so the component renders without a Tauri runtime. */
vi.mock("./lib/db", () => ({
  batchEstimate: vi.fn(() => Promise.reject(new Error("no db"))),
  batchStart: vi.fn(),
  commitmentGet: vi.fn(),
  commitmentSet: vi.fn(),
  getSavedDbPath: () => "testdata/corpus/scid.sqlite",
  fetchDbSummary: vi.fn(() => Promise.reject(new Error("no db"))),
  saveDbPath: vi.fn(),
  jobsStatus: vi.fn(() => Promise.reject(new Error("no db"))),
  runJobs: vi.fn(),
}));
vi.mock("./lib/endgame", () => ({
  endgameOverview: vi.fn(() => Promise.reject(new Error("no db"))),
}));
vi.mock("./lib/net", () => ({
  railNetBadges: vi.fn(() => Promise.reject(new Error("no db"))),
  twicCatalog: vi.fn(() => Promise.reject(new Error("no db"))),
  twicSetAutoSync: vi.fn(),
}));
vi.mock("./lib/engine", () => ({
  getSavedEnginePath: () => "",
  getSavedNodes: () => 2_000_000,
  getSavedTbDir: () => "",
  resolveEnginePath: vi.fn(() => Promise.resolve("/usr/local/bin/stockfish")),
  saveEnginePath: vi.fn(),
  saveNodes: vi.fn(),
  saveTbDir: vi.fn(),
  engineIdentify: vi.fn(() => Promise.reject(new Error("no engine in tests"))),
  tablebaseStatus: vi.fn(() => Promise.reject(new Error("no tb in tests"))),
  setTablebaseDir: vi.fn(() => Promise.reject(new Error("no tb in tests"))),
}));

function renderSettings() {
  return render(
    <SettingsView
      voice="coach"
      onVoice={vi.fn()}
      annotationMode="full"
      onAnnotationMode={vi.fn()}
      treatment="walnut"
      onTreatment={vi.fn()}
      theme="dark"
      onTheme={vi.fn()}
    />,
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Settings — deutsche Benutzerführung", () => {
  it("zeigt Farbschema, Brett, Trainer und Diagnose", () => {
    const { container } = renderSettings();
    expect(container.textContent).toContain("Farbschema");
    expect(container.textContent).toContain("Brettdarstellung");
    expect(container.textContent).toContain("Erklärstil");
    expect(container.textContent).toContain("Diagnose speichern");
  });

  it("schaltet das Farbschema über die bereitgestellte Callback-Funktion", () => {
    const onTheme = vi.fn();
    const { getByText } = render(
      <SettingsView voice="coach" onVoice={vi.fn()} annotationMode="full"
        onAnnotationMode={vi.fn()} treatment="walnut" onTreatment={vi.fn()}
        theme="dark" onTheme={onTheme} />,
    );
    fireEvent.click(getByText("Hell verwenden"));
    expect(onTheme).toHaveBeenCalledWith("light");
  });

  it("zeigt Datenschutzinformationen vor dem Diagnoseexport", () => {
    const { container } = renderSettings();
    expect(container.textContent).toContain("API-Schlüssel");
    expect(container.textContent).toContain("Keine automatische Übertragung");
    expect(container.textContent).toContain("Diagnose löschen");
  });
});
