/**
 * Settings (design/handoff-2 §Settings): single column, max-width 1080px,
 * grouped cards — mono uppercase group strip on --panel2, rows of
 * `230px label+help | 1fr value | 200px action`. Values are read-only
 * fields (mono for paths/keys/numbers); actions are bordered ghost
 * buttons.
 *
 * Settings contain actual user-configurable options. Database batch actions
 * already live in DatabaseScreen (including confirmation, progress and pause);
 * this screen must not duplicate them. Existing preference handlers stay wired.
 */
import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import ScreenHeader from "./shell/ScreenHeader";
import EngineSection from "./settings/EngineSection";
import LichessSection from "./settings/LichessSection";
import StorageSection from "./settings/StorageSection";
import UpdatesSettings from "./UpdatesSettings";
import { clearDiagnostics, saveDiagnosticReport } from "./lib/diagnostics";
import {
  commitmentGet,
  commitmentSet,
} from "./lib/db";
import { twicCatalog, twicSetAutoSync } from "./lib/net";
import type { AnnotationMode, BoardTreatmentChoice, Theme, Voice } from "./lib/gameView";

interface SettingsViewProps {
  voice: Voice;
  onVoice: (v: Voice) => void;
  annotationMode: AnnotationMode;
  onAnnotationMode: (m: AnnotationMode) => void;
  treatment: BoardTreatmentChoice;
  onTreatment: (t: BoardTreatmentChoice) => void;
  theme: Theme;
  onTheme: (t: Theme) => void;
}

/** One settings row: 230px label+help | 1fr value | 200px action. */
function Row({
  label,
  help,
  value,
  action,
}: {
  label: string;
  help: ReactNode;
  value: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="set-row">
      <div>
        <div className="set-label">{label}</div>
        <div className="set-help">{help}</div>
      </div>
      <div className="set-value-cell">{value}</div>
      <div className="set-actions">{action}</div>
    </div>
  );
}

const ANNOTATION_CYCLE: Record<AnnotationMode, AnnotationMode> = {
  full: "hover",
  hover: "hidden",
  hidden: "full",
};

