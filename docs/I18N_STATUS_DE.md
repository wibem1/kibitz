# Kibitz DE – Übersetzungsstand und Abnahmekriterien

**Ziel:** Alle Benutzertexte sollen auf Deutsch erscheinen: Menüs, Dialoge, Tabellen, Hilfen, Werkzeughinweise, Fehler, Fortschrittsmeldungen, Training, Startbildschirm, Erklärungstexte und vorgeschlagene Züge. Keine Änderung von FEN/PGN/UCI/SAN/CLI-Syntax, Programmkennungen, Dateinamen oder externen Eigennamen.

## Bereits bearbeitet (nur Code, nicht automatisch vollständig abgenommen)

- Navigation und Statusbereich: `app/src/lib/shell.ts`, `shell/NavRail.tsx`, `shell/StatusStrip.tsx`.
- Startseite und Ersteinrichtung: `HomeView.tsx`.
- Partie und Zugliste: `GameView.tsx`, `MovesPanel.tsx`, `ExplainPanel.tsx`, `PromotionPicker.tsx`.
- Import und Verwaltung: `ImportView.tsx`, `JobsView.tsx`, `CrosstableView.tsx`.
- Eröffnungen/Stellungssuche: `OpeningTreeView.tsx`, `PositionSearchView.tsx`.
- Training: `TrainView.tsx`, `TacticsView.tsx` (weitere dynamische Texte in Hilfsdateien offen).
- Einstellungen: `SettingsView.tsx`, `UpdatesSettings.tsx`, `settings/EngineSection.tsx`, `settings/LichessSection.tsx`, `settings/StorageSection.tsx`.
- Einstieg und Hilfe: `FirstRunOverlay.tsx`, `lib/tour.ts`, `Help.tsx`; die Anwendung zeigt `docs/USER_GUIDE_DE.md`.

**Wichtige Einschränkung:** „Bearbeitet“ heißt nicht „vollständig übersetzt“ oder „vom Nutzer getestet“. Auch in den genannten Dateien können weitere Texte und dynamische Meldungen verblieben sein. Die neue deutsche Anleitung fasst die wichtigsten Abläufe zusammen; die wesentlich längere englische Originalanleitung bleibt technische Referenz und muss für eine vollständige Paritätsprüfung Abschnitt für Abschnitt abgeglichen werden.

## Noch systematisch zu prüfen und zu übersetzen

1. **Schach- und Analyseerklärungen:** Alle sieben Vorlagendateien `crates/kibitz-verbalize/templates/*.tmpl` (Englisch), mögliche in Rust zusammengesetzte Ausgaben und zugehörige Snapshot-/Verhaltenstests. Schlüssel und `{placeholder}` müssen unverändert bleiben; deutscher Satzbau braucht eigene Vorlagen statt Wort-für-Wort-Ersetzungen.
2. **Weitere große Ansichten:** `DatabaseScreen.tsx`, `ProfileView.tsx`, `PrepView.tsx`, `TriageView.tsx`, `OpeningLabView.tsx`, `EndgameView.tsx`, `PlayView.tsx`, `TwicView.tsx`, `SyncsView.tsx`.
3. **Dynamische Hilfstexte:** insbesondere `app/src/lib/{home,gameView,tacticsView,train,triage,profileView,engineSettings,treeView,search,net,lichessPlay}.ts` und die Anzeigedaten aus Rust.
4. **Hilfethemen und Fehlerfälle:** originale `docs/USER_GUIDE.md` gegen die neue deutsche Version auf fachliche Vollständigkeit prüfen. Fehler- und Statusmeldungen der nativen Schicht in der Oberfläche lokalisieren.
5. **Prüfung:** UI-Tests für alle Seiten sowie Stichproben mit importierter Partie, Schacherklärung, Trainingsaufgabe und Online-Zugang. Nur grüne CI reicht nicht für die Abnahme einer grafischen Anwendung.

## Wiederholbarer Übersetzungsaudit

`node scripts/i18n_audit.mjs` sammelt wahrscheinliche englische Benutzertexte nach Datei und Zeile. Das Verfahren ist absichtlich heuristisch: Es kann englische Texte übersehen oder technischen Code falsch markieren. Treffer müssen geprüft und echte Texte mit automatisierten Tests abgesichert werden.

## Freigabekriterien

- Keine englischen Oberflächen- und Hilfetexte in den genannten Funktionen; dynamisch erzeugte Erklärungen auch auf Deutsch.
- Alle Tests inklusive Rust-Vorlagenprüfung erfolgreich, keine Änderung der Schachlogik oder PGN/FEN-Schnittstellen.
- Im neuen Intel-Mac-Testpaket springt das Fenster beim Durchspielen nicht mehr (Nutzerabnahme).
- Die macOS-Test-DMG wird erst nach grünem aktuellem CI-Lauf einmal gezielt erstellt. Kein automatischer Release.
