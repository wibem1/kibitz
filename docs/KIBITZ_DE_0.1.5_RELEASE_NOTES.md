# Kibitz DE 0.1.5 – Änderungen und Freigabestatus

Stand: 13. November 2026. **Die Version ist in `main` integriert, aber noch kein offiziell veröffentlichtes GitHub-Release.**

## Neu in dieser Version

- Gesamte analysierte Partie einschließlich Hauptlinien-Zugliste auf die Spielseite übertragen.
- Vor-/Zurückblättern, Anfang/Ende anspringen und direkte Zugwahl; ab ausgewählter Stellung eine unabhängige Fortsetzung gegen Stockfish starten.
- Sicherheitsdialog vor Ersetzen einer bereits geöffneten Player-Partie, einschließlich ausdrücklich angebotener PGN-/Datenbanksicherung.
- Offline-Partien und Übungsfortsetzungen auf Wunsch per existierendem PGN-Importer in die geöffnete SQLite-Datenbank übertragen, mit Duplikat-/Fehleranzeige.
- Diagnoseereignisse für Datenbankspeicherung, PGN-Import und Partieübergabe; JSON-Export unter Einstellungen → Diagnose.
- Zugbezogene Partiefehler-/Schlüsselstellenübersicht, soweit bereits Bewertungen vorliegen.
- Benutzeroberflächenverbesserungen für deutsche Benutzerführung, Darstellung und Offline-Spiel.

## Prüfnachweise

- GitHub-CI zur Release-Branch-Version `0.1.5`: https://github.com/wibem1/kibitz/actions/runs/43220165590 — vier Jobs erfolgreich: App und Rust jeweils auf Linux und macOS.
- Intel-Mac-Build für Commit `10f1c9e3365d275fa1184ef25ecfa1f33c732d21`: https://github.com/wibem1/kibitz/actions/runs/43220165530 — Erfolg. Enthält erfolgreiche Schritte `Build and smoke-test bundled Maia 2 (Intel CPU)`, `Build unsigned Intel Mac DMG`, `Check Intel architecture and DMG exists`.
- Artefakt: `kibitz-de-intel-mac-unsigned-test`, GitHub-Actions-Artefakt-ID `13947120749`; **unsigniert, befristet, kein offizieller GitHub-Release-Download**.
- Übernahme über PR https://github.com/wibem1/kibitz/pull/2 in `main` mit Merge-Commit `3c8ac23bdb74d690e04164159e093ba69a73d0d6`.

## Bekannte Grenzen

- Noch kein vollständiger manueller Durchgang mit realer Benutzer-Datenbank und Engine auf dem Intel-Mac bestätigt.
- Eigenständige, eindeutig mit dem Original verknüpfte Übungsfassungen, verifizierte Backups sowie automatische Wiederherstellung mehrerer Übungspartien sind weiter geplant, nicht Bestandteil eines fertig getesteten Persistenzsystems.
- Die PGN-Exportanforderung belegt nicht, dass eine Datei auf der Festplatte angekommen ist.
- Updater/Signierung: Das Build-Artefakt ist unsigniert; kein verifizierter Update-Feed als Teil dieser Änderung.
- Vor einer breit empfohlenen Freigabe Abhängigkeitssicherheitswarnungen aus `npm ci` einzeln bewerten.

## Offener Release-Schritt

Das verbundene GitHub-Werkzeug kann PRs zusammenführen und GitHub-Actions-Artefakte prüfen, bietet jedoch keine Aktion zum Anlegen eines Git-Tags oder GitHub-Releases. Der Release wird deshalb **nicht** als erstellt behauptet. Für einen offiziellen Release eine geprüfte Variante von `v0.1.5` aus `main` taggen, die Release-Workflow-Prüfungen und erzeugten Installer prüfen und den GitHub-Release (gemäß `docs/RELEASING.md`) veröffentlichen. Dabei Website-Downloadlinks und alle erwarteten Zielplattformen prüfen.
