# Kibitz DE – GitHub Actions aktiviert, CI-Fortschritt (10. November 2026)

**Branch:** `feat/de-simple-readable-ui`, Draft-PR [#1](https://github.com/wibem1/kibitz/pull/1). Nutzer hat Fork-Actions aktiviert, daraufhin wurde Pull-Request-CI tatsächlich gestartet.

**Realer Prüfstand:** Erster Lauf [42813722131](https://github.com/wibem1/kibitz/actions/runs/42813722131) zeigte erfolgreichen Frontend-Test/Build unter macOS, aber eine Clippy-Fehlermeldung `clippy::unnecessary_sort_by` in der bereits im Upstream vorhandenen Datei `app/kibitz-db/src/bookeval.rs:1386`. Der semantisch gleichwertige Wechsel zu `pairs.sort_by_key(|a| std::cmp::Reverse(a.1))` wurde unter Commit `e222845bf25576706af2e879ef16dc46f6598360` auf dem Feature-Branch gesichert. Neuer Lauf [42814006205](https://github.com/wibem1/kibitz/actions/runs/42814006205): Stand bei der letzten Abfrage: Frontend-Tests und Web-Build **macOS und Linux SUCCESS**, Rust-Formatierung und Clippy **macOS und Linux SUCCESS**. Die folgenden Rust-Test-/Lizenz-/Name-Gates bzw. `src-tauri`-Prüfungen waren zu diesem Zeitpunkt noch in Bearbeitung; **kein vollständiger Workflow-Erfolg bestätigt**. Ein echter Desktop-Tauri-Installer wurde nicht erzeugt oder getestet.

**Nächster Schritt:** Vollständigen CI-Lauf bis zum Ende beobachten, etwaige Fehler gezielt beheben, dann erst über Zusammenführung in `main` und einen gesondert beauftragten nativen Intel-Mac-Build entscheiden. Keine Releases oder Änderungen am Original-Repository.

# Kibitz DE – Fortsetzung: Navigation und Tests (10. November 2026)

**Branch:** `feat/de-simple-readable-ui`, Draft-PR [#1](https://github.com/wibem1/kibitz/pull/1); `main` und Upstream unverändert.

**Neue Änderungen:** Desktop-Navigation bis 840 px Fensterbreite mit ausgeschriebenen deutschen Bezeichnungen statt Symbolleiste; darunter bleibt eine kompakte Ansicht. PGN-Import einschließlich SCID-Hinweis übersetzt. Engine-/Auftragsstatus im Fußbereich ins Deutsche übertragen. Bestehenden `app/src/lib/shell.test.ts` an übersetzte Navigationsgruppen angepasst und um Erhaltung der erweiterten Werkzeuge ergänzt. Die Startseite und zahlreiche Unteransichten sind noch nicht vollständig übersetzt; keine falsche Vollständigkeitsbehauptung.

**Prüfung:** Neun zusätzliche statische Quelltextkontrollen bestanden. Noch kein ausführbarer Test: GitHub Actions im Fork liefert selbst nach PR und Änderungen **0 Workflowläufe** (GitHub API `/actions/runs`); lokale GitHub-Clone-Operation scheitert an DNS (`Could not resolve host: github.com`). Weder `npm ci`, Vitest, TypeScript-Build noch nativer Tauri-Build verifiziert. Tests im PR sind angepasst, aber nicht ausgeführt. Keine Veröffentlichung und kein Installationspaket.

**Nächster Schritt:** GitHub Actions für den Fork aktivieren bzw. einen CI-Lauf veranlassen und Fehler aus `npm test`/`npm run build` beheben; anschließend Homepage/Partieansicht inklusive bestehender Snapshot-Tests schrittweise lokalisieren und eine native Intel-macOS-Abnahme vorbereiten. Kein eigenmächtiges Release.

# Kibitz DE – Entwicklungsstand (10. November 2026)

**Repository:** Fork von `avienu/kibitz` auf `wibem1/kibitz`; Originalcode und Lizenzen bleiben erhalten. Entwicklungsbranch: `feat/de-simple-readable-ui`, nicht in `main` gemergt, kein Release.

**Ziel:** Vereinfachte deutschsprachige Kibitz-Desktop-App mit größeren Schriften, hell/dunkel umschaltbarem Design und möglichst wenig Bedienballast; Engine und Datenbank bleiben unverändert.

**Implementiert:** `app/src/App.tsx` helles Thema als Voreinstellung für neue Installationen, vorhandene Nutzerwahl bleibt bestehen; deutsche Bildschirmtitel und deutscher Starttext. `app/src/lib/shell.ts` deutsche Hauptnavigation; `app/src/shell/NavRail.tsx` reduzierte Standardnavigation mit „Weitere Funktionen“ und Erhalt des aktuell aktiven Eintrags. `app/src/SettingsView.tsx` wichtige Darstellungsoptionen auf Deutsch. `app/src/app.css` größere Grundschrift, Hauptschaltflächen, Navigation und Fokuskennzeichnung.

**Prüfung:** 8 von 8 statischen Quelltextkontrollen bestanden. **Noch keine** TypeScript-/React-Tests, kein Tauri-Build und kein Laufzeittest auf macOS/Windows; kein installierbares Paket. Weitere Unterseiten und Hilfe sind weiterhin teils englisch. Bestehende große Layout- und Navigationstests müssen in einer Buildumgebung laufen. Keine KI-API- oder Engine-Kosten.

**Nächster Schritt:** `cd app && npm ci && npm test && npm run build`; anschließend echten macOS-/Windows-UI-Test (Darstellung, responsive Navigation, Settings) und weiter schrittweise übersetzen, ohne den Funktionsumfang zu erhöhen. Erst nach erfolgreicher Prüfung zur Übernahme in `main` entscheiden.
