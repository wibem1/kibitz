# Kibitz DE – 10.11.2026: Gegnervorbereitung übersetzt (Folgeschritt)

**Neuer Codecommit:** `648d79d3cdd0e0caaf719e5291d00c69bbb52aba` auf `feat/de-simple-readable-ui`. In `app/src/PrepView.tsx` wurden sichtbare Tabellenüberschriften, Such-/Schritttexte, Hinweise, Fehlzustände, Auswahl-/Aktionsbeschriftungen und der Profilbereich ins Deutsche übertragen. Die vorhandenen Datenabfragen und die Schachlogik wurden nicht verändert. CLI-Befehle bleiben unverändert.

**Prüfstatus:** Quelltextbasierter Ersetzungsschritt, ohne lokalen TypeScript-/Vitest-Lauf und ohne CI-/Desktop-Abnahme. Dynamisch erzeugte Meldungen aus `app/src/lib/prepView.ts` und weitere Ansichten sind noch nicht vollständig übersetzt. Keine neue DMG und keine Veröffentlichung.

**Nächster einzelner Schritt:** CI für Commit `648d79d` kontrollieren und eventuell betroffene Tests korrigieren; danach `app/src/lib/prepView.ts` auf dynamische englische Beschriftungen prüfen. Die Nutzerabnahme zur Fensterstabilität bleibt offen.

---

# Kibitz DE – 10.11.2026: systematische Gesamtübersetzung begonnen

**Auftrag:** Nutzer will *sämtliche* sichtbaren Texte auf Deutsch, ausdrücklich auch Hilfen, Meldungen und automatisch generierte Schacherklärungen. FEN/PGN/UCI/CLI-Bezeichner und Spielregeln bleiben unverändert.

**Stand in diesem Schritt (implementiert, noch nicht voll CI-geprüft):** Einführungstour `app/src/lib/tour.ts` und `FirstRunOverlay.tsx`, deutsche integrierte Hilfe (`Help.tsx` nutzt neue `docs/USER_GUIDE_DE.md`), komplette sichtbare Grundtexte in `JobsView.tsx`, `PromotionPicker.tsx`, `CrosstableView.tsx`, `PositionSearchView.tsx`, `OpeningTreeView.tsx`; Einstellungen in `settings/EngineSection.tsx`, `LichessSection.tsx`, `StorageSection.tsx`; viele Texte im Eröffnungs- und Taktiktraining (`TrainView.tsx`, `TacticsView.tsx`). Es bleiben auch in bereits bearbeiteten Bereichen einzelne dynamische Texte, die aus Helferdateien kommen. Keine Behauptung einer vollständig deutschen Anwendung.

**Inventar/Qualität:** `docs/I18N_STATUS_DE.md` führt die noch nicht lokalisierten Ansichten und die sieben englischen Rust-Vorlagendateien unter `crates/kibitz-verbalize/templates/*.tmpl` samt Abnahmekriterien auf. `scripts/i18n_audit.mjs` stellt einen rein heuristischen Quellcode-Audit zur Verfügung, bisher nicht ausgeführt; unersetzte Texte müssen manuell überprüft werden. Die deutsche Anleitung ist eine eigenständig formulierte Benutzerübersicht und **noch keine vollständige Übersetzung der 69 KB langen englischen technischen Originalanleitung**.