export default function SettingsView({
  voice,
  onVoice,
  annotationMode,
  onAnnotationMode,
  treatment,
  onTreatment,
  theme,
  onTheme,
}: SettingsViewProps) {
  const [note, setNote] = useState<string | null>(null);

  // Recurring commitment (meta-backed; absent by default).
  const [commitLabel, setCommitLabel] = useState("");
  const [commitOpponent, setCommitOpponent] = useState("");
  const [commitNote, setCommitNote] = useState<string | null>(null);

  // Network-ingestion mirrors (run 9): configured sync accounts and the
  // TWIC automatisch laden toggle (same meta keys the TWIC screen writes).
  const [twicAuto, setTwicAuto] = useState<boolean | null>(null);
  const [twicWeek, setTwicWeek] = useState<number | null>(null);

  useEffect(() => {
    commitmentGet()
      .then((c) => {
        setCommitLabel(c.label ?? "");
        setCommitOpponent(c.opponent ?? "");
      })
      .catch(() => {}); // no database open — the row stays empty
    twicCatalog()
      .then((c) => {
        setTwicAuto(c.autoSync);
        setTwicWeek(c.latestImported);
      })
      .catch(() => setTwicAuto(null));
  }, []);

  const toggleTwicAuto = useCallback(async () => {
    if (twicAuto === null) return;
    try {
      await twicSetAutoSync(!twicAuto);
      setTwicAuto(!twicAuto);
    } catch (e) {
      setNote(`TWIC-Aktualisierung: ${e}`);
    }
  }, [twicAuto]);

  /* ---- commitment ---- */

  const saveCommitment = useCallback(async () => {
    try {
      const c = await commitmentSet(
        commitLabel.trim() === "" ? null : commitLabel.trim(),
        commitOpponent.trim() === "" ? null : commitOpponent.trim(),
      );
      setCommitLabel(c.label ?? "");
      setCommitOpponent(c.opponent ?? "");
      setCommitNote(c.label ? "Gespeichert – Termin auf der Startseite." : "Gespeichert.");
    } catch (e) {
      setCommitNote(`Speichern fehlgeschlagen: ${e}`);
    }
  }, [commitLabel, commitOpponent]);

  const clearCommitment = useCallback(async () => {
    try {
      await commitmentSet(null, null);
      setCommitLabel("");
      setCommitOpponent("");
      setCommitNote("Entfernt.");
    } catch (e) {
      setCommitNote(`Entfernen fehlgeschlagen: ${e}`);
    }
  }, []);

  const ghost = (label: string, onClick: () => void, disabled = false) => (
    <button className="btn-ghost" onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );

  return (
    <>
      <ScreenHeader title="Einstellungen" subtitle="Darstellung, Schachengines und Konten" />
      <div className="page-scroll">
        <div className="settings-page">
          {/* ---- ENGINE MANAGER (own file: settings/EngineSection.tsx, run 10) ---- */}
          <EngineSection />

          {/* ---- COACH ---- */}
          <div className="set-group">
            <div className="set-group-head">TRAINER</div>
            <Row
              label="Erklärstil"
              help="Gilt für Stellungserklärungen und Übungshinweise. Die Wahl wird in der geöffneten Datenbank gespeichert."
              value={<div className="set-value">{voice === "coach" ? "Trainer" : "Neutral"}</div>}
              action={ghost(voice === "coach" ? "Neutral verwenden" : "Trainer verwenden", () =>
                onVoice(voice === "coach" ? "neutral" : "coach"),
              )}
            />
          </div>

          {/* ---- DATA ---- */}
          <div className="set-group">
            <div className="set-group-head">DATEN</div>
            {/* ---- DATABASE STORAGE (own file: settings/StorageSection.tsx) ---- */}
            <StorageSection />
            <Row
              label="TWIC automatisch laden"
              help="Lädt beim Öffnen der Datenbank höchstens fünf neue TWIC-Ausgaben. Ältere Ausgaben können im TWIC-Bereich manuell geladen werden. Nur zur persönlichen Nutzung."
              value={
                <div className="set-value mono">
                  {twicAuto === null
                    ? "Unbekannt (keine Datenbank geöffnet)"
                    : `${twicAuto ? "Ein" : "Aus"}${twicWeek !== null ? ` · neueste Ausgabe: Woche ${twicWeek}` : ""}`}
                </div>
              }
              action={
                twicAuto !== null &&
                ghost(twicAuto ? "Ausschalten" : "Einschalten", () => void toggleTwicAuto())
              }
            />
            <Row
              label="Termin"
              help="Ein wiederkehrender Schachtermin für die Startseite. Der Gegnername ist optional."
              value={
                <div className="set-commit">
                  <input
                    className="set-value editing"
                    type="text"
                    value={commitLabel}
                    placeholder="Bezeichnung des Termins"
                    spellCheck={false}
                    onChange={(e) => setCommitLabel(e.target.value)}
                    aria-label="Terminbezeichnung"
                  />
                  <input
                    className="set-value editing"
                    type="text"
                    value={commitOpponent}
                    placeholder="Gegner (optional)"
                    spellCheck={false}
                    onChange={(e) => setCommitOpponent(e.target.value)}
                    aria-label="Gegner des Termins"
                  />
                </div>
              }
              action={
                <>
                  {ghost("Speichern", () => void saveCommitment())}
                  {ghost("Entfernen", () => void clearCommitment())}
                </>
              }
            />
            {commitNote && <div className="set-note">{commitNote}</div>}
          </div>

          {/* ---- LICHESS PLAY (own file: settings/LichessSection.tsx, run 10) ---- */}
          <LichessSection />

          {/* ---- UPDATES (own file: UpdatesSettings.tsx, run-8 packaging) ---- */}
          <UpdatesSettings />

          {/* ---- DIAGNOSTICS ---- */}
          <div className="set-group">
            <div className="set-group-head">DIAGNOSE</div>
            <Row
              label="Fehlerbericht"
              help="Speichert einen JSON-Bericht mit bis zu 120 Ereignissen – auch nach Neustart verfügbar. Enthält keine API-Schlüssel, Dateipfade, Partien oder Fehlermeldungstexte. Keine automatische Übertragung."
              value={<div className="set-value">Lokaler Diagnosebericht · ohne automatische Übertragung</div>}
              action={
                <div className="set-stack">
                  {ghost("Diagnose speichern", () => saveDiagnosticReport())}
                  {ghost("Diagnose löschen", () => clearDiagnostics())}
                </div>
              }
            />
          </div>

          {/* ---- APPEARANCE ---- */}
          <div className="set-group">
            <div className="set-group-head">DARSTELLUNG</div>
            <Row
              label="Farbschema"
              help="Du kannst jederzeit zwischen einer hellen und einer dunklen Oberfläche wechseln."
              value={<div className="set-value">{theme === "dark" ? "Dunkel" : "Hell"}</div>}
              action={ghost(theme === "dark" ? "Hell verwenden" : "Dunkel verwenden", () =>
                onTheme(theme === "dark" ? "light" : "dark"),
              )}
            />
            <Row
              label="Brettdarstellung"
              help="Holzbrett ist die Voreinstellung; alternativ gibt es eine neutrale Darstellung."
              value={
                <div className="set-value">
                  {treatment === "walnut" ? "Holzbrett" : "Neutrales Brett"}
                </div>
              }
              action={ghost(
                treatment === "walnut" ? "Neutrales Brett verwenden" : "Holzbrett verwenden",
                () => onTreatment(treatment === "walnut" ? "instrument" : "walnut"),
              )}
            />
            <Row
              label="Kommentare anzeigen"
              help="Kommentare und Varianten vollständig, abgeschwächt oder gar nicht anzeigen."
              value={<div className="set-value">{annotationMode === "full" ? "Vollständig" : annotationMode === "hover" ? "Bei Berührung" : "Ausgeblendet"}</div>}
              action={ghost(annotationMode === "full" ? "Bei Berührung anzeigen" : annotationMode === "hover" ? "Ausblenden" : "Vollständig anzeigen", () =>
                onAnnotationMode(ANNOTATION_CYCLE[annotationMode]),
              )}
            />
          </div>
        </div>
      </div>

    </>
  );
}
