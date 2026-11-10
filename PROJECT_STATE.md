# Kibitz DE – 10.11.2026: UCI-Pfadauflösung auf Intel-Mac abgesichert

**Neue Korrektur:** Die bisherige automatische Engine-Suche in `app/src-tauri/src/uci.rs` bevorzugte das im Repository vorhandene Apple-Silicon-Programm `tools/stockfish/stockfish-macos-m1-apple-silicon` auf **allen** Plattformen, falls die Datei existierte. Auf einem Intel-Mac (oder Linux/Windows) ist das unbrauchbar. Commit `9fe9185f` beschränkt dieses Repo-Entwicklungsbinary nun auf macOS ARM64; Intel-Mac greift stattdessen auf einen explizit konfigurierten Pfad, `KIBITZ_STOCKFISH` oder `stockfish` im PATH zurück. Ein neuer Rust-Test für die plattformabhängige Schranke ist ergänzt. **Der Code ist statisch gegengeprüft, aber nicht neu kompiliert oder real getestet.** Diese Änderung nimmt keine Installation oder Bereitstellung einer Intel-Engine vor.

**CI-Prüfung:** [Lauf 42851869692](https://github.com/wibem1/kibitz/actions/runs/42851869692) für `ab92e8cb` inzwischen abgeschlossen: `app (ubuntu-latest)` **success**, `rust (ubuntu-latest)` **success**, beide macOS-Jobs **cancelled**. Daher ist die gesamte Workflow-Konklusion `failure`, obwohl die beiden Ubuntu-Jobs grün waren. Auch die neueren Undo-Commits und `9fe9185f` sind damit **nicht** grün nachgewiesen. Beim Abruf von `9fe9185f` wurde noch kein eigener PR-Workflow-Lauf zugeordnet.

**Noch offen:** Auf Intel-Mac Stockfish-Binary konfigurieren/auffinden, reale UCI-Partie und Rücknahme sowie Autosave/PGN prüfen. Vorhandene macOS-CI-Jobs müssen für den aktuellen Code einen aussagekräftigen Lauf abschließen; keine voreilige Veröffentlichung. Maia 2 bleibt bis dahin zurückgestellt.

**Nächster einzelner Schritt:** Aktuellste CI-Ausführung mit vollständig gelaufenen macOS-Jobs prüfen und ggf. Fehler korrigieren; danach konkreter Intel-Mac-Praxistest des Offline-Spielmodus.

---

# Kibitz DE – 10.11.2026: Ubuntu-CI grün und Stockfish-Zugrücknahme verbessert

**Nachgewiesener CI-Stand:** GitHub-Actions-Lauf [42851869692](https://github.com/wibem1/kibitz/actions/runs/42851869692) auf Commit `ab92e8cb`: `app (ubuntu-latest)` **success** und `rust (ubuntu-latest)` **success**. Die beiden macOS-Jobs waren bei der Abfrage noch `queued`. Damit sind die vorherigen 11 fehlgeschlagenen Übersetzungs-Tests durch Updates der UI-Erwartungen behoben, jedoch **kein** macOS-Erfolg und **kein** realer Stockfish-Spieltest belegt.

**Neuer Entwicklungsschritt im Branch (noch nicht durch CI verifiziert):**
- `app/src/lib/localPlay.ts`: `undoLocalTurn(game, opponent, humanColor)` nimmt gegen einen Menschen weiterhin einen Halbzug zurück; gegen Stockfish so viele Halbzüge (max. zwei), bis der menschliche Spieler wieder am Zug ist. Bei Schwarz bleibt der erste Stockfish-Zug bestehen, solange noch kein schwarzer Zug erfolgt ist.
- `app/src/OfflinePlayView.tsx`: Zugrücknahme nun auch bei laufender Engine-Suche möglich, um den gerade gespielten eigenen Zug zurückzunehmen. Bei Stellungswechsel verwirft das bestehende Effekt-Cleanup ausstehende Engine-Antworten; die UI wird wieder freigegeben.
- `app/src/lib/localPlay.test.ts`: Zwei neue Regressionstests für Weiß-/Schwarz-Rücknahme einschließlich wartender Engine.
- Commits: `aeebd199`, `3d2941d1`, `f78085b0`.

**Prüfstatus:** Änderungen in GitHub gespeichert und anhand des Codes überprüft. Die neuen Tests wurden zum Zeitpunkt dieses Eintrags noch nicht erfolgreich ausgeführt; keine vollständige CI-Bestätigung für den aktuellen Branch-Head. Vor Veröffentlichung: macOS-Job-Ergebnis, echte Intel-Mac-Stockfish-Partie samt Undo, Autosave und PGN prüfen. Keine neue Version/DMG und keine Maia-2-Integration.

**Nächster einzelner Schritt:** Aktuellen CI-Lauf einschließlich macOS nachverfolgen; neue Undo-Tests auswerten und ggf. Fehler gezielt beheben. Erst danach Maia-2-UCI-Kompabilität und Installation auf Intel-Mac absichern.

---

# Kibitz DE – 10.11.2026: CI-Fehler der Übersetzung lokalisiert, Tests angepasst

**GitHub-Actions-Prüfung:** Lauf [42849118573](https://github.com/wibem1/kibitz/actions/runs/42849118573), Commit `fef58aa0`: Rust/Ubuntu **bestanden**, App/Ubuntu **fehlgeschlagen**, zwei macOS-Jobs bei Abfrage weiterhin `queued`. Aus App/Ubuntu-Log: **60 Testdateien bestanden**, **2 fehlgeschlagen**, darin 11 Einzeltests. `localPlay.test.ts` (6), `offlineSession.test.ts` (5), `lichessPlay.test.ts` (14) und `shell.test.ts` (9) **bestanden**. Die 11 Fehler lagen in `PrepView.test.tsx` (5) und `TacticsView.test.tsx` (6) durch alte englische UI-Texterwartungen nach der Übersetzung; keine belegte Ursache im Stockfish-Spielmodus.

**Korrektur in GitHub (implementiert, noch nicht erneut grün getestet):** Erwartete deutsche Platzhalter, Schaltflächen, Rubriken und Statuslabels in `app/src/PrepView.test.tsx` (Commit `f2238e75`) und `app/src/TacticsView.test.tsx` (Commit `fb3dc0a2`) nach tatsächlichem UI-Quelltext angepasst; Produktivcode unverändert, verbleibende dynamische englische Hilfstexte noch offen. Bestehende funktionale Regressionstests dürfen nicht entfernt oder abgeschwächt werden.

**Aktueller Prüfstand:** Für den neuen Testcommit `fb3dc0a2` bei letzter Abfrage noch kein CI-Lauf zugeordnet, daher weiterhin **keine vollständige grüne CI-Bestätigung oder Intel-Mac-Abnahme**. Keine Veröffentlichung, keine Maia-2-Integration in diesem Schritt.

**Nächster einzelner Schritt:** Nächsten tatsächlich ausgeführten CI-Lauf für den aktuellen Branch-Head kontrollieren, ggf. verbliebene Test- bzw. Compile-Fehler korrigieren; danach realen Stockfish-Zug und Rücknahme/PGN/Autosave auf Intel-Mac prüfen. Erst nach dieser Abnahme Maia 2 integrieren.

---

# Kibitz DE – 10.11.2026: lokaler Stockfish-Gegner – erste Codeintegration

**Umgesetzt, noch nicht durch Build oder echten Engine-Test bestätigt:**
- `app/src-tauri/src/lib.rs`: explizite Tauri-IPC `offline_engine_move`. Jeder Spielzug startet eine **separate UCI-Engine** (nicht dieselbe Prozessinstanz wie die Analyse), benutzt `go nodes` mit gedeckeltem Budget 1.000–250.000 (Standard 20.000), 30-s-Zeitlimit und bestehenden Engine-Pfadresolver. Kein Engine-Start, wenn der Nutzer nicht den Stockfish-Spielmodus wählt. `bestmove (none)` wird als Fehler zurückgegeben. Kein Stream/Evaluation für laufende Lichess-Partien.
- `app/src/lib/offlineEngine.ts`: typisierte IPC-Brücke.
- `app/src/lib/localPlay.ts`: `playLocalUci` validiert Engine-Antworten als legale UCI-Züge in der aktuellen Stellung vor dem Übernehmen.
- `app/src/OfflinePlayView.tsx`: Wahl »Zwei Menschen« oder »Stockfish (offline)«, eigene Farbe Weiß/Schwarz; Engine am Zug nur im gewählten Offline-Modus, Eingabe während Suche gesperrt, stale Promise-Replies auf unmount/Stellungswechsel ignoriert, Fehler und erneuter Versuch. Spielmodus/Farbe nach erstem Zug nicht veränderbar, bis eine neue Partie gestartet wird.
- `app/src/lib/offlineSession.ts`: rückwärtskompatible optionale Speicherung der gewählten Engine und menschlichen Farbe neben Zügen/Brettorientierung. Validierte Werte; alte v1-Spielstände ohne Felder werden als »Zwei Menschen« geladen.
- Regressionstests in `localPlay.test.ts` (UCI illegal/legal) und `offlineSession.test.ts` (Modus-Roundtrip, beschädigte Mode-Werte) aktualisiert.

**Codecommits (Auszug):** `80d73114` Rust-IPC, `e83a83ba` Rust-Korrektur, `1d011d4e` UCI-Übernahme, `a4a71de2` IPC-Brücke, `f7517690` Oberfläche, `1b36764a` Speicherung, `684c9a83` Anbindung, `146fb9be`/`8365672c` Tests, `fef58aa0` Initialisierungsreihenfolge/Retry, `c61afd03` Eingabesperre aufheben, `8daec882` Rust-Format.

**Prüfstatus:** GitHub-Quelltext nachgelesen; **weder Vitest noch Rust-Tests, CI, UCI-Zug mit realem Stockfish noch Intel-Mac-Test bestanden/nachgewiesen**. Der CI-Lauf [42849118573](https://github.com/wibem1/kibitz/actions/runs/42849118573) zu früherem Codecommit war bei Abfrage weiterhin `queued`. Für den aktuellen HEAD keine Abnahme. Keine Veröffentlichung, DMG oder Versionsnummer.

**Einschränkungen:** Stockfish-Binary muss über vorhandene Engine-Einstellungen/PATH auffindbar sein. Standardbudget ist noch keine benutzerseitige Schwierigkeitsstufeneinstellung. Kein Maia 2, noch keine KI-Anbindung. Bei einer Rücknahme wird derzeit nur ein Halbzug zurückgenommen (nicht automatisch ein volles Mensch+Engine-Zugpaar). Aktive Engine-Anfrage wird bei Verlassen des Spielschirms UI-seitig ignoriert; der eigene UCI-Prozess endet spätestens nach 30 s.

**Nächster einzelner Schritt:** CI-Rückstau bzw. letzten Build nachvollziehbar klären, aktuelle Fehler der neuen Offline-Engine-Integration beheben, dann gezielt mit echtem Stockfish auf Intel-Mac spielen und sicherstellen, dass erneute Partien, Rücknahme, Wiederherstellung und PGN korrekt bleiben. Erst nach bestätigtem Stand Maia 2 angehen.

---

# Kibitz DE – 10.11.2026: Offline-Partie automatisch wiederherstellen

**Code auf Entwicklungsbranch implementiert, nicht freigegeben:** `app/src/lib/offlineSession.ts` speichert ein versioniertes, kompaktes JSON mit UCI-Zügen und Brettorientierung unter `kibitz.offlineGame.v1` im lokalen Anwendungsspeicher. Beim Wiederöffnen werden sämtliche Züge mit der vorhandenen Schachbibliothek und Legalitätsprüfung aus der Ausgangsstellung rekonstruiert; inkompatible oder beschädigte Daten werden verworfen und führen zu einer verständlichen deutschen Warnmeldung. Fehler bei verweigertem Speicherzugriff führen nicht zum Abbruch des Spielmodus; Nutzer wird zum PGN-Sichern aufgefordert. `OfflinePlayView.tsx` lädt beim ersten Mount, speichert nach Partie-/Ausrichtungsänderung; bisheriges PGN bleibt erhalten. Neuer Unit-Test `app/src/lib/offlineSession.test.ts` prüft Roundtrip, fehlende Daten, ungültige Daten und verweigerten Speicher.

**Commits:** `520e19dc` (Session-Replay/Speicherformat), `91acc5fc` (Anbindung), `9b57a671` (Regressionstests), `243cc226` (Speicherzugriffsfehler abfangen).

**Prüfstand:** Nur statische Quelltextprüfung. Vitest, TypeScript und eine echte Intel-Mac-App sind noch nicht geprüft. Der zugehörige CI-Lauf [42845534397](https://github.com/wibem1/kibitz/actions/runs/42845534397) meldete bei Abfrage `queued`; für den aktuellsten Commit war noch kein Lauf zugeordnet. **Nicht als getestete, installierbare Funktion darstellen.**

**Grenzen:** Ein einzelner fortsetzbarer Spielstand auf demselben Rechner/Anwendungsprofil, keine Cloud- oder SQLite-Partiearchivierung, keine manuelle Auswahl früherer Partien. Ein Browser-/App-Speicherreset löscht diesen Zwischenstand; PGN-Export bleibt separate Sicherung. Offlinepartien gegen Stockfish/Maia 2 und KI-Chat weiterhin nicht eingebaut.

**Nächster einzelner Schritt:** Neueste CI-Fehler/Buildresultate prüfen und beheben; anschließend Anwenderprüfung am Intel Mac: Züge ausführen, Ansicht verlassen und wieder öffnen, App neu starten, Umwandlung/Rücknahme, PGN-Datei und korrektes Ergebnis kontrollieren. Erst dann Engine-Spiel hinzufügen.

---

# Kibitz DE – 10.11.2026: korrekter PGN-Ausgang im Offline-Modus

**Implementiert:** `lib/localPlay.ts` ermittelt den regulären Endstand aus `chessops`-Position/`outcome()`: Weiß gewinnt `1-0`, Schwarz gewinnt `0-1`, regelkonformes Remis `1/2-1/2`, laufende Partie `*`. Die PGN-Kopfzeile `Result` und der Abschlussmarker nutzen denselben Wert. `OfflinePlayView.tsx` zeigt eine deutsche Meldung bei Partieende. Isolierter Regressionstest für das Narrenmatt `1. f3 e5 2. g4 Dh4#` ergänzt; normaler unvollendeter Export bleibt `*`. Commits: `bab5accf`, `144e0524`, `7828789e`.

**Prüfstatus:** Nach Quelltextsichtprüfung in GitHub gespeichert. Keine erfolgreiche Ausführung von Vitest oder Tauri bestätigt. Vorherige CI-Läufe 42840633875 und 42841081341 meldeten bei erneuter Abfrage noch `queued`. Für Testcommit `7828789e` war noch kein zugeordneter CI-Lauf verfügbar. Keine Releasefreigabe.

**Bekannte Einschränkungen:** Manuelle Aufgabe/Remisvereinbarung ohne schachliche Endstellung fehlt im lokalen Modus; keine Uhr, kein gespeicherter Zwischenstand, noch kein Stockfish/Maia-Spiel oder freier KI-Chat. Ein Remisgrund wird vorerst allgemein als „Remis“ angezeigt.

**Nächster einzelner Schritt:** CI-Status prüfen; Fehler priorisiert beheben. Danach Offlinepartie beim Wechsel zwischen Ansichten dauerhaft erhalten (validierter Zustand und Save/Restore), bevor Engine-Gegner ergänzt werden.

---

# Kibitz DE – 10.11.2026: erster Offline-Spielmodus implementiert

**Implementiert (Code auf GitHub):** Unabhängige neue Ansicht `OfflinePlayView.tsx` für zwei Personen am selben Rechner, aufgebaut auf dem bestehenden Chessground-Brett und `chessops`. `lib/localPlay.ts`: Ausgangsstellung, legale Züge inklusive Umwandlung über vorhandenen Picker, Zugfolge mit FEN/SAN/UCI, Rücknahme eines Halbzuges und PGN-Export mit offenem Ergebnis `*`. UI: Brett drehen, neue Partie mit Bestätigung, PGN herunterladen. Keine Netz- oder Engine-Aufrufe; bewusste Trennung von Lichess-Online-Partien und dortiger Fair-Play-Sperre. Hauptnavigation und `ViewId` auf `offline` erweitert; sichtbar in einfacher Navigation. Neuer Unit-Test `lib/localPlay.test.ts` (legal/illegal, Farben, Undo, PGN, Matt) und Rail-Test aktualisiert.

**GitHub-Commits:** `940fadd0` (Modell), `2c8eb6a3` (Ansicht), `3f493eac` (Tests), `5d13846e` (Navigation), `080f5a92` (Rail), `22389765` (App-Integration), `951f2fcf` (Rail-Test).

**Prüfstatus:** Quellcode erstellt; **Unit-Tests und TypeScript/Tauri nicht lokal ausführbar**, weil die Ausführungsumgebung GitHub nicht erreichen kann und keine Repository-Abhängigkeiten lokal vorliegen. CI-Lauf [42840633875](https://github.com/wibem1/kibitz/actions/runs/42840633875) für `951f2fc` bei Abfrage **queued**, keine bestandenen Tests nachgewiesen. Kein echter UI-/Intel-Mac-Test; keine Veröffentlichung. Bei CI-Fehlern die Ursache gezielt beheben.

**Einschränkung:** PGN-Export markiert das Ergebnis vorerst bewusst `*`, auch wenn Schachmatt erkannt ist; ein vollständiges Ergebnismodell, Dauerspeicherung in SQLite, Offline-Spiel gegen Stockfish/Maia 2 und KI-Chat sind noch offen. Verlassen der Ansicht beendet die bisher nur im React-Zustand gespeicherte Partie; erst nach bestätigter Basisfunktion Sitzungs-Persistenz ergänzen.

**Nächster einzelner Schritt:** Lauf 42840633875 auswerten, TypeScript-/Vitest-Fehler korrigieren, dann auf Intel-Mac Offline-Spiel einschließlich Umwandlung, Rücknahme und PGN-Import prüfen. Erst danach Ergebnisautomatik und dauerhafte Sitzung ergänzen.

---

# Kibitz DE – 10.11.2026: Lichess-Spielbereich auf Deutsch (neuer Entwicklungsschritt)

**Implementiert und in GitHub gesichert:** `app/src/PlayView.tsx` (Commit `e6aeb125`), `app/src/lib/lichessPlay.ts` (Commit `49978c02`) und dazugehörige Tests `app/src/PlayView.test.tsx` (`74dc05e0`), `app/src/lib/lichessPlay.test.ts` (`19abd38a`) auf `feat/de-simple-readable-ui`. Übersetzt wurden sichtbare Benutzertexte für Lichess-Kontozugang, Gegnersuche, laufende Partie, Remis, Aufgabe, Wiederaufnahme, Spielende und ausdrücklicher Fair-Play-Hinweis. Werte von Lichess, Schnittstellenkennungen, SAN/UCI und Engine-Sperre wurden nicht verändert.

**Prüfstatus:** Code lesend nachkontrolliert, dazu Tests entsprechend angepasst. Noch **kein** TypeScript-Build, Vitest-Lauf oder Mac-Anwendungstest für diesen Commit nachgewiesen. Keine Veröffentlichung, kein neuer Download. Bei Fehlschlag erst Tests/Quelltext prüfen. Andere Ansichten und dynamische Serverfehlermeldungen weiterhin teilweise Englisch.

**Chess-Studio-Übernahmeprüfung:** `wibem1/AI-Chess-Studio` Hauptzweig `PROJECT_STATE.md` (Stand 04.11.2026) enthält Grundkonzept eines strategischen Dialogs und keine dort bestätigte aktuelle KI-Integration. Ideen für Dialoggedächtnis, Stellungsstempel, Varianten und optionalen Stockfish-Faktencheck übernehmen; **keinen unbestätigten Code direkt kopieren**. Aktuelle Chess-Studio-Version und eventuelle Entwicklungsbranches vor konkretem Code-Reuse separat nachweisen.

**Nächster einzelner Schritt:** Den CI-Lauf für aktuellen Branch-Head prüfen und ggf. die beiden geänderten UI-/Hilfsfunktionstests reparieren. Dann Intel-Mac-Validierung der Spieloberfläche und des Fenster-Scrollens; darauf aufbauend Offline-Mensch-gegen-Mensch-Modus als erstes neues Spielfeature angehen.

---

# Kibitz DE – 10.11.2026: Schachstudio-Zielbild ergänzt

**Neue Anforderungen verbindlich dokumentiert:** vollständige deutsche Übersetzung, Offlinepartien gegen Menschen/Stockfish/Maia 2, Onlinepartien mit persönlichem Lichess-Account auch gegen Menschen, freier KI-Dialog mit Kontext der aktuellen Stellung und Partie. Konzept und Abnahmekriterien: [docs/KIBITZ_DE_SCHACHSTUDIO.md](docs/KIBITZ_DE_SCHACHSTUDIO.md), Commit `3930b839b78b0ac27af929fc648e6c1ea82a5a74`.

**Vorhandener, nicht erneut real geprüfter Code:** `app/src/PlayView.tsx`, `app/src/lib/lichessPlay.ts` implementieren Lichess-Board-API-Grundfunktionen und Gegnersuche, aber noch keine bestätigte reale Nutzersitzung. `app/src/lib/engine.ts` bietet UCI-Analyse, **noch keinen vollständigen Offline-Spielmodus**. Maia 2 und freier KI-Chat sind geplant, nicht implementiert.

**Wesentliche Grenze:** Während aktiver Lichess-Partien gegen Menschen keine Engine- oder KI-Unterstützung gemäß Fair Play. Maia 2 für lokale Partien; spätere optionale Maia-3-Prüfung.

**Prüfstatus:** Konzept/Quellcodeprüfung, **keine neuen Funktionstests und keine neue Veröffentlichung**.

**Nächster einzelner Entwicklungsschritt:** Aktuellen CI-Stand des Branches überprüfen, anschließend die sichtbaren Lichess-Spieltexte in `PlayView.tsx` und `lib/lichessPlay.ts` übersetzen und passende Tests aktualisieren.

---

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

