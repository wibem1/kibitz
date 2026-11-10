# 2026-11-10 – Rückmeldung vom Intel-Mac: Fenster springt, Übersetzung lückenhaft

**Nutzerbefund:** Test-DMG auf einem echten Intel-Mac startet; Partien laden und Grundfunktionen funktionieren. Beim Durchspielen einer geladenen Partie verschiebt sich das Fenster; viele Texte sind noch englisch. Diese Rückmeldung ist der erste reale Laufzeitnachweis, **keine** Abnahme des springenden Fensters.

**Wahrscheinliche Ursache und Korrektur:** `app/src/MovesPanel.tsx` rief bei jedem Zugwechsel `cur.scrollIntoView({block:"center"})` auf. Das kann übergeordnete Scrollbereiche verschieben. Stattdessen wird nun nur `body.scrollTop` um den gemessenen Abstand der aktuellen Zelle zum Mittelpunkt der internen Zugliste verändert (Commit `bd99d2ff1fa750bf81dc84278d0121afb728a34a`). In `app/src/MovesPanel.test.tsx` wurde ein Regressionstest für ausschließlich internes Scrolling und unveränderte Elternscrollposition eingebaut (Commit `3bb99f308abaea3537b9be818d9f3717bbcd77a0`). **Noch kein erneuter Praxistest des Fixes auf dem Nutzer-Mac.** Andere Ursachen bleiben möglich.

**Zusätzliche Übersetzungen:** `ExplainPanel.tsx` (Horizonte, Hinweise, Züge, Textbausteine), `MovesPanel.tsx` (Zugliste, Kommentare, Varianten, Speichern), `SettingsView.tsx` (zentrale Einstellungen, Enginehinweise). Begleitende `ExplainPanel.test.tsx`- und `SettingsView.test.tsx`-Erwartungen ins Deutsche übernommen. Mehrere Unteransichten, Inhalte aus dem Rust-Erklärungskern, Hilfe und dynamische Fehlermeldungen sind weiterhin englisch; vollständige deutsche Benutzerführung ist **offen**.

**Prüfung:** Der erste CI-Lauf unmittelbar nach dem Fix schlug bei 3 alten Tests fehl, die weiterhin `scrollIntoView` erwarteten, bevor die Regressionstests ersetzt wurden. Alle neueren CI-Läufe sind zum Zeitpunkt dieses Eintrags noch in Warteschlange, deshalb sind die neuen Änderungen **nicht testbestätigt**. Build-Test-Auslöser für macOS-DMG wurde auf `workflow_dispatch` begrenzt, damit nicht jede Änderung eine teure native Paketierung erzeugt. Keine neue Version, kein Release; `main` unverändert.

**Nächster Schritt:** Zunächst den aktuellen Frontend-Vitest-/TypeScript-Build für den neuesten Commit prüfen und Fehler beheben. Dann eine einzige manuelle Intel-DMG-Erstellung veranlassen, vom Nutzer das Schrittverhalten bestätigen lassen. Erst danach zusätzliche Übersetzungen in kleinen, getesteten Gruppen und verlässliche Bestandsaufnahme aller englischen Zeichenketten.

# 2026-11-10 – Intel-DMG nachgewiesen; Partieansicht lokalisiert

