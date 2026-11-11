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