**Letzter nachgewiesener CI-Stand:** CI [42827168686](https://github.com/wibem1/kibitz/actions/runs/42827168686) erfolgreich. Neuere Commits nach `8bb63ff47` standen bei der Prüfung noch in der Actions-Warteschlange. Keine gültige Aussage über den Build-Erfolg sämtlicher aktuellen Übersetzungsänderungen. Keine neue Intel-DMG, keine Nutzerabnahme der Scrollkorrektur, keine Veröffentlichung.

**Nächster einzelner Schritt:** Neuesten CI-Lauf abwarten bzw. dessen Fehlerlogs prüfen; ggf. erwartete UI-Texte in Tests und Snapshots anpassen. Anschließend übersetzen und mit Tests abdecken: DatabaseScreen, Profile/Prep, Triage/Lab, Endgame/Play, TWIC/Syncs sowie die getrennten Rust-Erklärungsvorlagen. Erst nach vollständiger Übersetzung und Abnahme neue DMG erstellen.


# Kibitz DE – Projektstand (10. November 2026)

**Ziel:** Open-Source-Fork `wibem1/kibitz` mit gut lesbarer, vereinfachter und schrittweise vollständig deutscher Oberfläche. Upstream-/Lizenzregeln in `CLAUDE.md`, zentrale KI-Entwicklungsstandards beachten. Entwicklung ausschließlich auf `feat/de-simple-readable-ui`, Draft-PR [#1](https://github.com/wibem1/kibitz/pull/1); `main` unverändert, kein Release.

**Real bestätigt:** Der Nutzer hat eine unsignierte Intel-Mac-Test-DMG erfolgreich gestartet und Partien geladen. Beim Durchspielen sprang das Fenster; in der älteren DMG waren viele Texte englisch. Die alte DMG ist keine Bestätigung für spätere Korrekturen. CI [42821568250](https://github.com/wibem1/kibitz/actions/runs/42821568250) hat alle vier Jobs (Frontend/Tauri und Rust auf macOS und Linux) erfolgreich abgeschlossen. Dies bestätigt die im getesteten Commit enthaltene Korrektur, **nicht** deren Verhalten auf dem Nutzer-Mac.

**Fensterkorrektur:** `MovesPanel.tsx` verwendet beim Folgen des aktuellen Zuges internes `moves-body.scrollTop` statt `scrollIntoView`, damit übergeordnete Fensterbereiche nicht mitwandern. Regressionstest in `MovesPanel.test.tsx` erfasst Scrollverhalten und unberührtes äußeres Element. Nach positivem CI-Lauf **noch nicht mit aktueller DMG auf echtem Intel-Mac getestet**. Ursache plausibel, nicht endgültig bestätigt.

**Übersetzung:** Die Hauptnavigation, ein großer Teil der Partie-/Zug-/Erklärungstafel, PGN-Import, wichtige Einstellungen und Statusleiste sind ins Deutsche übertragen. Neu dazugekommen: `UpdatesSettings.tsx` (Aktualisierungsstatus), `HomeView.tsx` (Ersteinrichtung, Aktionskarten, Übersicht und Meldungen), zugehörige Testanpassungen `HomeView.test.tsx` und `app/src/__snapshots__/HomeView.test.tsx.snap`. Aktueller letzter Codecommit: `8c1a00e9c236dfe1cad2992d191e6f454b33d7ea`. **Neueste Home-/Update-Änderungen sind zum Zeitpunkt dieses Eintrags noch nicht durch CI bestätigt.** Tieferliegende Helfertexte, Spezialansichten, Hilfe und Rust-generierte Erklärungstexte bleiben teilweise englisch; keine Behauptung einer vollständigen Übersetzung.

**Buildverwaltung:** Die Intel-DMG-Prüfung in `.github/workflows/kibitz-de-intel-dmg.yml` wird nur noch manuell (`workflow_dispatch`) gestartet, um wiederholte teure Builds bei jeder UI-Änderung zu vermeiden. Der letzte erfolgreiche Testbuild vor der Fensterkorrektur ist [42818370629](https://github.com/wibem1/kibitz/actions/runs/42818370629). Keine neue DMG für die gesamte aktuelle Änderung bestätigt.

**Nächster einzelner Schritt:** CI für den jüngsten Commit vollständig auswerten, gegebenenfalls die betroffenen UI-/Snapshottests korrigieren. Danach gezielt einmal eine Intel-DMG als Testartefakt bauen, am realen Mac die Fensterstabilität prüfen und erst dann weitere Texte systematisch erfassen. Keine Veröffentlichung ohne Abnahme.