**Bestätigter Stand:** GitHub-CI [42818687565](https://github.com/wibem1/kibitz/actions/runs/42818687565) vollständig erfolgreich. Intel-DMG-Build [42818370629](https://github.com/wibem1/kibitz/actions/runs/42818370629) erfolgreich, Artifact `kibitz-de-macos-intel-unsigned-test` (ca. 11,7 MB; im GitHub-Actions-Lauf unter Artifacts; 14 Tage Aufbewahrung). Die DMG ist unsigniert und **noch nicht auf einem realen Intel-Mac gestartet**.

**Neue Änderung:** In `app/src/GameView.tsx` 38 sichtbare Texte/Bedienelemente der Partie- und Analyseansicht ins Deutsche übertragen (Zugnavigation, Brettorientierung, Erläutern, Neuberechnung, Live-Analyse, Variantenansicht, PGN-Export, Tooltips). Commit `5c87f51dc613a6ee17b6f8105bd7198aa80bdc56`. Es handelt sich um UI-Texte, keine Änderung der Engine. Weitere Unterbereiche, Meldungen und Hilfe sind **noch nicht vollständig übersetzt**.

**Prüfung des neuen Code-Standes:** GitHub-CI [42820315008](https://github.com/wibem1/kibitz/actions/runs/42820315008) und Intel-DMG-Build [42820314883](https://github.com/wibem1/kibitz/actions/runs/42820314883) gestartet; bei Eintrag noch nicht abgeschlossen. Das bestätigte alte DMG enthält diese GameView-Änderung nicht. **Keine Release-Freigabe**, `main` unangetastet, Draft-PR #1 offen.

**Nächster Schritt:** Ergebnisse der neuen CI-/DMG-Läufe prüfen, bei Erfolg DMG auf echtem Intel-Mac installieren und Oberflächenfehler aufnehmen; dann weitere Übersetzung in kleinen Schritten.

# 2026-11-10 – TWIC-Test korrigiert und Intel-Mac-Testbuild gestartet

**Code:** Der CI-Fehler des bestehenden Tauri-Tests `netops::tests::auto_sync_worker_probes_then_downloads_newest_first_within_the_cap` beruhte auf einer veralteten Erwartung (`"imported TWIC 1506–1510 (newest first)"` statt des tatsächlich von der Anwendung verwendeten Meldungstexts `"imported 5 issues · 2 games from TWIC 1506–1510"`). Nur die Testassertion in `app/src-tauri/src/netops.rs` wurde an das bestehende korrekte Importergebnis angepasst. Commit `e5f89e76239f4742dba28fd036176ce47c1218f5`. Kein Eingriff in die Synchronisationslogik.

**Realer Buildversuch:** Gesonderter PR-Workflow `.github/workflows/kibitz-de-intel-dmg.yml` auf `macos-15-intel` mit Target `x86_64-apple-darwin`, Tests, unsigniertem Tauri-DMG-Build und Prüfung/Hochladen des Pakets. Start [42818370629](https://github.com/wibem1/kibitz/actions/runs/42818370629), bei letzter Prüfung noch in Arbeit (Installations- und Frontendprüfschritte begonnen); **kein DMG-Erfolg bestätigt**. Keine Veröffentlichung oder Release, keine Änderung des Original-Repositories. Neueste volle CI für diesen Commit: [42818370595](https://github.com/wibem1/kibitz/actions/runs/42818370595), ebenfalls noch offen; früherer Lauf [42818206492](https://github.com/wibem1/kibitz/actions/runs/42818206492) mit erfolgreich abgeschlossenen Rust-Kerntests auf beiden Plattformen, App-Prüfung noch offen.

**Wichtige Sicherheits-/Produktnotiz:** Der Fork enthält noch den ursprünglichen Update-Endpunkt `avienu/kibitz`. Der Originalcode meldet aufgrund eines Platzhalter-Updater-Schlüssels derzeit `not configured` und vermeidet Netzabfrage, eine eigene Update-Strategie muss vor einer eigenständigen Veröffentlichung dennoch geklärt werden. Die meisten Unteransichten und die Hilfe sind weiterhin nicht vollständig auf Deutsch. Ein Paket aus diesem Workflow wäre **unsigniert** und nicht auf einem Endnutzer-Intel-Mac getestet.

**Nächster Schritt:** GitHub-Checks und DMG-Artefakt prüfen; bei Erfolg DMG auf echtem Intel-Mac testen, dann UI-Übersetzung und Vereinfachung fortführen. Ohne Tests keine Freigabe.

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
