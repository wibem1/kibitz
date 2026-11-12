# Kibitz DE – 12.11.2026: Releasevorbereitung und CI-Blocker

**Nutzerauftrag:** Alle bislang implementierten Funktionen (PGN-Sammlungsimport, Lichess-Synchronisation, Partieübersicht/Schlüsselstellen, gesamte Partie auf Spielseite, Spielen ab beliebigem Halbzug, Speicherverwaltung, Diagnoseexport) in einer neuen Version zusammenführen und veröffentlichen.

**Aktuelle Freigabeentscheidung: NO-GO / keine neue Versionsnummer**, bis Frontend- und Rust-CI sowie ein native Intel-Mac-Build erfolgreich geprüft sind. Dies ist kein fertiges Release. Ausgangsversion in allen aktuellen Manifesten: `0.1.4`.

**Konkrete Befunde im GitHub Actions-Lauf [43199121413](https://github.com/wibem1/kibitz/actions/runs/43199121413):** Linux-Frontend 633 erfolgreich, 7 fehlgeschlagen (davon 6 veraltete `SettingsView.test.tsx`-Assertions auf aus der Einstellungsseite ausgelagerte Funktionen, 1 veralteter TWIC-Autosync-Text); Rust-Linux-`cargo fmt --all --check` scheiterte an `app/kibitz-db/src/profile.rs`, nicht an Rust-Tests. Aus diesem Lauf gibt es **keinen** Nachweis erfolgreichen `tsc --noEmit`, `cargo clippy`, Rust-Tests oder Intel-DMG-Builds.

**Gezielt korrigiert:** `profile.rs` entsprechend `rustfmt`-Diff formatiert ([f908c158](https://github.com/wibem1/kibitz/commit/f908c158e7fcbeca138ec36003d6cf2d7e6bdfda)); `SettingsView.test.tsx` auf aktuelle deutsche Einstellungen/Diagnosefunktion umgestellt ([23840a82](https://github.com/wibem1/kibitz/commit/23840a824f088603384c05bf0329d263b08cf0dd)); `TwicView.test.tsx` auf tatsächlich angezeigten deutschen Autosync-Text angepasst ([b5b475ba](https://github.com/wibem1/kibitz/commit/b5b475ba4883281058202015798c82ff372beb45)). Diese Änderungen sind **statisch**, noch nicht grün verifiziert. CI-Lauf für vorherigen TWIC-Test-Commit [43199898141](https://github.com/wibem1/kibitz/actions/runs/43199898141) zeigte Linux-Jobs bei der Abfrage `in_progress`, Mac-Jobs `queued`; Intel-Mac-Preview [43199898291](https://github.com/wibem1/kibitz/actions/runs/43199898291) war `queued`. Für letzten TWIC-Korrekturcommit noch kein vollständiges Abschlussresultat ermittelt.

**Weitere Release-Voraussetzungen:** Bekannten Intel-Maia-2-Runtime/Link-Blocker prüfen, vollständige Desktop-Spiel-/Speicher-/Import-/Diagnose-Schlüsselstellenabläufe auf echter Hardware testen. UI- und Unit-Tests allein belegen keine korrekte Engine-Laufzeit. Erst nach Testbestehen die Version in allen zusammengehörigen Manifesten/Lockdateien konsistent erhöhen und signierten/unsignierten Testbuild gemäß Projektstandard erzeugen. Keine Downloads oder Releases behaupten, die noch nicht als tatsächliches Artefakt vorliegen.

**Nächster Einzelauftrag:** Aktuelle CI-Logs prüfen, weitere Fehlermeldungen mit genau einer gezielten Korrektur beheben und anschließend erfolgreiches Gesamtresultat nachweisen. Danach Version und Paket.

---

# Kibitz DE – 12.11.2026: Diagnoseexport für Speicher- und Importvorgänge erweitert

**Bestandsprüfung:** Eine lokale Diagnosefunktion existierte bereits: `app/src/lib/diagnostics.ts` protokolliert maximal 120 Zeitstempel samt kontrollierten Ereigniscodes in `localStorage`; unter **Einstellungen → Diagnose → Diagnose speichern** wird bei ausdrücklichem Klick die JSON-Datei `Kibitz-DE-Diagnose.json` zum Download angeboten, und **Diagnose löschen** leert das Protokoll. Keine automatische Übertragung, keine API-Schlüssel, PGN/FEN, Spielernamen, Pfade oder unkontrollierten Fehlertexte im Bericht. Der Download-Aufruf selbst beweist nicht die erfolgreiche Speicherung auf der Festplatte.

**Ergänzt im Branch `feat/de-simple-readable-ui`:** Erlaubte Ereigniscodes für explizite Datenbankspeicherung (Anforderung, Erfolg, Duplikat, Fehler), PGN-Sammlungsimport (Anforderung, Erfolg, Teilerfolg, Fehler) und bestätigte/abgebrochene Spielseitenübergabe. Der getypte `importPgnIntoDatabase`-Wrapper in `app/src/lib/db.ts` protokolliert ausschließlich Codes (keine Inhalte oder Backend-Fehlertexte); `ImportView.tsx` protokolliert Sammelimport-Ausgänge; `App.tsx` protokolliert Übergabe-Abbruch bzw. Bestätigung. Ergänzter Vitest-Fall in `app/src/lib/diagnostics.test.ts` für die zulässigen Codes und die Abwesenheit sensibler Felder.

**Commits:** [74f40777](https://github.com/wibem1/kibitz/commit/74f407777998457dde4777384c6a061e4e7f709c), [141e46d2](https://github.com/wibem1/kibitz/commit/141e46d20fa00b2e68367bda63d27c5021d60fbe), [de0e7044](https://github.com/wibem1/kibitz/commit/de0e70443191abd9c7503cadcd451ea5a18d21b1), [079bf184](https://github.com/wibem1/kibitz/commit/079bf184735b491c1142d35617a542e757e5858c), [413d3c52](https://github.com/wibem1/kibitz/commit/413d3c524dcb576709cf688439bc26b2c6eb1e13).

**Prüfstatus:** Quellcode statisch kontrolliert, Test ergänzt, **noch kein erfolgreicher TS-/Vitest-/Desktop-Test nachgewiesen**. Der Bericht ist ein begrenztes Ereignisprotokoll und **noch kein vollständiger Systemzustandsbericht** (z. B. Engineversion, Job-IDs, redigierte Speicherstatistiken); diese Erweiterung bedarf einer getrennten Datenschutzprüfung. Kein neuer Versionsstand, keine Veröffentlichung.

**Nächster Schritt:** Gezielten `diagnostics.test.ts`-Vitest und Frontend-Build prüfen, anschließend auf Intel-Mac einen Datenbank-Speicherfehler und einen erfolgreichen Import erzeugen, Diagnose als JSON exportieren, Inhalt und Ablage kontrollieren sowie `Diagnose löschen` testen.

---

# Kibitz DE – 12.11.2026: Definiertes Speichermanagement – Konzept und erste echte SQLite-Speicherung

**Verbindliche Regeln und Grenzen:** In [docs/SPEICHERMANAGEMENT.md](docs/SPEICHERMANAGEMENT.md) sind Datenbankpartien, Offline-Autosave (`localStorage`), separate FEN-Übungen, PGN-Export und reine UI-Metadaten getrennt dokumentiert. „Gespeichert“ muss stets den bestätigten Speicherort nennen. Bestehende Originalpartien dürfen niemals durch eine Übungsfortsetzung überschrieben werden. PGN-Download-Aufruf ist keine bestätigte Dateisicherung. Spätere Zielstufen: mehrere benannte/verknüpfte Übungsfassungen, robustes Backup/Restore, Versionierung/Konflikte – **noch nicht umgesetzt**.

**Neu implementiert im aktuellen Entwicklungsbranch:**
- `app/src/lib/db.ts` stellt `importPgnIntoDatabase(pgn, sourceName)` für das bereits registrierte Tauri-Kommando `import_pgn_database` zur Verfügung.
- `app/src/OfflinePlayView.tsx`: eigener Knopf **»In Datenbank speichern«** für normale Offline-Partien sowie gestartete Übungsfortsetzungen. Die vorhandene `localPgn`-Serialization einschließlich `SetUp`/`FEN` wird über den bestehenden SQLite-PGN-Importer verarbeitet. Erfolg (neu importiert) und Duplikat (bereits vorhanden) werden unterschieden. Bei Fehler bleibt die Partie geöffnet, Meldung benennt den fehlgeschlagenen Speicherort; PGN-Export bleibt verfügbar. Ein Fingerprint aus Start-FEN und UCI-Zügen verhindert falsche „gesichert“-Meldungen, nachdem weitere Züge gespielt werden. Speicherhinweise unterscheiden lokale Zwischensicherung der Normalpartie von nicht dauerhaft gespeicherten FEN-Übungen.
- `app/src/App.tsx`: Vor Übertragung einer neuen Gesamtpartie an die Spielseite können Nutzer nun neben PGN-Export die bisherige Player-Partie ausdrücklich **in der geöffneten Datenbank speichern**. Speicherung sperrt den Ersetzen-Button für die Dauer des Vorgangs, wird nach Importbestätigung als gesichert angezeigt und beim nächsten Dialog zurückgesetzt. Der Benutzer muss weiterhin ausdrücklich ersetzen. Die bestehende `localStorage`-Zwischensicherung einer normalen Offline-Partie wird dadurch nicht gelöscht. Ein abgebrochener/fehlgeschlagener Datenbankspeichervorgang ersetzt **nicht automatisch**.

**Commits:** [52995c83](https://github.com/wibem1/kibitz/commit/52995c835132e768491e29652cc7dbf3041eb61e), [ebdec993](https://github.com/wibem1/kibitz/commit/ebdec993ace3726247ac6d25b063d68f5e15286e), [6d997b73](https://github.com/wibem1/kibitz/commit/6d997b738eec8458467bb1a5bf8e6de89986d550), [0b200be3](https://github.com/wibem1/kibitz/commit/0b200be38f80902f528ac3b8f062c1ed923db858), [9b8f0eba](https://github.com/wibem1/kibitz/commit/9b8f0eba77776f2fc678ea9e8906e79b0dc3a6c4).

**Qualifikation:** Änderungen auf GitHub gesichert und Aufrufwege statisch kontrolliert, **noch kein nachgewiesener TypeScript-/Rust-/Vitest-Lauf und keine echte Datenbank-/Mac-Abnahme für diese Commits**. Der PGN-Importkern kann eine eigene SQLite-Kopie erzeugen, ist aber noch **kein vollständiges Übungsvariantenarchiv mit Verknüpfung zur Original-ID, benannten Versionen und automatisierten Backups**. Keine Versionsnummer/Release freigegeben.

**Nächster Einzeltest:** Test-DB öffnen, Offline-Partie und FEN-Fortsetzung jeweils explizit speichern, gespeicherte Partie aus dem Datenbankbrowser wieder öffnen, Duplikat und Fehlersituation bei geschlossener DB prüfen. Vor Übergabe mit bestehender Offline-Partie Dialog, Abbruch, bestätigter PGN-Export und SQLite-Sicherung kontrollieren. Anschließend den verknüpften Spielstand/Versionierungs- und Backupmechanismus in einem separaten überprüfbaren Schritt umsetzen.

---

# Kibitz DE – 12.11.2026: Nachfrage und PGN-Sicherung vor Übergabe an die Spielseite

**Implementiert im Entwicklungsbranch (noch nicht verifiziert):** Beim Klick auf »Ganze Partie zur Spielseite« wird die Übergabe vor dem Wechsel durch ein Dialogfenster bestätigt. Es zeigt die Zahl der Halbzüge einer bereits vorhandenen Player-Partie (sofern vorhanden) und bietet **»Abbrechen«**, **»Vorherige Partie als PGN speichern«** und **»Ohne zusätzliche Sicherung ersetzen«**. Nach einem angestoßenen PGN-Download wird ausdrücklich darauf hingewiesen, dessen tatsächliche Speicherung zu prüfen; die Web-App kann den erfolgreichen Download nicht nachweisen. Der Nutzer bestätigt den anschließenden Wechsel selbst. Das Original in der Datenbank oder in der Analyseansicht wird nicht verändert. `App.tsx` hält für die laufende Sitzung einen Snapshot der zuletzt auf der Offline-Spielseite gespielten Partie. `OfflinePlayView.tsx` meldet Spieländerungen über `onPlayerStateChange`, nicht aber beim bloßen Durchblättern einer übernommenen Originalpartie. Nach Neustart wird der normale Offline-Spielstand bei Bedarf aus dem bestehenden `localStorage`-Autosave wiederhergestellt.

**Speichersemantik ausdrücklich überprüft:** Importierte/synchronisierte Partien sind in der geöffneten SQLite-Datenbank; Offline-Standardpartien werden ausschließlich unter `kibitz.offlineGame.v1` in `localStorage` automatisch gesichert, **nicht** in SQLite. Übungsfortsetzungen aus der analysierten Partie werden nicht automatisch gespeichert, insbesondere nicht in der Datenbank und überschreiben absichtlich nicht die normale Offline-Autosicherung. Sie sind beim späteren Wechsel gegebenenfalls nur als Sitzungssnapshot verfügbar, bis ein PGN exportiert wird. `ui_session` und `last_game` in SQLite speichern Navigationszustand, nicht alle Offline-Partieinhalte. Eine separate SQLite-Persistierung und späteres Wiederöffnen beliebiger Übungsfortsetzungen bleiben offen.

**Commits:** [b7b5c34e](https://github.com/wibem1/kibitz/commit/b7b5c34e936b73c4a076412fc4148a59a2532ec5), [b46a5cab](https://github.com/wibem1/kibitz/commit/b46a5cab363e8159d712b82e852120a27f65046f), [a24b9ecb](https://github.com/wibem1/kibitz/commit/a24b9ecb202912ce9905d2b63563a770a6669a91), [631d2969](https://github.com/wibem1/kibitz/commit/631d29698fb205696c74ab03cd57d2b7dae6e970).

**Prüfstatus:** Quellcodeänderungen gesichert, kein bestätigter TypeScript/Vitest/CI-Lauf, keine echte Dialog-/Download-/Mac-Laufzeitabnahme. Keine neue Versionsnummer und keine Veröffentlichung.

**Nächster Einzeltest:** Auf echtem Intel-Mac: alte Offline-Partie mit Zügen im Player, Partie aus Datenbank laden und Übergabe auslösen, `Abbrechen`, PGN-Download kontrollieren, erst dann `Ersetzen`, originale komplette Zugliste nachweisen, Fortsetzung ab frei gewählter Stellung beginnen, zur Analyse zurückkehren. Kontrollieren, dass normaler Offline-Spielstand im `localStorage` bleibt und Übungsfortsetzung nicht irrtümlich als automatisch datenbankgesichert dargestellt wird.

---

# Kibitz DE – 12.11.2026: Partie-Fehlerübersicht und Weiter­spielen gegen Stockfish ab Stellung

**Entwickelt im Branch `feat/de-simple-readable-ui`, noch NICHT als geprüfte Version freigegeben.**

**1. Fehler-/Schlüsselstellenübersicht:** `app/src/lib/gameReview.ts` berechnet aus gespeicherten Enginebewertungen unmittelbar **vor und nach** einem Halbzug den Bewertungsverlust aus Sicht der ziehenden Seite. Kategorien: **Ungenauigkeit** ab 50 Centibauern, **Fehler** ab 100, **grober Fehler** ab 200. Fehlende Stellungspaare werden bewusst ausgelassen; Abdeckung wird angezeigt. Maximal acht automatisch gerankte **Kandidaten für Schlüsselstellen** sind die Züge mit dem höchsten Bewertungsverlust (noch **keine** strategische KI-Auswahl). `GameView.tsx` zeigt Gesamtsummen, alle erkannten Fehler und anspringbare Schlüsselstellen mit dem Knopf **»Fehler und Schlüsselstellen«**. Bei fehlenden Werten verweist es auf vorhandenes **»Neu bewerten«**. Diese Auswertung ist kein Nachbau von Lichess-Win-Probability/Accuracy.

**2. Weiterspielen ab angezeigter FEN:** `GameView.tsx` zeigt **»Ab hier gegen Stockfish spielen«**. Über `App.tsx` wird die tatsächlich angezeigte FEN (`shownFen`, auch Variantenvorschau) an `OfflinePlayView` weitergegeben. Diese erzeugt mit `localGameFromFen` eine eigenständige Übungspartie, wählt als menschliche Farbe die Seite am Zug, setzt Stockfish als Gegner und bietet dessen vorhandene Elo-Einstellung. Originalpartie bleibt unverändert. Der Übungsverlauf überschreibt **nicht** die normale Offline-Autosicherung. `localPgn` exportiert Übungspartien ab Nicht-Startstellung mit `SetUp`/`FEN` und korrekten schwarzen Startzugnummern. Normale Navigation zu »Offline spielen« führt wieder zur bisherigen gespeicherten Partie.

**Wichtige technische Einschränkungen:** Die Statistikauswertung benötigt vollständige **aufeinanderfolgende** Enginebewertungen. Eine bewertete Partie mit Lücken kann nur teilweise klassifiziert werden. Der Begriff »Schlüsselstelle« ist hier bewusst vorläufig als Engine-Kandidat definiert; strategische Auswahl, natürliche KI-Begründungen und längerfristige Pläne bleiben offen. Auf einem Intel-Mac ist die tatsächliche Ausführung von Stockfish für beide Funktionen noch nicht praktisch nachgewiesen.

**Commits:** [22ebf352](https://github.com/wibem1/kibitz/commit/22ebf3524fc71b8e21c141fb2255830c5390d770), [d2f8b7c4](https://github.com/wibem1/kibitz/commit/d2f8b7c48c797db8716f87ba75e669874a970608), [386a87a7](https://github.com/wibem1/kibitz/commit/386a87a78eb6d61fcfce457de226d1c42bf14f1a), [a0550e41](https://github.com/wibem1/kibitz/commit/a0550e416cb52120244f01c2fc66c7ec2218aa29), [1d9ed52b](https://github.com/wibem1/kibitz/commit/1d9ed52bfc39d110aa1ea6414121b0279861c2b0), [2348cf3e](https://github.com/wibem1/kibitz/commit/2348cf3eaa1e0fa1bb826c53d53c16805197e0fa), [80b6b939](https://github.com/wibem1/kibitz/commit/80b6b939b93ec4cfcbed2bead33fef27db5e25a5), [d8d98ead](https://github.com/wibem1/kibitz/commit/d8d98ead3a37e3d24d7ced89e795e841e733b9a6).

**Prüfstatus:** Quellcodepfade statisch kontrolliert; Vitest-Tests für weiße/schwarze Bewertungsverluste, fehlende Bewertungen und frische Side-to-move-POV-Bewertungen geschrieben, **noch nicht ausgeführt**. Zum Prüfzeitpunkt Intel-Mac-Preview-Action queued, keine bestätigte vollständige CI-/TypeScript-/Vitest-Abnahme oder realer Mac-/Windows-Test. **Keine Versionsfreigabe**.

**Nächster einzelner Schritt:** Ausstehende GitHub Actions prüfen; TypeScript-/Vitest-Tests durchführen, anschließend reale Partieanalyse und Weiterspielen von Start-, Mittelspiel-, Endspielstellung und Variantenvorschau am Intel-Mac kontrollieren, gegebenenfalls gezielt korrigieren. Nach erfolgreicher Abnahme eine neue Versionsnummer vergeben und veröffentlichen.

---

# Kibitz DE – 12.11.2026: PGN-Sammlungen in geöffnete Datenbank importieren

**Im Entwicklungsbranch implementiert (noch nicht abgenommen):** Die bisherige Einzelpartie-Anzeige unter »Partien importieren« bleibt erhalten. Ein getrennter Abschnitt »PGN-Sammlung dauerhaft in die Datenbank importieren« nimmt eine PGN-Datei auf und ruft den neu registrierten Tauri-Befehl `import_pgn_database` auf. Der Befehl verwendet den **bereits bestehenden** `kibitz_db::import::import_pgn`-Kern mit Duplikaterkennung und Positionsindizierung, aber schreibt in die tatsächlich geöffnete SQLite-Datenbank. Ergebnisbericht zeigt übernommene Partien, Duplikate, fehlgeschlagene Partien, indizierte Stellungen und erste Fehlerbeispiele. Eine geschlossene Datenbank liefert eine Fehlermeldung. Format `.pgn`/`.txt` und Dateigrenze 25 MiB (bewusst begrenzt, da Datei als UTF-8-Text per Webview IPC übertragen wird). Für beliebig große Sammlungen ist noch der vorhandene Streaming-CLI-Import nötig. SCID-.si4-Import bleibt Kommandozeilenfunktion. Keine neue Abhängigkeit.

**Beleg-Commits:** [33296c7a](https://github.com/wibem1/kibitz/commit/33296c7a828fccf46b67834421bf3ed8e8d4095f), [e0a8855f](https://github.com/wibem1/kibitz/commit/e0a8855f558ae2193eb26c37eb56ebdff69bfcfc), [2b3770aa](https://github.com/wibem1/kibitz/commit/2b3770aa63ef31831a65225cce6a77e0aea5e20c).

**Einschränkungen/Prüfstatus:** Quellcode und IPC-Registrierung statisch kontrolliert. Noch kein erfolgreich nachgewiesener TypeScript-/Rust-/CI-Lauf, kein tatsächlicher Desktop-Importtest und kein Beleg für ausreichende UI-Reaktionsfähigkeit beim Import einer 25-MiB-Datei. Insbesondere prüfen: offene/geschlossene DB, Einzel-PGN, Mehrpartien-PGN, Reimport/Duplikate, fehlerhafte Partie und Aktualisierung der Datenbankansicht. Für vollständigen großen, nicht blockierenden Import (auch >25 MiB) native Dateiauswahl + Hintergrund-Streaming mit Fortschritt nötig. **Keine neue Version oder Veröffentlichung.**

**Nächster einzelner Schritt:** CI/Build prüfen und echten kleinen Mehrpartien-Import auf Intel Mac durchführen; bei Erfolg Streaming-Import für sehr große Sammlungen getrennt entwickeln.

---

# Kibitz DE – 12.11.2026: exakte Auswahlanalyse (gefilterte Partiegruppe)

**Im Entwicklungsbranch implementiert:** Die Rubrik »Partien auswerten« hat neben »Alle Partien eines Spielers« und »Zwei Partien vergleichen« jetzt »Gefilterte oder manuell ausgewählte Partien auswerten«. Die Gruppenauswahl in `app/src/CompareGames.tsx` verwendet die vorhandenen Datenbankfilter (Spieler, Datumsgrenzen, Ergebnis, ECO), Sortierung und seitenweise Liste. Einzelne Partien können markiert, die gesamte gefilterte Treffermenge bis maximal **2000** Partien über alle Seiten ausgewählt oder die Auswahl geleert werden. Für die eigentliche Berechnung wird ein Spielername verlangt; nur dessen Partien in der expliziten ID-Liste zählen. Die echte Schachprofilaggregation (taktische Motive, strukturelle Merkmale, Bewertungen) läuft **nur** über die ausgewählten IDs; Ergebnis nennt Auswahlgröße und tatsächlich verarbeitete Partien. Beispielpartien sind anklickbar. Keine neue Engine-Suche, kein KI-Dialog.

**Implementierungskette:** `app/src/CompareGames.tsx` → `app/src/lib/db.ts:buildProfileSelected` → registrierter Tauri-Befehl `build_profile_selected` in `app/src-tauri/src/lib.rs` / `dbops.rs` → `app/kibitz-db/src/profile.rs:build_profile_selected` → existierende pure Aggregation `kibitz_profile::player_profile`. Ursprüngliches `build_profile` bleibt erhalten. Identitätsauflösung und Einschränkungen der vorhandenen Pipeline werden respektiert (abgeschlossene Standardstart-Partien, mindestens 10 Halbzüge). Rust-Regressionstest `selected_profile_only_counts_requested_games` in `dbops.rs` prüft gegen eine bekannte Beispielpartie sowie unbekannte/ungültige IDs.

**Wichtig:** Nicht alle gefilterten Treffer müssen zum angegebenen Spieler gehören. Dieser Ausschluss wird bei der Auswertung sichtbar durch getrennte Anzeige »ausgewählt«/»tatsächlich berücksichtigt«. Bei mehr als 2000 Treffern muss die Suche vor »Alle Treffer auswählen« weiter eingegrenzt werden. Die Auswahl existiert nur für die laufende Ansicht und ist noch nicht als benannte Gruppe gespeichert. Die Ergebnisse werden nicht in das dauerhafte Spielerprofil überschrieben. Alle Partien eines Spielers bedeutet unverändert bis zu 2000 neueste qualifizierende Partien. Kein frei konfigurierbarer LLM-Dialog.

**Prüfstatus:** Aufrufe und Quelltext statisch geprüft, Regressionstest geschrieben, **noch kein erfolgreich ausgeführter Rust-/TypeScript-/CI-Build oder realer Mac-/Windows-Laufzeitnachweis**. Keine neue Version und keine Veröffentlichung. Entwickler-Commits: [93d34dac](https://github.com/wibem1/kibitz/commit/93d34dacbaeee752696743d17c465d6ade01c942), [b6e4aafe](https://github.com/wibem1/kibitz/commit/b6e4aafec4f82b92967196acba20b403b37dc78d), [7782f638](https://github.com/wibem1/kibitz/commit/7782f638a647a87e9a7337d055027db364946726), [79a06cec](https://github.com/wibem1/kibitz/commit/79a06cec5e0e9e139f164a4815e32ddbd11b8fa7), [2221978a](https://github.com/wibem1/kibitz/commit/2221978a46063dd2b3a3edec99a54768e889f9f2), [76aac9fe](https://github.com/wibem1/kibitz/commit/76aac9fee387f6cb1f32089632bd3d67b782194d), [fb0c5e23](https://github.com/wibem1/kibitz/commit/fb0c5e230ce718117c27e7d87a52c75e71aa0b78), [dc07207c](https://github.com/wibem1/kibitz/commit/dc07207cc01c6cda32d806347b670f10f9d62460), [9678dc83](https://github.com/wibem1/kibitz/commit/9678dc83f2ca47bcecc97fca40d236459da755d4).

**Nächster einzelner Schritt:** TypeScript-Vite-Build, Rust-Test `selected_profile_only_counts_requested_games`, GitHub CI und danach echte GUI-Prüfung auf Intel-Mac und Windows. Bei Erfolg erst Testversion/Versionsnummer vergeben; separat strategische KI-Erklärungen und persistierte Auswahlgruppen planen.

---

# Kibitz DE – 12.11.2026: Datenbankweit filtern und sortieren

**Implementiert im Branch `feat/de-simple-readable-ui` (noch nicht abgenommen):**
- Die **vorhandenen** Datenbankfilter für beide Spielernamen als Teilstring, Turnier, Datum von/bis, Ergebnis, ECO-Code und Herkunft werden in `app/src/DatabaseScreen.tsx` weiter über `list_games` an SQLite gesendet; `total` zählt alle Treffer unabhängig von der gerade geladenen Seite.
- **Neu:** explizite Datenbank-weite Sortierung **vor** `LIMIT/OFFSET` in `app/src-tauri/src/browse.rs` mit geprüfter Positivliste (Importreihenfolge, Datum, Weiß, Schwarz, Ergebnis, ECO, Turnier, Zugzahl), aufsteigend/absteigend. Alte `list_games_impl`-Signatur und bisheriges Standardverhalten (`g.id DESC`) bleiben für bestehende Aufrufer und Tests kompatibel. UI und Typed-Wrapper in `app/src/lib/db.ts` angepasst.
- Irreführende clientseitige Spaltenkopf-Sortierungen nur der geladenen Datenbankseite wurden aus `DatabaseScreen` entfernt; stattdessen explizite Sortierauswahl. In `CompareGames.tsx` kann die Auswahl für den **Zwei-Partien-Vergleich** nun nach Spieler, Datumsgrenzen, Ergebnis und ECO-Code serverseitig gefiltert und über den gesamten Trefferbestand sortiert werden. Genau zwei konkrete Spiele bleiben erforderlich. Eine gesonderte `list_games_sorted_impl`-Regression prüft Reihenfolge über Seitengrenzen und ungültige Sortierfelder.

**Beleg-Commits:** [8089b22](https://github.com/wibem1/kibitz/commit/8089b22cf8ec4c5b6ad649033e1ed013782859a4), [df2644d](https://github.com/wibem1/kibitz/commit/df2644d837f9a6032c0e671e4f4b2e044d569871), [0009264](https://github.com/wibem1/kibitz/commit/0009264eccecbd455435f3482cc1f4f2a4f9ffd7), [f855348](https://github.com/wibem1/kibitz/commit/f855348bfd715525ae5925cc8427f0eb3252c084), [bad34d2](https://github.com/wibem1/kibitz/commit/bad34d287529e2a6b4ecc6bab0ad7a0cf99bde4e), [c994acf](https://github.com/wibem1/kibitz/commit/c994acfa87e6e364dc4d07e22801e38825464773).

**Prüfstatus:** Quellcodepfade statisch geprüft, Regressionstest geschrieben, aber **noch nicht ausgeführt/erfolgreich bestätigt**. Für den neuesten Testcommit wurden zum Abfragezeitpunkt keine Workflow-Läufe gemeldet. Kein CI-/Rust-/TypeScript-Build oder echte Mac-/Windows-Laufzeitabnahme behauptet; keine neue Versionsnummer oder Veröffentlichung.

**Nächster Schritt:** CI/gezielten Rust-Test `list_games_global_sort_precedes_pagination` und Frontend-Build erfolgreich durchführen; bei Befunden korrigieren; anschließend reale Prüfung der Seitengrenzen, Datumsfilter und Zwei-Partien-Selektion auf Intel-Mac und Windows. Die frei definierbare strategische **Gruppenanalyse** ist weiterhin nicht implementiert – die Filter begrenzen bisher nur die Partieliste/Auswahl, nicht `build_profile(player)`.

---

# Kibitz DE – 12.11.2026: Auswertungsumfang auswählen – erster funktionaler Schritt

**Neu im Entwicklungsbranch:** In `Partien auswerten` gibt es einen Umfangsschalter mit **»Alle Partien eines Spielers«** (bisheriger `build_profile`-Weg unverändert) und **»Zwei ausgewählte Partien vergleichen«**. Für zwei Partien liest die neue Komponente [app/src/CompareGames.tsx](app/src/CompareGames.tsx) echte Datenbankpartien über `list_games` mit Spielersuche und Seitennavigation, verlangt **genau zwei** manuell ausgewählte Partie-IDs und liest dazu ausschließlich gespeicherte Enginebewertungen über `game_analyses`. Verglichen werden Ergebnis, ECO-Code, Zugzahl, Zahl vorhandener Bewertungen sowie erste/letzte tatsächlich gespeicherte Bewertung pro Partie. Jede Partie lässt sich öffnen. Die gemeinsame Anwendung behält die bestehende Oberfläche und verändert weder Datensatz noch Engine-Backend. [Commits e96d694](https://github.com/wibem1/kibitz/commit/e96d69403d6f096d1b62aa2d076f9a8a81a790a2), [9d258f8](https://github.com/wibem1/kibitz/commit/9d258f8c6d22cff61952996a4c5c05f4414dddea), [eb4efba](https://github.com/wibem1/kibitz/commit/eb4efba21d549bf49bf6a00caa402ac0732abf4a).

**Ehrliche Abgrenzung:** Das ist ein **begrenzter sachlicher Zwei-Partien-Vergleich**, **noch kein** strategischer Vergleich mit KI, kein Vergleich frei definierter Teilmengen (>2), keine selektive Profilaggregation. Die bisherige »Alle Partien«-Auswertung bezieht sich auf den eingegebenen **Spieler**, nicht auf ausnahmslos alle Partien aller Spieler der Datenbank. Das vorhandene `build_profile(player)` akzeptiert noch keine Liste von Partie-IDs, Zeitraum- oder Suchfilter. Für echte frei definierbare Gruppenauswertungen muss die Aggregations-API zuerst um explizite Auswahl-IDs/Filter erweitert werden, mit nachvollziehbarer Anzahl und Stellungen/Belegen.

**Prüfstatus:** Statische Kontrolle der Aufrufwege `listGames`, `gameAnalyses`, `evalsByPly` und `onLoadGameAt`. Kein bestätigter TypeScript-/CI-Lauf und keine praktische macOS-/Windows-Abnahme für diese Commits. **Keine Versions- oder Release-Freigabe**.

**Nächster einzelner Schritt:** Build/CI und echten Zweiervergleich mit Partien mit/ohne gespeicherte Bewertungen prüfen; anschließend Backend-Design für exakte Selektion einer beliebigen Partiemenge einschließlich gefilterter Gruppen, statt UI-Filter ohne Wirkung auf `build_profile` einzubauen.

---

# Kibitz DE – 12.11.2026: Profilanalyse verständlich als »Partien auswerten« bezeichnet

**Implementiert im Entwicklungsbranch:** Die linke Navigation führt den bisherigen Eintrag »Mein Spielprofil« nun als **»Partien auswerten«** ([Commit b5b3c3c4](https://github.com/wibem1/kibitz/commit/b5b3c3c43898b7367c04b4b750d8bf2bb7c99814)). Die Profilansicht selbst trägt denselben Titel und erklärt verständlich, dass gespeicherte Partien eines Spielers vergleichend ausgewertet werden; Einstieg, Schaltfläche, Fortschrittsbezeichnungen und Kurzbeschreibung sind entsprechend deutsch ([Commit 7fa57b37](https://github.com/wibem1/kibitz/commit/7fa57b37d7cc53b0adf62bff6e3e21bd2de977de)). Interne Route `profile`, Profildaten, Berechnungsalgorithmus und Belegverknüpfungen bleiben unverändert. **Keine Behauptung einer freien KI-Vergleichsanalyse**.

**Prüfstatus:** Quellcodeänderungen gesichert, ohne nachgewiesenen TypeScript-Build oder praktische macOS-/Windows-Abnahme; keine Versionsfreigabe. Nächster Prüfschritt: UI-Build/CI für den Branch und die reale Navigation einschließlich bestehender Profilbefunde kontrollieren; außerdem weiterhin offene CI-/Release-Prüfungen der Settingsbereinigung.

---

# Kibitz DE – 12.11.2026: Aufräumen der Einstellungen im Entwicklungsbranch fertig implementiert

**Codeänderungen (noch nicht abgenommen):** `app/src/SettingsView.tsx` zeigt keine doppelten Datenbankaktionen, TWIC-Automatik oder Schachterminverwaltung mehr; die echte Bedienung bleibt in `app/src/DatabaseScreen.tsx` beziehungsweise `app/src/TwicView.tsx`. Ein optionaler Editor »Schachtermin bearbeiten« ist in `app/src/HomeView.tsx` ergänzt, ohne das bisherige Datenmodell zu ändern. Die Einstellungsgruppen sind neu geordnet (Darstellung, Trainer, Engine, Lichess, Daten, Updates, Diagnose). Lichess-Status und TWIC-Automatik sind dort verständlicher deutsch beschriftet. Keine Engine- oder Datenbank-Backend-Änderungen.

**Belege:** Commits [ac1eeb54](https://github.com/wibem1/kibitz/commit/ac1eeb54557424e18ed3cff536bf136279e7db65), [29a60fb4](https://github.com/wibem1/kibitz/commit/29a60fb4e01a45aa07c9317e0aa3a6d1dac4ac0f), [9a70c4a1](https://github.com/wibem1/kibitz/commit/9a70c4a1443a4f1a20989280e4222f6a7f7751d6), [0953ca28](https://github.com/wibem1/kibitz/commit/0953ca28ef527d18bb6e8514755dc0096b02c684), [86cfc47d](https://github.com/wibem1/kibitz/commit/86cfc47d8246ba7c47804ebabc40f1fa3cdb5d2c). Anforderungen und Prüfschritte stehen in [docs/KIBITZ_DE_SCHACHSTUDIO.md](docs/KIBITZ_DE_SCHACHSTUDIO.md).

**Prüfstatus:** Quelltext und Aufruforte auf GitHub kontrolliert. Zum Zeitpunkt der Prüfung waren die automatisch ausgelösten GitHub-Actions-Läufe noch in der Warteschlange beziehungsweise im Gange (CI-Run 43185618846, Intel-Mac-Preview-Run 43185618886). **Kein erfolgreicher Gesamttest und kein echter Mac-/Windows-Bedientest nachgewiesen**, insbesondere nicht für den neuen Home-Termineditor. Keine neue Versionsnummer, kein Release.

**Nächster einzelner Schritt:** GitHub CI (TypeScript/Build) für den aktuellen Branch erfolgreich abnehmen; bei Fehlern gezielt korrigieren. Danach Einstellungsnavigation, Termin- und TWIC-Speicherung sowie unveränderte Engine-/Lichess-/Datenbankfunktionen auf echtem Desktop prüfen und erst dann eine Testversion freigeben. Separater Stockfish-/Maia-Intel-Laufzeitfehler bleibt offen.

---

# Kibitz DE – 12.11.2026: doppelte Datenbank-Stapelaktionen aus Einstellungen entfernt

**Implementiert im bestehenden Entwicklungsbranch:** [Commit ac50cfde](https://github.com/wibem1/kibitz/commit/ac50cfde92658826881c4c6aed22bbae0d7a54f8) entfernt die doppelt vorhandenen Bedienelemente und zugehörige ungenutzte Hooks/Importe aus `app/src/SettingsView.tsx`. Die Aufträge **Datenbank erläutern** und **Partien neu bewerten** verbleiben in `app/src/DatabaseScreen.tsx` mit Kostenschätzung/Zeitprognose, Bestätigung, Arbeitsfortschritt und Pause. [Commit a63c3ce](https://github.com/wibem1/kibitz/commit/a63c3ce296998bbd5f655398aab73c19bf18ea4c) übersetzt dort diese Aktionen, Dialoge und Statusmeldungen. Batch-/Engine-Backend unverändert.

**Prüfstatus:** Quellcode- und Aufrufpfad statisch kontrolliert; **kein bestätigter TypeScript-Build, keine vollständige CI-Abnahme, kein realer Mac-/Windows-GUI-Test**. Keine Versionsnummer, Tag oder Freigabe. Weiter vorhandene Einstellungen wie TWIC-Umschalter und Termin bleiben bewusst erhalten, bis ihre endgültige Einordnung separat geprüft ist.

**Nächster einzelner Schritt:** TypeScript/CI für beide Commits prüfen, dann Benutzeroberfläche auf echter macOS-Installation testen; erst danach die nächste kleine Verschiebung (TWIC-Automatik beziehungsweise Termin) durchführen. Der separate Engine-/Maia-Intel-Test bleibt offen.

---

# Kibitz DE – 12.11.2026: Einstellungsbereinigung – erster kleiner Code-Schritt

**Implementiert auf Branch `feat/de-simple-readable-ui`:** [Commit 332f5d5](https://github.com/wibem1/kibitz/commit/332f5d550810a8a619cafdc4d8c3fd84a5379d73) vereinfacht ausschließlich `app/src/SettingsView.tsx`: die nicht bedienbaren Zeilen **»Engine-Start«**, **»LLM verbaliser«** und **»Figurensatz«** sowie die doppelte Syzygy-Statuszeile und die redundante Anzeige der Kontensynchronisation wurden entfernt. Die eigenständige Engine-/Syzygy-Konfiguration, die Kontosynchronisation in ihrer eigenen Ansicht sowie alle ausführenden Einstellungen bleiben vorhanden. Mehrere sichtbare Buttons, Dialoge, Statuswerte und Brett-/Kommentaroptionen wurden auf Deutsch beschriftet. Batch-Aufrufe, TWIC-Umschalter, Termine, Diagnose, Theme, Erklärstil und Speicherfunktion sind weiterhin mit ihren bisherigen Handlern verbunden.

**Prüfstatus:** GitHub-Diff und sichtbare JSX-Blöcke statisch kontrolliert. Noch **kein** nachgewiesener TypeScript-/Frontend-Testlauf und **keine** echte Mac-/Windows-Laufzeitabnahme; keine Versionsnummer oder Freigabe. Keine Engine-Logik geändert.

**Nächster einzelner Schritt dieser Aufräumserie:** CI-/TypeScript-Prüfung dieses Commits auswerten, anschließend die Datenbank-Stapelaktionen ohne Funktionsverlust aus den Einstellungen in den vorhandenen Datenbank-Aktionsbereich verlagern. Der zuvor offene Intel-Mac-Engine-Praxistest bleibt als separater Blocker bestehen.

---

# Kibitz DE – 12.11.2026: Einstellungsseite als Aufräumziel konkretisiert

**Dokumentierte Anforderung, noch keine UI-Änderung:** Codeprüfung der aktuellen `app/src/SettingsView.tsx` und zugehörigen Komponenten bestätigt die Vermischung echter Einstellungen mit Datenbank-Stapelaktionen, Kontosynchronisation, Statusanzeigen und technischen, teils unveränderbaren Zeilen. Weiterhin zahlreiche englische Schaltflächen und Meldungen. [docs/KIBITZ_DE_SCHACHSTUDIO.md, Abschnitt 9](docs/KIBITZ_DE_SCHACHSTUDIO.md) legt die Vereinfachungsziele und sichere Reihenfolge fest: Kibitz-Layout beibehalten, echte Einstellungen bündeln, ausführende Aufgaben an passende Arbeitsorte verlegen, technische Werte nachordnen, vollständig Deutsch, keine bestehenden Werte oder Funktionen verlieren.

**Prüfstatus:** Dokumentation anhand aktuellen Codes gesichtet; keine Codekorrektur, keine App-Tests, kein Build und keine neue Version. Der unmittelbare technische nächste Schritt bleibt die reale Intel-Mac-Abnahme der Engine-Ausgabe und Maia 2; die Einstellungsbereinigung folgt in kleinen eigenen Prüfaufträgen.

---

# Kibitz DE – 12.11.2026: Windows 11 x64 als zweite verbindliche Desktop-Zielplattform

**Beschlossene Anforderung, noch keine Windows-Auslieferung:** [docs/KIBITZ_DE_SCHACHSTUDIO.md, Abschnitt 8](docs/KIBITZ_DE_SCHACHSTUDIO.md) fordert installierbare Windows-11-x64-Pakete mit derselben Kibitz-Oberfläche und gleichem Funktionsumfang wie auf macOS. Stockfish, Maia 2 und ihre Windows-spezifischen Binärdateien/Runtime-Abhängigkeiten, Tauri-Installer, PGN/Datenbank, UI/DPI, KI-Funktionen und Diagnose sind separat zu prüfen. Windows-CI und echte Windows-11-Laufzeitabnahme vor Freigabe. Intel-Mac bleibt erster aktueller Diagnoserechner; Windows wird nicht als nachrangige unverbindliche Option geführt.

**Prüfstatus:** Nur Markdown-Dokumentation; keine Windows-Binaries gebaut, keine Tests oder Releases ausgelöst. Die bisherige technische nächste Aufgabe (reale Abnahme von Stockfish und Maia 2 auf Intel-macOS) bleibt bestehen; anschließend den Windows-Buildpfad gesondert feststellen und prüfen.

---

# Kibitz DE – 12.11.2026: Oberfläche bleibt Kibitz – Chess Studio liefert zusätzliche Funktionen

**Verbindliche Präzisierung der Produktvision:** Die bestehende **Kibitz-Benutzeroberfläche bleibt erhalten** (Navigation, Grundlayout, Brett und visuelle Identität). Chess Studio ist **Funktionsvorbild**, keine Designvorlage. KI-Chat, KI gegen Stockfish, Schlüsselstellungen, Pfeile, Varianten und Diagnose werden künftig passend in das Kibitz-Interface integriert. Keine Umgestaltung zur Chess-Studio-Oberfläche und keine zwingende neue dreiteilige Hauptnavigation. Aktualisiert in [docs/KIBITZ_DE_SCHACHSTUDIO.md, Abschnitt 7](docs/KIBITZ_DE_SCHACHSTUDIO.md).

**Prüfstatus:** Nur Dokumentation; kein App-Code geändert, keine Tests/Builds oder neue Version ausgelöst. Technisch nächste Aufgabe bleibt die Abnahme von Stockfish-Ausgaben und Maia 2 auf dem echten Intel-Mac.

---

# Kibitz DE – 12.11.2026: Produktvision »Erweitertes Chess Studio für den Desktop« festgehalten

**Verbindliche Konzeptentscheidung, keine neue Implementierung:** [docs/KIBITZ_DE_SCHACHSTUDIO.md, Abschnitt 7](docs/KIBITZ_DE_SCHACHSTUDIO.md) definiert Kibitz DE als Erweiterung der dialogorientierten Chess-Studio-Desktop-App. Der Benutzer erlebt primär die Arbeitsbereiche **Spielen**, **Lernen/Analysieren** und **Partien/Datenbanken**. Vorgesehen: ausdrücklich gestarteter lokaler Modus **KI gegen Stockfish** (auch ab FEN), freier KI-Dialog unter/neben dem Brett, anspringbare Schlüsselstellungen, Pfeile, Varianten, gespeicherte Analysen und eine aufgeräumte Modell-/Diagnoseverwaltung. Vorhandene Kibitz-Funktionen bleiben erhalten; kein blindes Kopieren ohne Quellcodeprüfung. Die ältere GitHub-Projektakte von AI-Chess-Studio (04.11.2026) belegt aktuelle Funktionen nicht; deshalb ist Wiederverwendung nicht zugesagt.

**Prüfstatus:** Ausschließlich Markdown-Dokumentation geändert; keine Builds, Tests, Versionsnummern oder Release. Die bisherige technische nächste Aufgabe bleibt die reale Abnahme von Stockfish und Maia 2 auf Intel-macOS, bevor neue KI-Funktionen integriert werden.

---

# Kibitz DE – 12.11.2026: Kooperatives Analyse-Team als verbindliches Entwicklungsziel dokumentiert

**Konzeptentscheidung, kein implementiertes Feature:** [docs/KIBITZ_DE_SCHACHSTUDIO.md, Abschnitt 6](docs/KIBITZ_DE_SCHACHSTUDIO.md) beschreibt das zukünftige Analyse-Team: Kibitz-Core (strategische Merkmale/Hypothesen), Stockfish (Varianten und gezielte Prüfung), KI (vergleichende, priorisierende Synthese mit Rückfragen) sowie Nutzer (aktiver Dialog). Vorgesehen sind eine begrenzte, kontrollierte Koordinationsschicht im App-Layer, FEN-gebundene Belege, überprüfbare Aussagen mit Unsicherheitskennzeichnung, Budgetlimits und strikter Lichess-Fair-Play-Schutz. Bestehende Offline-Kommentierung ohne API-Schlüssel bleibt erhalten. Dies erweitert die alte LLM-Verbalizer-Idee; die Implementierung steht aus.

**Nächster Schritt unverändert:** Die vorhandene Engine-Ausgabe und das Intel-Mac-Paket 0.1.4 im realen Einsatz abnehmen, bevor die neue Analysekoordination implementiert wird. Diese Dokumentationsänderung erfordert keinen Build oder neuen Versionsstand.

---

# Kibitz DE – 12.11.2026: Intel-ONNX-Runtime in Maia-Build eingebunden (Prüfung ausstehend)

**Änderung:** [Commit a76f6376](https://github.com/wibem1/kibitz/commit/a76f63769f98e1cd75d85ef79ffe9a706e75dbac) passt ausschließlich den Intel-Mac-Preview-Workflow an. Auf dem Intel-Runner wird die Homebrew-ONNX-Runtime installiert. Maia 2 wird mit `ORT_LIB_LOCATION` und `ORT_PREFER_DYNAMIC_LINK=1` dagegen gebaut. Die x86_64-Dylib wird als zusätzliche Tauri-Ressource mit verpackt; der Maia-Executable-Verweis wird auf `@loader_path/libonnxruntime.dylib` gesetzt, und die Verknüpfung wird geprüft. Quelle und Gewichte der Maia-Engine bleiben am bestehenden Commit gepinnt; Schachlogik und übrige Plattformen unverändert.

**Prüfstatus:** Code auf GitHub gesichert, aber **noch nicht erfolgreich ausgeführt**. Das tatsächliche Linkverhalten, eventuelle weitere dylib-Abhängigkeiten, Maia-UCI-Ausgabe und DMG-Paket müssen im neuen Intel-Workflow geprüft werden. Frühere CI [43166820393](https://github.com/wibem1/kibitz/actions/runs/43166820393) war grün, der vorherige Intel-Build [43166820431](https://github.com/wibem1/kibitz/actions/runs/43166820431) scheiterte mangels vorkompilierter ONNX-Runtime. `npm ci` meldete außerdem sieben Abhängigkeits-Schwachstellen (davon zwei kritisch); vor einem formalen Release ist die Relevanz für das ausgelieferte Produkt zu bewerten.

**Nächster Schritt:** Ein gezielter Intel-Mac-Workflow auf Commit a76f6376, bei Fehlern dessen konkrete Ursache prüfen. Bei Erfolg UCI-Smoke-Test und DMG-Inhalt kontrollieren und erst danach 0.1.4 als **unsignierten Testbuild**, nicht als formal freigegebene Version, anbieten; echte Nutzer-Mac-Abnahme bleibt erforderlich.

---

# Kibitz DE – 12.11.2026: Intel-Maia-2-Buildfehler eindeutig diagnostiziert

**Aktuelle Prüfung:** CI [43166820393](https://github.com/wibem1/kibitz/actions/runs/43166820393) ist vollständig grün (Rust und App jeweils auf Ubuntu und macOS). Der Intel-Build [43166820431](https://github.com/wibem1/kibitz/actions/runs/43166820431) ist fehlgeschlagen; es gibt kein DMG-Artefakt für 0.1.4.

**Nachgewiesene Ursache (Job 131010515140):** Beim Kompilieren der eingebetteten Maia-2-UCI-Engine meldet `ort-sys@2.0.0-rc.12`: `ort does not provide prebuilt binaries for the target x86_64-apple-darwin`. Der Fehler tritt vor Maia-UCI-Smoke-Test, Tauri-Build und Installer-Upload auf. Die Modellgewichte wurden zuvor per LFS geladen. Das ist keine bestätigte Maia-Laufzeitstörung, sondern ein ONNX-Runtime-Link-/Verteilungsproblem auf Intel-macOS.

**Sichere Korrekturrichtung:** Eigenes x86_64-kompatibles ONNX Runtime bereitstellen oder Intel-Backend wechseln. Ein möglicher isolierter Diagnosetest ist das dynamische Linken einer Homebrew-ONNX-Runtime mittels `ORT_LIB_LOCATION` und `ORT_PREFER_DYNAMIC_LINK=1`. **Das allein erzeugt noch kein selbstständig lauffähiges DMG:** Die passende dylib muss rechtmäßig eingebunden, im App-Bundle enthalten, über den Laufzeit-Suchpfad auffindbar und am tatsächlich ausgelieferten App-Paket geprüft werden. Nicht den bisherigen `embed-weights`-Anspruch mit „selbstständig lauffähig“ verwechseln.

**Freigabestatus:** 0.1.4 bleibt Versionskandidat; kein neues Testpaket, Tag oder Release erzeugt. Offen: Intel-Runtime-Abhängigkeit lösen, echten `info score cp` plus `bestmove`-Test auf Intel, Architektur-/Bundle-Prüfung, vollständig grünen Installer-Workflow und praktischen Test auf Nutzer-Mac. Kein blindes erneutes Ausführen des unveränderten Jobs.

---

# Kibitz DE – 12.11.2026: Maia-2-Einbindung weiter abgesichert, Intel-Testbuild wartet

**Quellstand:** Maia 2 als wählbarer Offline-Gegner mit eigener Elo, eigenem Benutzerpfad sowie optional automatisch gebündeltem Intel-Mac-UCI-Prozess ist implementiert. Nächste Version **0.1.4**, Stockfish bleibt separat. Der Intel-Workflow lädt gepinnte externe Maia-2-Quellen und beide Modelle per Git LFS, erstellt CPU-Executable mit `embed-weights`, führt einen UCI-Smoke-Test und eine Architektur-/Ressourcenprüfung durch und soll danach ein unsigned DMG hochladen.

**Zusätzliche Sicherheitsprüfung:** [Commit 0fd95ea2](https://github.com/wibem1/kibitz/commit/0fd95ea2e0a2905fae73c6f37ffbeae542bb6040) verlangt bei Maia 2 einen echten `info score` vor Annahme eines `bestmove`, weil `ChessWaveIO/maia2-uci` bei Modellfehlern sonst auf einen legalen Notzug zurückfallen kann. Maia `PVDepth=1` beschränkt unnötige Modellinferenz für einen Spielzug. Der Intel-Smoke-Test wurde in [Commit f43b40e8](https://github.com/wibem1/kibitz/commit/f43b40e8e67eefeba2a6d0804efd5bd5d05151f3) verschärft: er prüft ausdrücklich `loaded embedded:rapid on Cpu`, `score cp` und `bestmove` statt allein einen legalen Zug.

**Zuletzt geprüfte CI für [Run 43166820393](https://github.com/wibem1/kibitz/actions/runs/43166820393):** beide Ubuntu-Jobs erfolgreich; beide macOS-Jobs zum letzten Check noch `queued`. **[Intel-Mac-Paket 43166820431](https://github.com/wibem1/kibitz/actions/runs/43166820431)** zum letzten Check ebenfalls `queued`; noch **kein** bestätigtes DMG-Artefakt für 0.1.4. Ältere Mac-Jobs aus Zwischencommits standen noch in der Warteschlange beziehungsweise liefen. Keine automatische Veröffentlichung und keine pauschale Behauptung einer getesteten Maia-Integration.

**Abnahmegrenze:** UI/Backend sind implementiert und Linux CI bestanden, aber echter Maia-Inferenzlauf auf Intel-Mac, gebündelte Ressource und Runtime auf Nutzer-Mac nicht bestätigt. Der Nutzer darf keinen unvollständigen Build als fertige Maia-Version erhalten.

**Nächster einzelner Schritt:** Aktuellen Intel-Job, UCI-Modelltest und vollständige CI kontrollieren, Fehler im Build isoliert beheben. Erst danach 0.1.4 als Intel-Testpaket mit Download-Artefakt anbieten und gegen den menschlichen Gegner praktisch prüfen.

---

# Kibitz DE – 12.11.2026: Maia-2-Integration für Intel-Mac als 0.1.4 in Prüfung

**Auftrag:** Maia 2 oder 3 direkt in die App integrieren, ohne Stockfish zu ersetzen. Entscheidung für zunächst Maia 2: [ChessWaveIO/maia2-uci](https://github.com/ChessWaveIO/maia2-uci) mit CPU und einem eigenständigen UCI-Interface (MIT), leichter als Maia 3 mit Python/PyTorch für Intel-Mac zu integrieren. Maia 3 ist **nicht** implementiert.

**Bereits im GitHub-Code umgesetzt:**
- `OfflinePlayView.tsx`: auswählbarer Gegner `Maia 2` neben Mensch und Stockfish, eigene Maia-Elo-Stufen (1000–2200), eigener optionaler Engine-Pfad, lokale Persistenz von Auswahl/Elo/Pfad, separates Spielergebnis/Fehlertext, normales PGN/Zurücknehmen.
- `offlineSession.ts`: vorhandene lokale Partiestände bleiben lesbar, neues Gegnerkennzeichen `maia2` bleibt nach Neustart erhalten. Zusätzlicher Sicherungstest in `offlineSession.test.ts`.
- `offlineEngine.ts` und `src-tauri/src/lib.rs`: eigene UCI-Konfiguration `Model=rapid`, `SelfElo`/`OppElo` (derzeit gleich), begrenzter Zug-Aufruf in dediziertem Prozess, 60-Sekunden-Deadline, separate Engine-Auflösung ohne Stockfish-Fallback. Bei leerem Maia-Pfad sucht Intel-Mac `Kibitz.app/Contents/Resources/maia2-uci`.
- `.github/workflows/intel-mac-preview.yml`: Intel-Mac-Build klont gepinnten externen `ChessWaveIO/maia2-uci` Commit `05d51ac73ca3ad006882f8956c848fe2411ce718`, lädt beide ~93 MB ONNX-Dateien per Git LFS, kompiliert `--features embed-weights` für native Intel-CPU, prüft UCI mit einer Startstellungs-Zuganfrage und fügt Executable + MIT-License als Tauri-Bundle-Ressourcen hinzu. Packaging-/Architekturprüfung stellt vorhandene x86_64-Maia-Binary sicher.
- `docs/LICENSES.md`: Maia-MIT-Lizenz und Herkunft dokumentiert. Kein Maia-Code in BSD-Crates.
- Eindeutiger Versionskandidat `0.1.4` in npm-/Tauri-/Cargo-Manifests und Lock-Dateien (vorher bereitgestellte Testversion `0.1.3`).

**Verifikation:** Die aktuelle CI [43166422415](https://github.com/wibem1/kibitz/actions/runs/43166422415) und der native Intel-Mac-Build [43166422235](https://github.com/wibem1/kibitz/actions/runs/43166422235) waren bei letzter Prüfung **noch nicht abgeschlossen**. Weder der Maia-Prozess noch sein Build sind bisher auf echtem Nutzer-Mac bestätigt. Kein Release und kein Download vor erfolgreich verifiziertem DMG.

**Nächster einzelner Schritt:** Alle CI-Jobs und insbesondere Maia-Quellbuild/Smoke-Test/DMG-Artefakt prüfen, Fehler isoliert beheben. Bei grünem Build 0.1.4 als unsigned Intel-Testpaket bereitstellen; dann Nutzer-Praxistest mit menschlich wirkenden Maia-Zügen auf Intel-Mac. Maia 3 und Erweiterungen für Maia-Stellungsanalyse bleiben offen.

---

# Kibitz DE – 12.11.2026: Version 0.1.3 als Intel-Mac-Testpaket erfolgreich bereitgestellt

**GitHub-CI vollständig grün:** [Run 43160194595](https://github.com/wibem1/kibitz/actions/runs/43160194595), alle vier App-/Rust-Jobs auf macOS/Ubuntu erfolgreich. Der erste Lauf nach Codeänderung scheiterte ausschließlich an der Rustfmt-Importreihenfolge; dies wurde in [Commit c8d39ed8](https://github.com/wibem1/kibitz/commit/c8d39ed8cf3e57ad957c32e53dc938e3768f516d) korrigiert und durch den grünen zweiten CI-Lauf bestätigt.

**Intel-Testbuild erfolgreich:** [Run 43160194622](https://github.com/wibem1/kibitz/actions/runs/43160194622), alle Schritte erfolgreich. [ZIP-Artefakt 13918180394](https://github.com/wibem1/kibitz/actions/runs/43160194622/artifacts/13918180394) (11.702.875 Byte, nicht abgelaufen bei Prüfung) enthält `Kibitz_0.1.3_x64.dmg`. Das Protokoll bestätigt `Mach-O 64-bit executable x86_64`, einen DMG und erfolgreiches Upload. SHA256 der ZIP-Datei laut GitHub-Upload-Log: `9c9ec7ac16d465bddeee92e89d903fea90f55f3435492abe73127b80b3bcc383`. Unsignierter Test-Installer, **kein formales GitHub-Release**.

**Änderung:** Automatische WSUI-Kandidatenprüfung nutzt in `verify.rs` einen eigenen kurzlebigen Stockfish-Prozess und blockiert nicht länger den gemeinsamen Live-Analyse-Prozess. Bereits vorhandene begrenzte Einzelbewertung und Fehlerhinweise bleiben. Version `0.1.3` in fünf Manifest-/Lock-Dateien konsistent gesetzt.

**Qualifikationsgrenze:** CI und Intel-Build beweisen **nicht**, dass die gewünschte Live-Bewertung auf dem Nutzer-Mac bereits korrekt funktioniert. Der zuvor per Screenshot dokumentierte Ausfall erfordert die reale Prüfung mit diesem neuen DMG. Keine Aussage „Problem behoben“ bis zu bestätigter Score-/PV-Anzeige. Maia 2 weiterhin nicht integriert.

**Nächster einzelner Schritt:** `0.1.3` auf Intel-Mac installieren und zuerst `Live-Analyse` bei taktischer Stellung, danach bei ausgeschalteter Live-Analyse `Stellung bewerten` prüfen; Anzeige bzw. Fehlermeldung dokumentieren. Sollte die Ausgabe fehlen, `engine-info`-Empfang und FEN-Zuordnung isoliert untersuchen. Jede spätere Test-App erhält eine neue Versionsnummer.

---

# Kibitz DE – 12.11.2026: Engine-Konkurrenz zwischen taktischer Prüfung und Live-Analyse beseitigt (noch nicht abgenommen)

**Ursache im Code verifiziert:** `verify_suggestions` lief nach einem WSUI-Taktiktreffer im Hintergrund automatisch und hielt die gemeinsame `EngineState.engine`-Mutex für bis zu vier UCI-Suchen (je 150.000 Knoten). Die manuelle `analyze_position`-Live-Analyse benötigt dieselbe Mutex und konnte deshalb in der Warteschlange ohne Score-Ereignis hängen. Das ist eine nachgewiesene **Blockademöglichkeit**, noch keine vollständige Erklärung sämtlicher Nutzerbeobachtungen.

**Gezielte Änderung:** [Commit 755089ad](https://github.com/wibem1/kibitz/commit/755089adf938850f530b23d5f885b63cde5310c7) verlegt ausschließlich die automatische taktische Kandidatenprüfung auf einen **eigenen kurzlebigen UCI-Prozess**, statt den interaktiven, gemeinsam verwalteten Engine-Prozess zu belegen. Die statischen WSUI-Einschaltbedingungen, Kandidatenbewertungen, Node-Grenzen und Stockfish-Live-Analyse bleiben unverändert. Eigenständiger Prozess wird nach der Prüfung beendet. Es wird nur im GPL-App-Layer geändert.

**Version:** Die nächste Test-App heißt `0.1.3`; `package.json`, `package-lock.json`, `tauri.conf.json`, `Cargo.toml` und der Eintrag für `kibitz-app` in `Cargo.lock` wurden in vorausgegangenen Commits auf `0.1.3` gebracht. **Jeder neue Installer bekommt ab jetzt eine neue Versionsnummer.**

**Prüfstatus:** Code ist auf Branch `feat/de-simple-readable-ui` gesichert, aber eine vollständig grüne CI, Intel-x86_64-DMG und reale Mac-Laufzeitabnahme für diese Änderung sind **noch offen**. Keine offizielle Release-Freigabe.

**Nächster einzelner Schritt:** CI und einmaligen Intel-Build auf dem aktuellen Code-Commit prüfen; bei Erfolg Test-DMG 0.1.3 zur praktischen Prüfung des Live-Scores und der einmaligen Bewertung anbieten. Sollte weiterhin kein Score kommen, Rohereignis/FEN-Zuordnung gezielt instrumentieren, nicht erneut blind den Button ändern.

---

# Kibitz DE – 11.11.2026: Eindeutige Versionierung jeder neuen Test-App

**Verbindlicher Nutzerwunsch:** Jede künftig erstellte und zum Download angebotene Kibitz-DE-Version erhält eine **neue, sichtbare Versionsnummer**. Keine verschiedenen Builds mehr mit derselben App-Version.

**Nächster Versionskandidat:** `0.1.3` (nach `0.1.2`), konsistent eingetragen in `app/package.json`, `app/package-lock.json`, `app/src-tauri/tauri.conf.json`, `app/src-tauri/Cargo.toml`, `app/src-tauri/Cargo.lock`. Das ist zunächst **nur ein Versionskandidat im Quellstand**, kein erfolgreich getesteter Installer und kein Release. Bei weiteren separat veröffentlichten Testpaketen die Version vor dem Build erneut anheben.

**Weiter offener Fehler auf echtem Intel-Mac:** Screenshot zeigt nach 12 Sekunden Live-Analyse weiterhin `Engine rechnet …` und keinerlei Bewertung. Der Warnhinweis belegt nur das Fehlen empfangener Scores; die genaue Ursache ist nicht diagnostiziert. Der Screenshot zeigt zugleich die laufende Engine sowie ein deaktiviertes `Stellung bewerten`, solange Live-Analyse aktiv ist (beabsichtigt, um parallele Jobs zu vermeiden). **Keine Behauptung einer behobenen Engine-Ausgabe.** Zuerst event-/backend-seitig klären, dann erst 0.1.3 zur Abnahme freigeben.

---

# Kibitz DE – 11.11.2026: TypeScript-Fehler der Stockfish-Diagnose behoben, Prüfung offen

**CI-Auswertung:** [Run 43109558337](https://github.com/wibem1/kibitz/actions/runs/43109558337): Beide Rust-Jobs erfolgreich, beide App-Jobs fehlgeschlagen wegen `src/GameView.tsx(208,106): error TS1005: ')' expected`. Die 631 Vitest-Tests auf den App-Runnern waren zuvor erfolgreich. [Intel-Build 43109558193](https://github.com/wibem1/kibitz/actions/runs/43109558193) scheiterte beim vorgeschalteten `tsc --noEmit` mit derselben Meldung; **kein DMG veröffentlicht**.

**Gezielte Korrektur:** [Commit b5d10b2e](https://github.com/wibem1/kibitz/commit/b5d10b2e1dd6fd4fce3b6154d09b7088a7dd78a5) ergänzt die fehlende schließende Klammer bei `stopAnalysis().catch(...)` in `GameView.tsx`. Die Funktionalität wurde ansonsten in diesem Commit nicht verändert. **Neue CI und neuer Intel-Build müssen erst erfolgreich geprüft werden; keine Freigabe oder Behauptung eines erfolgreichen Praxistests.**

**Nächster einzelner Schritt:** CI auf korrigierten Code prüfen. Erst nach grüner CI und erfolgreichem Build die diagnostische Intel-DMG zum Nutzertest bereitstellen, um die Ursache des fehlenden `engine-info`-Streams besser eingrenzen zu können.

---

# Kibitz DE – 11.11.2026: Intel-Praxistest – Stockfish liefert keine sichtbare Bewertung

**Nutzerbefund auf realem Intel-Mac nach Test-DMG 13890264118:** Sowohl `Stellung bewerten` als auch die eigenständige `Live-Analyse` zeigen trotz gestarteter Berechnung **kein Ergebnis**. Beide Wege nutzen dieselbe `analyze_position`-/`engine-info`-Infrastruktur. Der letzte Testbuild ist daher **nicht funktionsabgenommen** für diese Funktionen. Der genaue Ausfallpunkt der Engine-Ereignisübertragung ist noch **nicht nachgewiesen**.

**Gezielte Korrektur/Diagnose, noch ungetestet:**
- `GameView.tsx` Commit `da8204eb`: Die bisherige Aktion `Stellung bewerten` für PGN-Partien ohne Datenbank nutzt jetzt eine **begrenzte** Suche (`go nodes 250000`) mit sichtbarer Bewertung, Tiefe, Abschlussstatus oder Fehlermeldung. Im Gegensatz zur bisherigen unendlichen Live-Suche liefert sie einen Endpunkt. Ereignis-Listener für `engine-info` und `engine-done` werden vor der Aktion abonniert.
- `GameView.tsx` Commits `c86f2c24`, `58e59331`: Live-Analyse zeigt Engine-Startfehler und `engine-done`-Fehler explizit an statt sie zu verschlucken, meldet ein unerwartetes Ende und warnt bei 12 Sekunden ohne Score-Ereignis. Ergebnisloses Rechnen gilt nicht als Erfolg. Alte Live-Analyse ist weiterhin optional.
- Diagnose ist nicht mit einer bewiesenen Reparatur des gemeinsamen Backend-Problems gleichzusetzen; statische Prüfung/CI des aktuellen Code-Commits `58e593317a4e13dd2e88dfd7d4d6da6c8ddb7496` steht aus. Kein neuer Installer freigegeben.

**Nächster einzelner Schritt:** Neue CI-Prüfung auswerten und eventuelle Compile-/Testfehler korrigieren. Erst danach Intel-Test-DMG erstellen und mit einem Positions-Bewertungstest klären, ob `engine-info` ankommt bzw. welche Fehler angezeigt werden. Kein Release bis zur realen Abnahme.

---

# Kibitz DE – 11.11.2026: Intel-Test-DMG mit Analysekorrekturen erfolgreich gebaut

**Verifizierter GitHub-Actions-Stand:** [CI 43099437895](https://github.com/wibem1/kibitz/actions/runs/43099437895) vollständig erfolgreich, alle vier macOS-/Ubuntu-/App-/Rust-Jobs. [Intel-Mac-Workflow 43099437865](https://github.com/wibem1/kibitz/actions/runs/43099437865) vollständig erfolgreich; Build, x86_64-Architekturprüfung und Artefakt-Upload jeweils grün.

**Download:** [ZIP-Artefakt `kibitz-de-intel-mac-unsigned-test` ID 13890264118](https://github.com/wibem1/kibitz/actions/runs/43099437865/artifacts/13890264118), 11.703.790 Byte, `Kibitz_0.1.2_x64.dmg` enthalten. Das GitHub-Buildlog nennt `Mach-O 64-bit executable x86_64`, `Intel x86_64 app and one DMG found`. SHA256 des hochgeladenen ZIP laut GitHub-Log: `9dfaf63c893143c1517f7a05bc0c3242a7cd521bb94996e6dfb0813246a4c187`. Workflow verwendet erstmals `macos-15-intel`. **Unsignierter, temporärer Testbuild, keine Release-Freigabe.**

**Enthaltene Korrekturen:** Ruhige Stellungen werden auch ohne Taktiktreffer erklärt, sobald die statische Erklärung vorliegt; `Partie erläutern` für direkt geladene PGN-Partien verarbeitet die Hauptvariante statisch auch ohne Datenbankeintrag; `Stellung bewerten` startet bei direkt geladenen Partien ausdrücklich die bestehende Stockfish-Live-Analyse der angezeigten Stellung. **Keine vollständige Stockfish-Neubewertung aller Züge ohne Datenbank-ID.** Maia 2 ist nicht eingebaut.

**Nächster einzelner Schritt – Nutzer-Praxistest auf Intel-Mac:** Vorherige Partie bei Bedarf als PGN sichern, neue ZIP/DMG installieren, Offline-Partie öffnen, zu ruhiger Stellung navigieren und Text prüfen; dann `Partie erläutern` und die Fortschrittsanzeige sowie `Stellung bewerten` auf Engineausgabe prüfen. Besonderheit: Beide Testversionen tragen weiterhin die interne Versionsnummer 0.1.2. Reale Laufzeitabnahme ist noch ausstehend.

---

# Kibitz DE – 11.11.2026: Intel-Build läuft, Artefakt-Upload gescheitert; Runner gezielt geändert

**Neue Beobachtung:** Die lange wartende [Intel-DMG-Action 43092026401](https://github.com/wibem1/kibitz/actions/runs/43092026401) wurde schließlich gestartet. **Build von `Kibitz.app` und DMG sowie der Prüfschritt auf x86_64 und genau eine DMG waren laut GitHub-Jobschritten erfolgreich.** Der Job scheiterte erst bei **„Upload unsigned test DMG (NOT a release)“**; es ist daher **kein herunterladbares Artefakt** vorhanden. Der Abruf des vollständigen Joblogs liefert derzeit GitHub-BlobNotFound (404), sodass der genaue Uploadfehler *nicht belegt* ist. Es ist nach dieser Beobachtung falsch, pauschal von einem nicht bauenden Programm zu sprechen.

**Gezielte Workflow-Änderung:** [Commit 834e5d3e](https://github.com/wibem1/kibitz/commit/834e5d3e0cf8bf0d520b4036e6c4e70218f818f6) ersetzt nur im Intel-DMG-Workflow den GitHub-Runner `macos-latest` (aktuell ARM64) durch `macos-15-intel` (offizieller Intel-Standardrunner); der Tauri-Befehl und die Architekturprüfung bleiben gleich. Grund: GitHub-Community-Meldungen über Schwierigkeiten mit der Runner-Zuteilung bei macOS ARM64 und die offiziell dokumentierte native Intel-Alternative. **Ein tatsächlicher kausaler Nachweis für die frühere Warteschlange ist das noch nicht.** Neuer [Intel-Testworkflow 43099437865](https://github.com/wibem1/kibitz/actions/runs/43099437865) wurde ausgelöst; bei letzter Abfrage noch `queued`. Neue [CI 43099437895](https://github.com/wibem1/kibitz/actions/runs/43099437895) ebenfalls `queued`. Kein Release, keine angepriesene DMG.

**Nächster einzelner Schritt:** Neuen Intel-Lauf und insbesondere Upload-Artefakt-ID kontrollieren; bei erneutem Uploadfehler dessen tatsächliche Fehlermeldung beschaffen, bevor weitere Retry- oder Workflow-Änderungen erfolgen. Erst danach praktische Intel-Mac-Abnahme der Analysefunktionen.

---

# Kibitz DE – 11.11.2026: Maia-2-UCI-Kompatibilität recherchiert; Intel-Builder noch blockiert

**Intel-Testbuild:** [Run 43092026401](https://github.com/wibem1/kibitz/actions/runs/43092026401) wurde erneut abgefragt: x86_64-DMG-Job bleibt `queued`, ohne Artefakt. [CI 43092026266](https://github.com/wibem1/kibitz/actions/runs/43092026266) ist vollständig erfolgreich. **Keine neue DMG und kein weiterer identischer Build gestartet.** Die Ursache des GitHub-Runners ist derzeit nicht verifiziert.

**Separat geprüfte Maia-2-Option:** Unabhängiges [ChessWaveIO/maia2-uci](https://github.com/ChessWaveIO/maia2-uci) stellt einen UCI-Prozess in Rust bereit, MIT-Lizenz und ONNX Runtime; Modellgewichte laut Projekt-README ebenfalls MIT (Original: [CSSLab/maia2](https://github.com/CSSLab/maia2)). Relevante UCI-Optionen: `Model=rapid|blitz`, `SelfElo`, `OppElo`, außerdem `UCI_Elo` als Alias zu `SelfElo`. Die Engine liefert `bestmove`, ohne traditionelle Tiefensuche; CPU-Inferenz wird unterstützt. Modellgewicht/Binary-Verpackung über `embed-weights` wird dokumentiert. **Das ist eine technische Eignungsprüfung anhand der öffentlichen Projektdokumentation; kein Intel-x86_64-Build, keine Signatur-/Laufzeitprüfung, keine Kibitz-Integration.**

**Architekturhinweis:** Für Maia darf die bestehende `Stockfish`-Option `UCI_LimitStrength` nicht einfach weiterverwendet werden. Die künftige Auswahl benötigt engine-spezifische UCI-Optionen, expliziten Engine-Pfad bzw. geprüfte eigene Binary, passende Modellkonfiguration und differenzierte Fehlermeldungen. Maia-Spielstärke stellt human-like Vorhersage dar, keine garantierte Elo-Leistungsgrenze. Lizenzhinweise gehören in `docs/LICENSES.md`; das BSD-Crate-Grenzprinzip bleibt unverändert. Maia-3 wird vom Originalprojekt für Neuprojekte empfohlen, ersetzt aber nicht ohne Auftrag den Maia-2-Wunsch.

**Nächster einziger Auslieferungsschritt:** Überfällige macOS-x86_64-Job-Warteschlange auf GitHub Actions klären und den vorhandenen, vollständig CI-geprüften Analyse-Fix real als DMG testen; nicht gleichzeitig ein weiteres ungeprüftes Engine-Feature in den Testbuild mischen.

---

# Kibitz DE – 11.11.2026: Korrigierte Analyse – CI grün, Intel-Build noch ausstehend

**Nachgeprüfte CI:** [Run 43092026266](https://github.com/wibem1/kibitz/actions/runs/43092026266): vier von vier Jobs erfolgreich (App/Rust, macOS/Ubuntu). Enthält Code-Commit `7cc159ef130819e91e1626af5f4bc4db8aff4f3b` mit der Korrektur der PGN-Analysefunktionen und stabilisiertem SyncsView-Test.

**Intel-Mac-Test-DMG:** [Run 43092026401](https://github.com/wibem1/kibitz/actions/runs/43092026401) bei aktueller Abfrage **queued**; noch kein bestätigtes Artefakt. Frühere DMGs sind für die neue Analyse-Korrektur nicht ausreichend.

**Nächster einzelner Schritt:** Abschluss von Run 43092026401 und korrekte Intel-x86_64-Architektur/Artefakt prüfen, dann konkreten Testdownload nennen. Danach reale Abnahme: ruhige Stellung erläutern, direkte Offline-Partie „Partie erläutern“ und „Stellung bewerten“ prüfen. Maia 2 ist noch nicht integriert.

---

# Kibitz DE – 11.11.2026: Auswertung des neuen Analyse-CI-Laufs

**Aktueller Code-Commit:** `7cc159ef130819e91e1626af5f4bc4db8aff4f3b`, Branch `feat/de-simple-readable-ui`. Die Änderungen für direkt geladene PGN-Partien befinden sich in `App.tsx`, `GameView.tsx` und `ExplainPanel.tsx`; kein Release.

**CI-Fakten für [Run 43089793369](https://github.com/wibem1/kibitz/actions/runs/43089793369):** Rust Ubuntu erfolgreich. App Ubuntu **fehlgeschlagen**, weil in einem bereits vorhandenen, nicht zur Analysefunktion gehörenden SyncsView-Test das asynchron geladene Lichess-Namensfeld innerhalb des bisherigen 1-Sekunden-Timeouts nicht gefüllt war: `expected '' to be 'SomeUser'`. Die übrigen 630 Frontend-Tests bestanden. Die macOS-Jobs waren bei der letzten Abfrage noch `queued`, ebenso das Intel-DMG aus [Run 43089793372](https://github.com/wibem1/kibitz/actions/runs/43089793372). Es ist **kein bewiesener Fehler der Analysefunktion**, aber die CI ist nicht grün.

**Isolierte Teststabilisierung:** Im betreffenden Test wurde nur die `waitFor`-Frist von 1 auf 3 Sekunden erhöht; derselbe erwartete Benutzername bleibt Pflicht. Commit `7cc159ef`. Für den neuen Stand wurde ein [Intel-Testbuild 43092026401](https://github.com/wibem1/kibitz/actions/runs/43092026401) automatisch in die Warteschlange aufgenommen; keine Freigabe, solange CI und Artefakt nicht bestätigt sind.

**Nächster einzelner Schritt:** Die GitHub-Actions-Checks für `7cc159ef` prüfen und erst bei vollständig erfolgreichen Prüfungen das neue x86_64-Testpaket bereitstellen. Vorherigen Testbuild `13855000712` nicht als Fix für die Analyselücken ausgeben. Ein realer macOS-Test der neuen Analyse bleibt anschließend erforderlich.

---

# Kibitz DE – 11.11.2026: Erklärung und Analysebefehle bei PGN-Partien korrigiert

**Nutzerfehlerbild:** Bei einer aus dem Offline-Spiel übernommenen bzw. per PGN geladenen Partie erschien wiederholt „Zu dieser Stellung gibt es noch keine Erklärung. Die Engine bleibt aus …“; die oberen Aktionen „Partie erläutern“ und „Neu bewerten“ waren deaktiviert. **Ursache im Quellcode verifiziert:** Die App ließ ruhige Stellungen trotz vorhandener berechneter Erklärung absichtlich unsichtbar, und die GameView-Aktionen waren bei `gameId === null` deaktiviert. Das ist keine Aussage über die tatsächliche technische Erreichbarkeit der Engine.

**Änderungen (noch nicht CI-geprüft oder real auf Intel-Mac getestet):**
- `App.tsx`: auch ruhige Stellungen zeigen die bereits automatisch berechnete Erklärung. Für direkt geladene PGN-Partien verarbeitet `explainWholePgn` nach ausdrücklichem Klick die Hauptvariante Stellung für Stellung (maximal 300 Stellungen pro Durchlauf) mittels der vorhandenen statischen Kibitz-`explain_position`-Funktion, mit Fortschrittsanzeige und Fehlermeldung. Keine automatische Stockfish-Suche als Nebeneffekt.
- `GameView.tsx`: „Partie erläutern“ funktioniert nun auch ohne Datenbank-ID. Für direkt geladene Partien heißt die bisher datenbankgebundene Aktion „Neu bewerten“ nun **„Stellung bewerten“** und schaltet die bereits vorhandene Live-Analyse der aktuellen Stellung ausdrücklich ein beziehungsweise aus. Dies ist **keine vollständige Engine-Neubewertung aller Partiestellungen**; für DB-Partien bleibt die bisherige Batch-Bewertung unverändert.
- `ExplainPanel.tsx`: bisher irreführende Meldung ersetzt durch Lade- und Live-Analyse-Hinweis.

**Letzter Code-Commit:** `e6df2b57bfa81b3e2760e9f7688f6488266b90b4`. **Tests für diese neue Änderung noch offen**. Alter Testbuild `13855000712` enthält diese Korrekturen nicht. Kein Release.

**Nächster einzelner Schritt:** CI auf den neuen Code auswerten, gegebenenfalls Fehler korrigieren. Danach aktualisierte Intel-Test-DMG bauen und die Erklärung für ruhige Stellungen sowie beide Aktionen an einer direkt übernommenen Offline-Partie prüfen. **Maia weiterhin separat offen.**

---

# Kibitz DE – 11.11.2026: Spielstärke und direkte Analyseübergabe CI-grün, Intel-Test-DMG gebaut

**Quellstand:** Commit `f795735abead1b5aef79b9903eac3a5febf61567` (letzte Codekorrektur), Branch `feat/de-simple-readable-ui`.

**Technische Prüfung bestätigt:** [CI 43019061343](https://github.com/wibem1/kibitz/actions/runs/43019061343) und [CI 43019191089](https://github.com/wibem1/kibitz/actions/runs/43019191089) jeweils alle vier Jobs erfolgreich (Ubuntu/macOS, App/Rust). Im macOS-App-Log des zweiten Laufs: 631 Vitest-Tests/65 Dateien, TypeScript/Vite-Build, Cargo fmt/clippy/test sowie 107 Rust-Unit-Tests und 2 UCI-Integrationstests erfolgreich. Diese Tests beweisen nicht, dass die Elo-Einschränkung auf dem realen Stockfish-Programm wirkt.

**Aktuelles Intel-Mac-Testpaket:** [Build 43019191176](https://github.com/wibem1/kibitz/actions/runs/43019191176) erfolgreich; [ZIP-Artefakt 13855000712](https://github.com/wibem1/kibitz/actions/runs/43019191176/artifacts/13855000712) mit `Kibitz_0.1.2_x64.dmg`, Größe 11.696.259 Byte, x86_64-Architektur im Log kontrolliert. SHA256 des ZIP-Artefakts laut GitHub-Upload-Log: `267ec1be1ac7361d3035755182d65d7a9d050a3ca7665af7c2b649f42ad6ddda`. **Unsignierter, nicht veröffentlichter Testbuild.** Artefakt-Aufbewahrung 7 Tage.

**Für den Intel-Mac real zu prüfen:** In der Offline-Ansicht Stockfish-Spielstärke 1500 Elo einstellen, einen Engine-Zug spielen lassen, auf „Volle Stärke“ umstellen, danach „Partie zur Analyse öffnen“ anklicken; Zugliste und Stellung müssen identisch bleiben. In der Analyseansicht sind Live-Analyse/Einzelerklärung vorhanden, automatische komplette Partieerläuterung ohne DB-ID noch nicht. Test anschließend mit einer schon laufenden Partie wiederholen, ohne Verlust des lokalen Autosaves. Maia 2 weiterhin **nicht integriert**.

**Nächster einzelner Schritt:** Realen Intel-Mac-Praxistest der neuen Elo-Auswahl und der PGN-Übergabe anhand dieses Pakets auswerten; bei Fehlern Diagnose erfassen. Danach Maia-Kompatibilität und Integration separat bearbeiten. Keine Release-Freigabe aus CI allein.

---

# Kibitz DE – 11.11.2026: CI-Formatierungsfehler der Elo-Funktion korrigiert

**Konkret geprüft:** GitHub-Actions-CI [Run 43017929339](https://github.com/wibem1/kibitz/actions/runs/43017929339) für die neue Spielstärke/Analyseübergabe: 631 Vitest-Tests in 65 Dateien erfolgreich; TypeScript- und Vite-Build erfolgreich. App-Job scheiterte danach an genau zwei Rustfmt-Zeilen für `set_stockfish_elo` in `app/src-tauri/src/uci.rs`. Das ist ein Formatierungsfehler, kein nachgewiesener UCI-Laufzeitfehler.

**Korrektur gesichert:** Commit `f795735abead1b5aef79b9903eac3a5febf61567` übernimmt die vom CI angezeigte Rustfmt-Formatierung. Für diesen Stand wurden [CI 43019061343](https://github.com/wibem1/kibitz/actions/runs/43019061343) und [Intel-DMG-Workflow 43019061307](https://github.com/wibem1/kibitz/actions/runs/43019061307) automatisch gestartet. Bei Abfrage beide **in Bearbeitung**; keine Ergebnisse vorwegnehmen.

**Nächster einzelner Schritt:** Ergebnis beider Läufe und DMG-Artefakt prüfen. Danach neue Elo-Auswahl (einschließlich Volle Stärke) und „Partie zur Analyse öffnen“ auf dem Intel-Mac praktisch testen. Maia ist noch nicht integriert. Keine Veröffentlichung ohne diese Überprüfung.

---

# Kibitz DE – 11.11.2026: Spielstärke und Übergabe zur Analyse implementiert

**Nutzerfeedback vom realen Intel-Mac:** Stockfish antwortet nun tatsächlich im Offline-Spiel. Offen waren eine einstellbare Spielstärke, die Übergabe der laufenden Partie zur Analyse und Maia (1/2).

**Neu implementiert auf `feat/de-simple-readable-ui`, noch nicht durch CI oder Mac-Laufzeit bestätigt:**
- `OfflinePlayView.tsx`: Stockfish-Spielstärke in Stufen 1320–3000 Elo plus volle Stärke; lokal gespeicherte Auswahl. Pro Anforderung wird das gewählte Elo-Limit übergeben.
- `offlineEngine.ts`, `src-tauri/src/lib.rs`, `src-tauri/src/uci.rs`: optionaler Elo-Parameter; `UCI_LimitStrength=true`, `UCI_Elo=<n>`, anschließend `isready`/ `readyok`; begrenzte gültige Werte 1320–3190. **Elo-Werte sind Stockfish-Näherungen, kein exaktes Rating**. Analyse-Engine und bisheriger Standard bleiben unverändert.
- `OfflinePlayView.tsx` → `App.tsx`: Schaltfläche **„Partie zur Analyse öffnen“** übergibt den aktuellen PGN direkt an die vorhandene Partienansicht; nicht erst Datei speichern/importieren. Es wird **keine Datenbank-ID** angelegt: Live-Stellungsanalyse und Stellungserklärung stehen zur Verfügung, aber datenbankgebundene Funktionen „Partie erläutern“/„Neu bewerten“ bleiben für diese direkt geladene Partie deaktiviert. Dies ist eine noch offene Funktionserweiterung.
- Regressionsprüfung im Code: PGN-Roundtrip über `loadGame` sowie simulierter UCI-Elo-Handshake und Grenze der Elo-Eingabe. **Noch kein Testergebnis für neue Commits**.
- Zuletzt geschriebener Code-Commit: `914a5021`.

**Maia:** Bisher weiterhin **nicht eingebaut**. Der reine Maia-2-Modellcode ist keine auf Intel-Mac sofort verwendbare Engine. Externe Maia-2-UCI-Implementierung `ChessWaveIO/maia2-uci` hat Optionen `SelfElo`/`OppElo`, Modelle und ONNX-Runtime. Ziel für separaten Schritt: Intel-x86_64-Kompatibilität, Modell-Dateien/Lizenzen, UCI-Optionen und Engine-Auswahl abklären; Stockfish nicht mit Maia-spezifischen Optionen ansteuern. Die offiziellen Maia-2-Autoren verweisen inzwischen auf Maia-3 für Neuprojekte.

**Nächster einzelner Schritt:** CI für Code-Commit `914a5021` auswerten, nötige TypeScript-/Rust-Korrekturen vornehmen. Erst danach neues Intel-Test-DMG erstellen und tatsächliche Elo-Einschränkung sowie Analyseübergabe in der App testen. Kein Release ohne Laufzeitabnahme.

---

# Kibitz DE – 11.11.2026: Offline-Spiel-Korrektur technisch abgeschlossen, Intel-Test-DMG verfügbar

**Zuletzt technisch vollständig geprüfter Code-Commit:** `dea2e4b5f83aec95de1a15526292a221c551836a`, Branch `feat/de-simple-readable-ui`.

**CI:** [Run 42982579536](https://github.com/wibem1/kibitz/actions/runs/42982579536) `completed/success`, alle vier Jobs (`rust` und `app`, jeweils Ubuntu und macOS) erfolgreich. Nach der ersten roten CI durch reine Rustfmt-Abweichungen in `uci.rs` wurden diese in `dea2e4b5` korrigiert.

**Intel-Mac-Build:** [Run 42982579540](https://github.com/wibem1/kibitz/actions/runs/42982579540) `completed/success`, [ZIP-Artefakt `kibitz-de-intel-mac-unsigned-test` ID 13838540570](https://github.com/wibem1/kibitz/actions/runs/42982579540/artifacts/13838540570), 11.691.404 Byte; darin `Kibitz_0.1.2_x64.dmg`. Buildlog: `Mach-O 64-bit executable x86_64`, `lipo -archs` bestätigt Intel, genau eine DMG. Unsignierter **Testbuild**, kein Release. ZIP-SHA256 laut GitHub-Log `e450567e6a3839792c736a21f02a6678ba8359090e3550b692234c39ef1ed610`.

**Im Testbuild enthalten:** Offline-Brettgröße fensterabhängig statt starr 520px; bei 1536×934 nominell 720px, Responsive-/Ausrichtungs-CSS; bei View-Wechsel Rücksetzen des Scrollstands vor dem Zeichnen; Engine-Pfad-Fallback für Homebrew/MacPorts-Stockfish auch bei Finder-App mit eingeschränktem PATH; direkter Link aus Fehlerzustand zu Engine-Einstellungen mit Installationshinweis. Vorhandene automatische Unit-Tests werden CI-seitig erfolgreich durchlaufen.

**Externe Voraussetzung:** Das Intel-DMG enthält **keine Stockfish-Binary**. Der Nutzer muss eine kompatible Stockfish-Engine (beispielsweise per `brew install stockfish`) installieren oder ihren Pfad in Einstellungen eingeben; erst dann kann `offline_engine_move` tatsächlich einen gegnerischen Zug ausführen. Kein echtes Intel-Mac-Engine-Spiel oder UI-Abnahme dieser Änderung nachgewiesen. **Nicht als vollständig funktionsfähig oder Release ausgeben**.

**Nächster einzelner Abnahmeschritt:** Neue DMG öffnen, Fenster vollständig ausfüllen, `Offline spielen` → Stockfish und nach `1.d4` eine schwarze Antwort prüfen. Falls keine Engine gefunden wird: macOS `command -v stockfish` / `/usr/local/bin/stockfish` kontrollieren und Engine-Verbindung in App-Einstellungen testen. Bildausschnitt mit oberer Brettreihe und Modusspalte nach Neuöffnung prüfen. Erst nach realer Abnahme einen Release erwägen.

---

# Ergänzung 11.11.2026 – Offline-Brett beim Ansichtswechsel oben abgeschnitten

Neben der Größenkorrektur `offlineBoardSize()` wird in `OfflinePlayView.tsx` jetzt der Scrollstand der neuen Offline-Ansicht über `useLayoutEffect` auf Null zurückgesetzt. Begründung: React kann den `.page-scroll`-Knoten einer vorherigen, bereits heruntergescrollten Ansicht weiterverwenden. Dies kann die oberste Figurenreihe hinter der Kopfzeile verschwinden lassen. Commit `6f687f0c`. Die tatsächliche Reproduktion/Behebung auf Intel-Mac steht weiterhin aus.

Für diesen Commit läuft [CI 42926376165](https://github.com/wibem1/kibitz/actions/runs/42926376165) und ein [Intel-DMG-Workflow 42926376043](https://github.com/wibem1/kibitz/actions/runs/42926376043). Bei letzter Abfrage waren beide nicht abgeschlossen. Kein ungeprüftes Testpaket empfehlen.

---

# Kibitz DE – 11.11.2026: Offline-Engine fehlt, Brett zu klein/oben abgeschnitten – konkreter Reparaturstand

**Echter Intel-Mac-Screenshot:** Im Bildschirm `Offline spielen` nach dem weißen Zug `d4` meldet die App `Kein ausführbares Stockfish-Programm gefunden`; das Brett ist nur ca. 520px und der obere Rand abgeschnitten. Der Nutzer kann faktisch nicht gegen die Engine spielen. Dies ist **nicht** durch erfolgreiche GitHub-CI-Läufe widerlegt.

**Nachgewiesene Ursachen:** `OfflinePlayView.tsx` hat `<Board ... />` bisher ohne `size` gerendert; `Board.tsx` verwendet dann starr `size=520`. Anders als die Partienansicht hatte der Offline-Screen keine responsive Brettgrößenberechnung. Der Spielbereich hatte keinerlei eigene obere Innenabstände, und eine lange Engine-Fehlermeldung konnte die linke Brettspalte in einem Flex-Layout verbreitern, sodass Einstellungen und Zugliste unterhalb statt daneben landeten. Die Rust-Auflösung `uci::resolve_engine_path()` suchte nur die GUI-Prozess-`PATH`-Variable und das für Intel bewusst unbrauchbare Repo-Apple-Silicon-Binary (auf Intel deaktiviert); Finder-Apps sehen häufig die Homebrew-`/usr/local/bin`-Verzeichnisse nicht im PATH.

**Implementierte Änderungen, noch nicht auf dem Intel-Mac erprobt:**
- Neue testbare `offlineBoardSize(windowWidth,windowHeight)` in `app/src/lib/offlineLayout.ts`: bei 1536×934 wird statt 520 nun 720px Brettgröße angestrebt; bei niedrigen Fenstern kleiner; vier Regressionstests in `offlineLayout.test.ts`. `OfflinePlayView` beobachtet `window.resize` und übergibt `size={boardSize}` explizit ans Brett.
- `app.css`: offline-spezifische Innenabstände oben, begrenzte Brettspaltenbreite, Umbruch langer Diagnosemeldungen und eigene Enginehilfe. Ziel: erste Reihe nicht vom Kopf verdecken; rechte Modusspalte auf Desktop daneben.
- `uci.rs`: macOS-Fallback für bereits installierte Stockfish-Programme in `/usr/local/bin/stockfish`, `/opt/homebrew/bin/stockfish`, `/opt/local/bin/stockfish` und Homebrew-`opt`-Verzeichnissen. **Installiert keine Engine!** Wenn Stockfish nicht vorhanden ist, kann die Software nicht selbst spielen.
- `OfflinePlayView` erhält einen Schalter `Stockfish in Einstellungen einrichten` (über `App` verdrahtet) und zeigt eine Anleitung für Intel-Mac und Homebrew `brew install stockfish` statt nur des allgemeinen Fehlers.

**Letzte Code-Commits:** `2a4dbaba`, `0be23a20`, `bb47e139`, `99443e41`, `ffccac46`, `1ce74d98`, `1bdc0c33`, `98902854`, `ab593260`, `bce64cff`.

**Prüfstatus:** Code in GitHub gesichert; CI und x86_64-DMG für diese Änderungen noch **nicht bestätigt**. Keine neue Download-Freigabe, bis Tests erfolgreich sind. Ein reales Spiel nach `1.d4` benötigt zudem eine auf dem Mac installierte kompatible Engine und eine echte `bestmove`-Antwort.

**Nächster Schritt:** GitHub-CI dieser Commits prüfen und ggf. korrigieren, anschließend ausschließlich mit frischem Intel-x86_64-DMG sowie installiertem Stockfish den Zug `1.d4` auf Antwort und unveränderte Brettgeometrie testen. Bei fehlender Installation kann der Nutzer Homebrew `brew install stockfish` nutzen oder eine vorhandene Stockfish-Binary unter `Einstellungen → Engineprogramm` auswählen; ohne Engine bleibt der Fehler erwartbar.

---

# Kibitz DE – 11.11.2026: Funktionsprüfung nach realem Intel-Mac-Test (Audit, keine Freigabe)

**Nutzerbestätigung:** Die zuletzt korrigierten Größenproportionen und das stabile Brett funktionieren im realen Test. Gesamte App noch nicht als vollständig funktionsfähig bestätigt.

**Drei konkret untersuchte UX-/Funktionslücken (Quellcodebefund):**
1. **Bewertung:** `GameView.tsx` rendert die senkrechte `EvalBar` links des Bretts. `selectPlyAnalysis(analysisRows, gv.ply)` erhält nur gespeicherte `game_analyses`-Datensätze; bei direkt geladener PGN ist `analysisRows=[]`, also Balken ohne Zahl. `Live-Analyse` unter dem Brett ist separat, ihr aktuelles Ergebnis wird in der `live-strip` angezeigt und **nicht** in den Bewertungsbalken eingespeist. Nutzer erwartet eine sichtbare Bewertung der aktuellen Stellung ohne Datenbankimport.
2. **Gesamte Partie erläutern / neu bewerten:** `GameView.tsx` deaktiviert beide Buttons bei `gameId === null`, also auch bei direkt eingelesener PGN. `App.tsx` erzeugt für `ImportView`-PGN keine `annot.gameId`. Die Stellungserklärung in `ExplainPanel` benutzt dagegen `explainPosition` und funktioniert prinzipiell ohne DB. In `App.tsx` wird das Scheitern automatisch abgerufener Erklärungen mit `.catch(() => {})` still verschluckt; manuelle Fehler landen nur in der allgemeinen Statuszeile. Die UI muss den Unterschied klar erklären und die ganze Partie möglichst auch ohne Datenbankeintrag erläutern.
3. **Gegen Stockfish spielen:** Die Funktion ist tatsächlich vorhanden unter `Offline spielen` → Gegner `Stockfish (offline)`; `OfflinePlayView.tsx` ruft `offline_engine_move` auf, kennt Menschenfarbe, Rücknahme, Autosave und PGN. Dazu gibt es mehrere reine Logiktests. **Echter UCI-Zug auf Intel-Mac und Wiederherstellung nicht nachgewiesen**. Der Navigationspunkt ist schlecht als Engine-Spiel erkennbar.

**Weitere nachgewiesene Grenzen des Funktionsumfangs:** In `ImportView.tsx` erfolgt SCID-.si4-Import ausdrücklich nur über die CLI, nicht über einen App-Dateidialog. In `SettingsView.tsx` sind zahlreiche sichtbare Texte weiter englisch (u. a. `Switch to Coach`, `LLM verbaliser`, `TWIC auto-download`, `unknown (no database open)`); `DatabaseScreen.tsx` und `EndgameView.tsx` enthalten ebenfalls wesentliche englische UI-Bereiche. Eine vollständige deutsche Oberfläche ist somit **nicht erreicht**, obwohl die 451 deterministic-analysis templates übersetzt wurden.

**Prüfart:** Source-Audit des Branches `feat/de-simple-readable-ui` und Bestätigung des Layouts durch den Nutzer. Kein ausführbarer Integrationstest der Engine/DB/Online-Schnittstellen auf dem Intel-Mac bei diesem Audit. Keine Codeänderungen, keine neue Version, kein Release.

**Prioritäten:** (1) PGN ohne DB vollständig erläutern/bewerten können und Live-Score neben dem Brett zeigen; (2) Engine-Spiel in der Navigation explizit benennen und real am Intel-Mac testen; (3) Restübersetzung der tatsächlich sichtbaren Oberflächen und Fehleranzeigen; (4) Datenbank-/Import-/Training-/Online-Workflows als echte Ende-zu-Ende-Abnahme testen. Erst danach „voll funktionsfähig“ behaupten.

---

# Kibitz DE – 11.11.2026: korrigierter Layoutstand CI-grün, Intel-Mac-DMG liegt vor

**Quellstand der verifizierten Layoutkorrektur:** `a8221d1873d7c90b16fd35336fd7f87a9409445f`, Branch `feat/de-simple-readable-ui`.

**CI vollständig erfolgreich:** [Run 42920832981](https://github.com/wibem1/kibitz/actions/runs/42920832981) `completed/success`; alle 4 Jobs `app (ubuntu-latest)`, `app (macos-latest)`, `rust (ubuntu-latest)` und `rust (macos-latest)` bestanden. Die neue Größenberechnung und ihre ergänzten Frontendtests sind enthalten.

**Passendes Intel-x86_64-Test-DMG erfolgreich gebaut:** [Run 42920832978](https://github.com/wibem1/kibitz/actions/runs/42920832978) `completed/success`, Artefakt [`kibitz-de-intel-mac-unsigned-test` ID 13812715680](https://github.com/wibem1/kibitz/actions/runs/42920832978/artifacts/13812715680) (ZIP 11.693.699 Bytes). Enthält `Kibitz_0.1.2_x64.dmg`; das Protokoll bestätigt die `Mach-O 64-bit executable x86_64`-Architektur sowie genau ein DMG. **Keine macOS-GUI-Laufzeitabnahme und kein Release, sondern unsignierter Testbuild.**

**Offener konkreter Abnahmepunkt:** Im gleichen Fenster und mit `EgorSN – wibem` Halbzug 56/137 prüfen, dass das Brett beim Vor-/Zurückblättern nicht mehr in Größe oder Bildschirmposition springt und größer als zuvor dargestellt wird. Sollte es weiterhin springen, vor/nach einem Klick die vertikale Koordinate der Brettoberkante und seine Pixelgröße erfassen, bevor weitere Layoutänderungen erfolgen. Die Layoutursachen stehen im unmittelbar folgenden Abschnitt dieses Dokuments.

---

# Kibitz DE – 11.11.2026: Brett springt weiterhin / Kommentarspalte zu breit – Layoutkorrektur zur Abnahme

**Realer Nutzertest am Intel-Mac:** Der Testbuild zu `6b6d8f6` wurde in einem 1532 × 934 Pixel großen macOS-Fenster mit Partie `EgorSN – wibem` bei Halbzug 56/137 fotografiert. Das Brett ist dort etwa 545 px breit und springt beim Vor-/Zurückblättern noch immer. Die Kommentarspalte ist mit 472 px zu breit. Damit ist die bisherige Layoutkorrektur **nicht abgenommen und nicht erfolgreich**; den alten Build nicht als Lösung empfehlen.

**Konkret ermittelte Ursachen und Gegenmaßnahmen (GitHub-Quellcode):**
1. `app/src/app.css`: `.right-pane` hatte `flex: 0 0 472px`; jetzt `clamp(320px, 27%, 360px)`, womit mehr Platz dem Brett zugutekommt; der Kopf der Erläuterung kann bei geringerer Breite umbrechen.
2. `app/src/GameView.tsx`: Die ältere Geometriekorrektur hatte `fitBoardSize(r.width - 98, r.height - 220,...)` benutzt. Die feste Abzugszahl von 220 px verkleinerte das Brett auf dem Screenshot unnötig. Die Berechnung benutzt jetzt `fitGameBoardSize()` aus `app/src/lib/gameView.ts` mit 98 px Breitenreserve und nur 126 px Höhenreserve, aus der unveränderlichen Brettspalten-Größe. Die Messung der veralteten `stageRef` ist entfernt.
3. `app/src/app.css`: `.board-column` ist ein eigener Scrollcontainer. Bei Wechsel der Analyse-/Variantenzeilen kann Browser-Scroll-Anchoring das Brett im Viewport verschieben; `overflow-anchor: none` deaktiviert dieses automatische Versetzen. `scrollbar-gutter: stable` reserviert konstanten Platz für die Bildlaufleiste, damit deren Auftauchen/Verschwinden nicht über den ResizeObserver die Brettbreite verändert.
4. `app/src/lib/gameView.test.ts`: Regressionstest für ca. 950×785 px Brettspalte nach Verkleinerung der Kommentarspalte; die neue Brettgröße muss >=600 px und teilbar durch 8 sein. Ein weiterer Test kontrolliert die deterministische Berechnung aus derselben Spaltengeometrie unabhängig von wechselnden Halbzügen.

**Commits:** `aa8f3a76`, `8497e236`, `fecc9977`, `b543f734`, `34ec8f66`, `a8221d18` auf `feat/de-simple-readable-ui`.

**Prüfgrenze:** Der Code ist gesichert. CI der letzten Commits noch ausstehend; **nicht als behoben behaupten**, bis ein echter macOS-GUI-Test bei wechselnden Zügen die unveränderte Brettposition und die größeren Maße bestätigt. Vorherigen grünen Basisstand `6b6d8f6` als Referenz erhalten. Ein DMG nur aus exakt geprüftem Commit empfehlen.

**Nächster einzelner Schritt:** CI für `a8221d18` prüfen; falls grün, den neuen unsignierten Intel-x86_64-DMG-Build unter macOS bei Partie `EgorSN – wibem` und Halbzug 56/137 sowie mehrfachem Vor-/Zurück durch Nutzer abnehmen lassen. Bei weiterhin sichtbarem Sprung: konkrete Abweichung (Brett-Oberkante und -Größe vor/nach einem Zug) messen und nicht erneut pauschal CSS-Reservierungen ändern.

---

# Kibitz DE – 10.11.2026: deutschsprachige Analyse CI-grün und aktuelles Intel-Mac-DMG gebaut

**Verbindlicher Quellstand für diesen Prüfpunkt:** Commit `6b6d8f6acf65358e77970b4eac1598d337f3cecb` auf `feat/de-simple-readable-ui`.

**Vollständige CI erfolgreich:** [GitHub Actions Run 42918245931](https://github.com/wibem1/kibitz/actions/runs/42918245931), `completed/success` mit allen vier Jobs: `rust (ubuntu-latest)`, `rust (macos-latest)`, `app (ubuntu-latest)`, `app (macos-latest)`. Der App-Ubuntu-Log bestätigt zuvor 624/624 Frontendtests, TypeScript-Prüfung und Vite-Build erfolgreich. Der gleiche Commit umfasst die Übertragung von 451 Analyse-Template-Einträgen ins Deutsche und die Anpassung der zugehörigen Rust- und PGN-Tests. Vorherige rote CI-Läufe betrafen englisch formulierte Test-Erwartungen und Rustfmt und sind mit `6b6d8f6` behoben.

**Intel-Mac-Testpaket erfolgreich erstellt:** [Actions Run 42918245930](https://github.com/wibem1/kibitz/actions/runs/42918245930) `completed/success`; [Artefakt kibitz-de-intel-mac-unsigned-test, ID 13809953480](https://github.com/wibem1/kibitz/actions/runs/42918245930/artifacts/13809953480) (ZIP 11.693.739 Bytes; enthält `Kibitz_0.1.2_x64.dmg`). Buildlog bestätigt `Mach-O 64-bit executable x86_64`, genau ein DMG und erfolgreichen Upload. **Unsignierter Testbuild, kein offizieller Release.**

**Noch nicht abgenommen:** Die Nutzerbeschwerde `Brett springt beim Zug vor/zurück` wurde durch stabile Breiten-/Höhenmessung und obere Verankerung der Brettspalte adressiert; reales Verhalten am Intel Mac ist **nicht** geprüft. Ebenso müssen deutsche Frischerklärungen im echten App-Fenster bestätigt werden. Schon in SQLite gespeicherte englische Annotations- oder Fremd-PGN-Texte werden nicht rückwirkend von der Template-Übersetzung geändert; für neu erzeugte Anmerkungen muss eine neue Annotation erfolgen.

**Nächster einzelner Schritt:** Nutzer installiert dieses genau geprüfte Intel-DMG und prüft in `Partie & Analyse` zunächst mehrmals `Zurück/Weiter` und `Stellung erklären` an einer noch nicht erklärten Stellung. Bei Fehlern Diagnose über Einstellungen exportieren. Erst nach echter GUI-Abnahme Veröffentlichung erwägen. Maia 2 bleibt separate spätere Funktion.

---

# Kibitz DE – 10.11.2026: 23/25 Erklärungsengine-Tests und anschließende Korrekturen

[CI 42916960458](https://github.com/wibem1/kibitz/actions/runs/42916960458) meldete im Mac-Rust-Job für `crates/kibitz-verbalize/tests/verbalize.rs` **23 von 25 Tests erfolgreich**. Die beiden verbleibenden Fehler waren eine falsch erwartete Groß-/Kleinschreibung in einem deutschen Entwicklungshinweis und eine im Englischen bestehende, in der Übersetzung versehentlich verlorene Unterscheidung zwischen Coach- und Neutral-Eröffnungskommentar. Korrigiert in `a5a17ffd` und `3e7f3650`; die genderabhängige Formulierung `Dame ... seinen Schutz` wurde zugleich durch die grammatisch neutrale `steht ohne Deckung` ersetzt.

Im nächsten Zwischenlauf `42917260842` bestanden danach die Verbalizer-Tests unter Ubuntu; der verbleibende Fehler im narrations-PGN-Regressionstest war die alte erwartete Coach-Buchformulierung. Korrigiert in `bd73b509`. **Die danach gestartete vollständige CI [42917505533](https://github.com/wibem1/kibitz/actions/runs/42917505533) ist bei der letzten Abfrage noch nicht abgeschlossen**; Intel-Test-DMG [42917505584](https://github.com/wibem1/kibitz/actions/runs/42917505584) ebenfalls noch ausstehend. Keinen grünen Gesamtstatus behaupten, bevor beide Tests abgeschlossen sind.

**Wichtig für die reale Abnahme:** Frisch erzeugte Positions-Erklärungen sollen deutsch sein. Bereits früher in der lokalen Datenbank gespeicherte englische Kommentare werden nicht von selbst ausgetauscht; eine erneute Annotation ist erforderlich. Die Brettfixierung wurde bisher nur anhand des Quellcodes geprüft, nicht an einem echten Intel-Mac.

---

# Kibitz DE – 10.11.2026: Restfehler der deutschen Erklärungsengine in Tests behoben (CI läuft)

**Anlass:** Der auf Deutsch umgestellte Verbalizer erzeugt erwartungsgemäß andere Texte; die vollständige CI für den bisherigen Branch scheiterte auf Ubuntu und macOS **nicht an Compile-Problemen**, sondern an 16 bislang englisch kodierten Textprüfungen in `crates/kibitz-verbalize/tests/verbalize.rs`. Beleg: [Run 42911652966](https://github.com/wibem1/kibitz/actions/runs/42911652966), Rust-Jobs `failure`, beide App-Jobs `success`; zugehöriger Intel-DMG-Workflow `42911652957` `success` (aber Rust-Gesamttests rot, daher **nicht freigeben**).

**Bearbeitung:** Mit Commit `20df53ba` 32 englischspezifische semantische Testbedingungen in deutsche Aussagen geändert. Zehn reine Volltext-Snapshot-Prüfungen, die zwangsläufig die englische Formulierung fixierten, durch deutsche Basiskontrolle ersetzt. Die bestehenden Schachlogik-, Fakten-/Feldbezug-, Beweis-, Doppelungs- und Prosa-Lintprüfungen bleiben bestehen. Beim ersten Folgelauf `42916795667` schlug `cargo fmt --check` wegen neuer Testformatierung fehl; diese sieben konkreten Formatstellen sind mit Commit `4150892b` angepasst worden.

**Noch offen:** Der neueste CI-Lauf [42916960458](https://github.com/wibem1/kibitz/actions/runs/42916960458) zu `4150892b` war bei letzter Prüfung auf Ubuntu und macOS noch `in_progress`. Kein erfolgreich durchlaufener Rust-Gesamttest des aktuellen Branches, keine reale UI-Abnahme des nicht springenden Bretts. Ein Intel-Mac-Testbuild aus dem vorherigen Stand ist noch keine Produktfreigabe.

**Nächster Schritt:** Resultate von `42916960458` auswerten, eventuelle konkrete deutsche Testfehler minimal korrigieren, danach Installationsprobe von Intel-DMG sowie Wiederholung der Nutzerschritte `Zug vor/zurück` und `Stellung erklären`. Alte bereits gespeicherte englische Kommentare werden durch reine Template-Änderung nicht automatisch neu übersetzt.

---

# Kibitz DE – CI-Nachtrag zur deutschen Analyse (10.11.2026)

Nach Sprachumstellung schlugen zunächst ausdrücklich englisch formulierte Assertions und ein englischer Gesamt-PGN-Snapshot fehl. Die konkreten Fundstellen wurden auf deutsche Tests umgestellt; der letzte geprüfte Zwischenlauf `42911255399` meldete außerdem einen Rustfmt-Konflikt im deutschen Satzübergang (`crates/kibitz-verbalize/src/lib.rs`). Der Formatierungsfehler wurde mit Commit `5ab8acca` behoben. Ein erneuter [CI-Lauf 42911508137](https://github.com/wibem1/kibitz/actions/runs/42911508137) befindet sich bei letzter Abfrage noch in Arbeit. **Nicht als bestanden kennzeichnen.**

Für den Nutzer nicht das ältere Intel-DMG empfehlen: Es enthält die hier beschriebenen Lokalisierungs- und Layoutänderungen nicht. Neuestes DMG erst nach erfolgreichem Build *des aktuellen Commits* und danach tatsächlicher Intel-Mac-Abnahme bereitstellen.

---

# Kibitz DE – 10.11.2026: englische Analysen und springendes Brett korrigiert (Praxistest ausstehend)

**Auslöser:** Nutzer meldet, dass die Stellungserklärungen weiterhin englisch sind und das Schachbrett beim Vor-/Zurückblättern springt. Diese Mängel der bisherigen Intel-Testversion sind bestätigt durch Quellprüfung.

**Brettlayout:** `GameView.tsx` ermittelt die Brettgröße jetzt aus der unveränderlichen Brettspaltengeometrie statt aus dem durch optionale Analyseleisten schrumpfenden Bühnenbereich. `app.css` verankert das Brett oben (`flex-start`) und lässt zusätzliche Bedienelemente gegebenenfalls separat in der Spalte scrollen, statt Brett und Bedienelemente bei jedem Halbzug neu zu zentrieren. Commits `e58d4c20`, `e2c513cd`. **Keine reale GUI-Abnahme**, das Springen gilt damit als *im Quellcode adressiert*, nicht als vom Nutzer bestätigt.

**Deutsche Analyse:** Sämtliche bekannten Ausgabe-Templates der deterministischen Erläuterungsengine in `crates/kibitz-verbalize/templates/{common,alerts,imbalances,evidence,plans,schemes,coach}.tmpl` übersetzt (insgesamt 451 textuelle Template-Einträge inkl. mehrfacher Varianten). Fachbegriffe, Erklärungen, strategische Pläne, Langfristpläne, KI-Trainer-Ton und Engine-Urteile sind deutsch; Platzhalter und maschinenlesbare Schlüssel blieben erhalten. Ergänzend Rust-Ausdrücke für Zugzahl/Seiten sowie deutsche Darstellung der technischen Bewertungstags und Variantenbedienung angepasst; letzte deutsche Satzverbindungen korrigiert. Codes `a94c30f4` bis `567d387d`, `0b730e88`.

**Tests:** Die zuvor auf englischen Formulierungen basierenden Tests in `foldback.rs`, `jobs_and_annotate.rs`, `app/src-tauri/src/explain.rs` an die deutsche Ausgabe angepasst. Ein 4-teiliger `foldback`-Testlauf und 11 Tests von `jobs_and_annotate` liefen in älteren Zwischen-Commits unter Ubuntu **erfolgreich**. Der englische Komplett-PGN-Snapshot in `app/kibitz-db/tests/narration.rs` blockierte erwartungsgemäß die CI; Commit `732de095` ersetzt dessen wortlautabhängigen Vergleich durch deutsche Inhaltsprüfungen, während Wiederholungsprüfung und deterministische Re-Annotation bestehen bleiben. **Vollständige CI-Prüfung der aktuellen Änderungen noch offen**; [Run 42911255399](https://github.com/wibem1/kibitz/actions/runs/42911255399) bei letzter Abfrage in Bearbeitung. Keine erfolgreiche Mac-Praxissimulation, kein Release.

**Einschränkung:** Bereits in Datenbanken gespeicherte frühere englische Kommentare können bestehen bleiben, bis sie neu erzeugt werden. Die Übersetzung betrifft die von der aktuellen Engine neu generierten Texte; noch nicht alle seltenen Oberflächen und importierten PGN-Fremdkommentare sind als deutsch verifiziert.

**Nächster einzelner Schritt:** Den vollständigen CI-Lauf für den korrigierten Stand samt Rust-/Frontend-Tests prüfen und weitere konkrete Fehler beseitigen; dann frisches Intel-Mac-DMG und tatsächliche Vor-/Zurück-Navigation sowie deutsch erzeugte Erklärungen am Intel-Mac testen.

---

# Kibitz DE – 10.11.2026: korrigierte Diagnose besteht CI, frisches Intel-DMG vorhanden

**Verifiziert:** Der Commit `80f4c3144ce5d1207956f79e191c59e78bde1a9f` wurde in [CI-Run 42896580363](https://github.com/wibem1/kibitz/actions/runs/42896580363) geprüft: `rust` und `app` sowohl auf Ubuntu als auch macOS jeweils **success**. Darin enthalten ist der neue Regressionstest der Diagnose-Zeitstempel.

**Frischer Intel-Testbuild:** [Intel-DMG-Run 42896580002](https://github.com/wibem1/kibitz/actions/runs/42896580002) **success**, Artefakt [`kibitz-de-intel-mac-unsigned-test` (13802307067)](https://github.com/wibem1/kibitz/actions/runs/42896580002/artifacts/13802307067), 11.694.444 Bytes (ZIP-Artefakt). Buildprotokoll bestätigt `Mach-O 64-bit executable x86_64` und genau ein erzeugtes DMG (`Kibitz_0.1.2_x64.dmg`). Dieses DMG basiert auf dem korrigierten Diagnose-Stand `80f4c314`, ist **unsigniert** und ausdrücklich **kein Release**.

**Offen:** Installation, Engine-Start, reale Stockfish-Partie und Neustart/Diagnose-Export auf dem echten Intel-Mac sind noch **nicht** durchgeführt. CI und Build beweisen keine korrekte Interaktion mit macOS/Gatekeeper und kein Laufzeitverhalten.

**Nächster einzelner Schritt:** Genau dieses aktuelle Artefakt auf Intel-Mac anhand `docs/INTEL_MAC_ACCEPTANCE.md` ausprobieren; nach etwaigem Fehler das über die Einstellungen speicherbare Diagnose-JSON auswerten. Keine neue Veröffentlichung vor echter Abnahme.

---

# Kibitz DE – 10.11.2026: Diagnose-Wiederherstellung korrigiert

**Konkreter Fehler behoben:** In `app/src/lib/diagnostics.ts` hatte der reguläre Ausdruck für persistierte ISO-Zeitstempel versehentlich doppelt maskierte `\\d`-Klassen. Dadurch wurden beim Neustart gültige Diagnoseereignisse verworfen, obwohl das Speichern funktionierte. Commit `8ed83032` korrigiert die Zeichenklassen. Commit `2755627e` ergänzt einen gezielten Regressionstest für gültige und ungültige Zeitstempel; die zuvor vorhandene Neustart-Probe deckt den Fall ebenfalls ab.

**Prüfstatus:** Quelländerungen auf GitHub gesichert, **CI-Resultat für diese Commits noch offen**. Die zuvor gebaute Intel-Test-DMG-Datei (Run 42891915194) enthält diese Korrektur und die Diagnosefunktion **nicht**. Kein neuer Release und kein Nachweis eines realen Intel-Mac-Tests.

**Nächster einzelner Schritt:** CI-Ergebnis für `2755627e` kontrollieren und dann den Intel-Mac-Testbuild aus genau diesem Stand mit Diagnose-Neustart durchführen.

---

# Kibitz DE – 10.11.2026: Intel-DMG erzeugt und Diagnose nach Neustart verfügbar

**Build-Nachweis:** [Intel-Mac-Preview-Lauf 42891915194](https://github.com/wibem1/kibitz/actions/runs/42891915194) erfolgreich (Job `Unsigned Intel Mac DMG (x86_64)`: `success`). Artefakt `kibitz-de-intel-mac-unsigned-test`, ID `13799332203`, Größe 11.693.740 Bytes, wurde hochgeladen. Es handelt sich um ein **unsigniertes Test-DMG eines älteren Commits vor der Diagnosefunktion**, kein Release. Die im Workflow verankerte Architektur-/DMG-Prüfung wurde erfolgreich ausgeführt; die App wurde damit nicht auf einem realen Intel-Mac getestet.

**Diagnose-CI-Zwischenstand:** [Run 42892489492](https://github.com/wibem1/kibitz/actions/runs/42892489492) für `285278fa`: `app (ubuntu-latest)` und `rust (ubuntu-latest)` **success**, macOS-Jobs bei Abfrage `queued`. Die erste Diagnosefunktion und ihre fünf Tests wurden damit zumindest unter Ubuntu geprüft.

**Nachgebesserte Diagnose (neu, noch nicht CI-bestätigt):** Das bisher ausschließlich flüchtige Ereignisprotokoll wäre nach einem App-Absturz verloren. Deshalb speichert `app/src/lib/diagnostics.ts` die **ausschließlich fest definierten Ereignisnamen und Zeitstempel** nun begrenzt lokal im Browser-Speicher, lädt sie beim Neustart **mit strenger Code- und Zeitstempelvalidierung**, entfernt fremde Zusatzfelder und ermöglicht ausdrücklich das Löschen. Keine Rohfehlermeldungen/Dateipfade/Partiedaten/API-Schlüssel, keine automatische Netzwerkübertragung. `app/src/main.tsx` initialisiert die Wiederherstellung, `app/src/SettingsView.tsx` bietet neben `Diagnose speichern` den Knopf `Diagnose löschen`. Zwei zusätzliche Tests für Wiederherstellung/Löschen und das Verwerfen fremder Nutzdaten; Commits `21eae736`, `89dde864`, `c738000d`, `a107c496`. **Noch nicht CI-geprüft**. Ein plötzlicher Prozessabsturz kann ein bereits registriertes Ereignis hinterlassen, nicht aber einen unbekannten nativen Fehler automatisch erfassen.

**Nächster einzelner Schritt:** CI-Lauf für `a107c496` auswerten, gegebenenfalls Korrekturen. Dann aktuelles Intel-Test-DMG samt Diagnosedownload an realem Intel-Mac prüfen, erst danach Freigabe.

---

# Kibitz DE – 10.11.2026: datensparsame Diagnosefunktion eingebaut

**Nutzerauftrag:** „weiter und bitte eine Diagnosefunktion einbauen, damit wir künftige Fehler analysieren können“.

**Implementiert (noch nicht durch CI verifiziert):**
- `app/src/lib/diagnostics.ts`: begrenztes, ausschließlich flüchtiges Ereignisprotokoll (maximal 120 Ereignisse); feste Codes und Zeitstempel. Keine Speicherung freier Fehlertexte, Nutzerpfade, PGN/FEN, Datenbanken, API-Schlüssel oder Browser-Storage. JSON-Erzeugung und lokaler Download ausschließlich auf Benutzeraktion, keinerlei automatische Übertragung. Allgemeine Fensterfehler und unbehandelte Promise-Fehler werden **nur als Kategorie** erfasst. Übermäßige oder geheime Nutzlasten sind nicht zulässig.
- `app/src/main.tsx`: installierte Ereignislistener für Oberflächen-/Promise-Fehler.
- `app/src/OfflinePlayView.tsx`: diagnostische Ereignisse für Engine-Anforderung, gültigen/ungültigen Engine-Zug, Start-/Pfad-/Timeout-Fehler und Autosave-Probleme.
- `app/src/SettingsView.tsx`: „DIAGNOSE“ mit Button „Diagnose speichern“, Datenschutzhinweis und manueller JSON-Dateiausgabe.
- `app/src/lib/diagnostics.test.ts`: fünf Tests für Ereigniskategorien, Geheimnis-/Pfadschutz, Begrenzung, ungültige Codes und unveränderliche Kopie.
- Commits: `398decbd`, `e74deb54`, `e9d3ca08`, `4b2289c1`, `285278fa`.

**Begrenzung:** Das ist eine erste **Sitzungsdiagnose**, kein vollständiger Rust-Logdump und keine automatische Crash-Aufzeichnung nach einem Prozessabsturz. Bei Neustart sind die flüchtigen Ereignisse weg. Da keine sensiblen Rohdaten erfasst werden, können tiefere Fehler nach Bedarf mit einer bewusst freigegebenen Diagnosestufe ergänzt werden. Tests noch nicht ausgeführt, Produktfunktion noch nicht praktisch bestätigt.

**Intel-Mac-Testbuild:** [Run 42891829598](https://github.com/wibem1/kibitz/actions/runs/42891829598) noch `queued`; [Run 42891915194](https://github.com/wibem1/kibitz/actions/runs/42891915194) bei Abfrage `in_progress`. Noch kein hochgeladenes DMG-Artefakt festgestellt. Der zuvor nachgewiesene vollständig grüne CI-Stand ist [Run 42885058472](https://github.com/wibem1/kibitz/actions/runs/42885058472), Commit `12e51613`; er prüft **nicht** die neue Diagnosefunktion.

**Nächster einzelner Schritt:** CI für die Diagnosecommits prüfen, eventuelle konkrete TypeScript-/Vitest-Probleme korrigieren. Danach Diagnose-Download im realen Mac-Build mit Engine-Fehler und Wiederholungsversuch testen, DMG-Artefakt prüfen. Keine neue Release-Nummer/Freigabe vor Abnahme.

---

# Kibitz DE – 10.11.2026: erstmals komplette CI grün, Intel-DMG-Testworkflow hinzugefügt

**Nachgewiesen:** [CI-Run 42885058472](https://github.com/wibem1/kibitz/actions/runs/42885058472) für Commit `12e51613`: Alle vier Jobs `app (macos-latest)`, `rust (macos-latest)`, `app (ubuntu-latest)`, `rust (ubuntu-latest)` **success**. Im CI-Lauf wurden **keine Download-Artefakte** erzeugt. Ein grüner App-/Rust-Test belegt noch kein DMG und keine reale Stockfish-Partie.

**Nächster Entwicklungsschritt (noch nicht gelaufen):** Neuer gezielter Workflow `.github/workflows/intel-mac-preview.yml` (Commit `ee5332d7`), ausgelöst durch PR-Änderung an genau dieser Workflow-Datei oder manuell. Er kompiliert die Tauri-App für `x86_64-apple-darwin` mit Node 22/Rust, kontrolliert die `x86_64`-Architektur der App-Binary und verlangt genau ein erzeugtes DMG. Danach soll das **unsignierte Test-DMG** als GitHub-Actions-Artefakt `kibitz-de-intel-mac-unsigned-test` hochgeladen werden (7 Tage Aufbewahrung). Keine Tag-Erstellung, kein Release, keine Engine-Beigabe, keine Secrets. Erstellung des Workflows bestätigt, dessen erfolgreiche Ausführung **noch nicht bestätigt**.

**Noch offen für Freigabe:** Test-DMG tatsächlich erfolgreich bauen und herunterladen, Mac-Signatur/Gatekeeper-Hinweise korrekt behandeln, echte Intel-Mac-Stockfish-Partie samt Rücknahme, Autosave und PGN nach `docs/INTEL_MAC_ACCEPTANCE.md` prüfen. Das Release-Zielraster verlangt zudem Apple Silicon/Linux/Windows. `docs/RELEASING.md` und Website/Updater-Zieladressen vor Fork-Veröffentlichung konsistent machen.

**Nächster einzelner Schritt:** Ergebnis des gezielten Intel-DMG-Workflows samt Buildlogs und Artefakt prüfen. Nicht mehrfach auf Verdacht neu starten.

---

# Kibitz DE – 10.11.2026: Intel-Mac-Freigabeprüfung dokumentiert

**Geprüft:** Der gezielt wiederholte macOS-App-Job in [Run 42873364058](https://github.com/wibem1/kibitz/actions/runs/42873364058), aktuelle Job-ID `130064395642`, war bei der erneuten Abfrage weiterhin `queued`. Der aktuellere Workflow für Dokumentationscommit `44a13469`, Run `42883296054`, war ebenfalls noch `queued`. Ein erfolgreiches macOS-App-Paket ist damit nicht belegt.

**Neuer überprüfbarer Schritt:** `docs/INTEL_MAC_ACCEPTANCE.md` (Commit `5ec28399`) dokumentiert den frischen Build auf Intel-Mac, Architekturprüfung der erzeugten Tauri-App, Auswahl der zum Prozessor passenden Stockfish-Engine, echten Spielzug, Rücknahme während/nach Berechnung, Schwarz/Weiß, Wiederherstellung und PGN-Export sowie Fehlerfall und Freigabeschranken. Der Ablauf ist eine **noch auszuführende Prüfanleitung**, kein bestandener Praxistest und keine Installation. Keine Version, kein Tag, kein Release.

**Nächster einzelner Schritt:** Erst macOS-Job-Ergebnis und tatsächlich erzeugten Intel-DMG feststellen; dann die Testfälle mit dem genau zu veröffentlichenden Artefakt ausführen. Bei abgebrochenem/weiter blockiertem macOS-Runner keine erneute unkontrollierte Retry-Schleife.

---

# Kibitz DE – 10.11.2026: Veröffentlichungsprüfung und gezielter macOS-Retry

**Nutzerauftrag:** »weiter und veröffentlichen«. Release-Voraussetzungen aus `DEVELOPMENT_STANDARDS.md`, `AGENTS.md`, `docs/RELEASING.md`, `docs/RELEASE_CHECKLIST.md` und `.github/release-targets.json` überprüft. **Keine neue Version, kein Tag, kein öffentlicher Release**, weil die verlangte reale Mac-Abnahme/Installerprüfung noch aussteht.

**CI-Fakten:** [Run 42873302264](https://github.com/wibem1/kibitz/actions/runs/42873302264) zu `39592c81`: Ubuntu Rust **success**, Ubuntu App **success**, macOS Rust **success**, macOS App **cancelled**. [Run 42873364058](https://github.com/wibem1/kibitz/actions/runs/42873364058) zu `c3a749b5`: Ubuntu Rust und App **success**, macOS Rust **cancelled**, macOS App **cancelled**. Das bestätigt die 5 neuen Fehlertext-Tests auf Ubuntu, aber nicht den macOS-App-Build.

**Konkrete Aktion:** Den zuletzt abgebrochenen **einzelnen** macOS-App-Job `130030105798` aus Run 42873364058 gezielt über GitHub Actions erneut angefordert (`rerun_workflow_job`: `success=true`). Aktueller Versuch: Job `130064395642` (`app (macos-latest)`) bei Abfrage noch `queued`. Keine Retry-Schleife, kein anderer Job unnötig gestartet.

**Release-Blocker:** `.github/release-targets.json` verlangt verifizierte DMGs für `aarch64` und `x86_64` sowie Linux- und Windows-Pakete. Ein vorhandener `release.yml`-Workflow erstellt Release-Entwürfe über Tag-Push; grüne Tests allein erzeugen keine herunterladbare Mac-App. `docs/RELEASING.md` verlangt Artefakt-/Gatekeeper-Prüfung; `docs/RELEASE_CHECKLIST.md` enthält noch nicht abgehakte Voraussetzungen. Ein echter Stockfish-Zug, Rücknahme, Autosave und PGN auf Intel-Mac sind weiterhin nicht nachgewiesen. Außerdem sind Updater-Einstellungen noch auf `avienu/kibitz` statt den Fork ausgerichtet; vor einer späteren öffentlichen Fork-Version gesondert prüfen.

**Nächster einzelner Schritt:** Den neuen macOS-App-Job auswerten und falls er erfolgreich ist, einen testbaren Intel-Mac-Build samt echter Stockfish-Probe und Artefaktkontrolle vorbereiten; erst dann Versionierung, Tag und Freigabe. Maia 2 nicht vorziehen.

---

# Kibitz DE – 10.11.2026: UCI-Test in Ubuntu-CI grün, Stockfish-Fehlermeldungen verbessert

**Belegter Prüfstand:** Für Commit `eb630e83` mit dem simulierten `scripted_engine_returns_a_bounded_bestmove` sind in [GitHub-Actions-Lauf 42872367592](https://github.com/wibem1/kibitz/actions/runs/42872367592) die Jobs `rust (ubuntu-latest)` und `app (ubuntu-latest)` **success**. Auch für den nachfolgenden Dokumentationscommit `2398307f` sind in [Lauf 42872452261](https://github.com/wibem1/kibitz/actions/runs/42872452261) beide Ubuntu-Jobs **success**. Damit ist der neue UCI-Protokolltest auf Ubuntu tatsächlich durch den Rust-Job ausgeführt und akzeptiert worden. Beide macOS-Jobs standen bei Abfrage weiterhin `queued`; daraus folgt **kein** Mac-Testnachweis.

**Kleiner Folgeschritt für den Intel-Mac-Einstieg (noch nicht getestet):**
- `app/src/lib/offlineEngine.ts` übersetzt die bekannten Backend-Fehler »kein Stockfish gefunden«, »konfigurierter Engine-Pfad existiert nicht«, »Prozess kann nicht starten« und »Timeout« in konkrete, verständliche deutsche Hinweise. Für unbekannte Fehler bleibt die rohe Diagnose erhalten.
- `app/src/OfflinePlayView.tsx` nutzt die Erklärfunktion statt der technischen englischen Fehlermeldung.
- `app/src/lib/offlineEngine.test.ts` prüft fünf Fehlersituationen. Commits: `85ee885a`, `1c06bb66`, `39592c81`.
- Produktive Engine-Suche, Zugreihenfolge und Speicherung unverändert. Für die neuen UI-Meldungen liegen **noch keine grünen Testläufe** vor.

**Noch offen:** macOS-CI-Jobs abschließen lassen oder ihre Runner-Verfügbarkeit nachweisbar prüfen. Auf echtem Intel-Mac Stockfish auswählen, einen UCI-Zug spielen, Rücknahme und Autosave/PGN prüfen. Keine Freigabe oder Maia-2-Erweiterung.

**Nächster einzelner Schritt:** CI des neuen Testcommits prüfen, danach Mac-Runner- und Praxistests.

---

# Kibitz DE – 10.11.2026: CI-Korrektur erfolgreich, UCI-Ende-zu-Ende-Test ergänzt

**Nachgewiesener Stand:** GitHub-Actions-Lauf [42869075650](https://github.com/wibem1/kibitz/actions/runs/42869075650) für Commit `a1f70ffc`: `app (ubuntu-latest)` **success** einschließlich Frontend-Tests, TypeScript/Vite-Build sowie src-tauri fmt/clippy/test; `rust (ubuntu-latest)` **success**. Die drei Clippy-Dokumentationsfehler vom vorherigen Lauf sind damit nachweislich korrigiert. `app (macos-latest)` und `rust (macos-latest)` wurden vor Ausführung **cancelled**; diese Jobs haben keine aufgezeichneten Steps, und Job-Logs sind nicht verfügbar (BlobNotFound). Ursache der macOS-Abbrüche nicht belegt; keine Aussage über Mac-Quellcode-Kompilierung möglich. Die bestehende CI-Workflow-Datei enthält bereits `macos-latest` mit `fail-fast: false`; **kein ungezielter Workflow-Umbau**.

**Neuer Schritt:** Commit `eb630e83` in `app/src-tauri/src/uci.rs` fügt einen `#[cfg(unix)]`-Integrationstest `scripted_engine_returns_a_bounded_bestmove` hinzu. Dieser erzeugt ein temporäres ausführbares Shell-Skript als simulierte UCI-Engine, prüft denselben `Engine::spawn`-Handshake (`uci`, `isready`) und danach `position fen`, `go nodes 1234`, `info` und `bestmove e7e5`. Zeitlimit 3 Sekunden, Auswertung des erhaltenen Zugs und der Bewertung; keine echte Stockfish-Binary, kein neuer Fremdcode. GitHub-Quelltext statisch gegengeprüft; **Test selbst noch nicht ausgeführt**. Kein Release.

**Nächster einzelner Schritt:** CI des neuen UCI-Tests auswerten; wenn grün, macOS-GitHub-Runner-Verfügbarkeit unabhängig vom Quellcode klären und einen realen Intel-Mac-Test mit korrekt installierter Stockfish-Engine durchführen. Maia 2 weiterhin nachgeordnet.

---

# Kibitz DE – 10.11.2026: aktuellen CI-Clippy-Fehler gezielt behoben

**Nachgewiesene CI-Ergebnisse:** GitHub-Actions-Lauf [42866034166](https://github.com/wibem1/kibitz/actions/runs/42866034166) auf Commit `979d157b`: `rust (ubuntu-latest)` **success**; `app (ubuntu-latest)` **failure** im Schritt `src-tauri fmt/clippy/test`. Davor liefen **alle 611 Vitest-Einzeltests in 62 Dateien erfolgreich** sowie `tsc --noEmit && vite build` erfolgreich. Das App-Job-Log lokalisiert den anschließenden Fehler auf **drei Clippy-Meldungen `doc_lazy_continuation`** in `app/src-tauri/src/uci.rs`, Zeilen 230–232: nach einer Dokumentationsliste fehlte ein Leerabsatz. Die beiden macOS-Jobs wurden **cancelled**, also nicht bestanden.

**Korrektur:** Commit `a1f70ffc` fügt eine `///`-Leerzeile zwischen Liste und nachfolgendem erklärendem Absatz ein. Keine Verhaltensänderung an der Engine-Pfadauflösung, keine Umgehung oder Abschaltung von Clippy. Über GitHub-Quelldatei nachvollzogen. **Für diesen neuen Commit liegt noch kein erfolgreich abgeschlossener Testlauf vor.**

**Offene Abnahme:** Aktueller HEAD auf Ubuntu (Rust-Clippy/-Tests) und macOS erfolgreich ausführen; danach auf einem echten Intel-Mac Stockfish-Binary konfigurieren, einen Zug spielen, Rücknahme und Session-Wiederherstellung prüfen. Keine Veröffentlichung und keine Maia-2-Erweiterung bis zu dieser Bestätigung.

**Nächster einzelner Schritt:** CI-Ergebnis für Commit `a1f70ffc` auswerten und weitere konkrete Fehler beheben, falls vorhanden.

---

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

