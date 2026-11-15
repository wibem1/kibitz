# Kibitz DE 0.1.6 – Änderungs- und Prüfstatus

Stand: 15. November 2026. **0.1.6 ist der gemeinsame Versionsstand des Entwicklungszweigs, kein offizielles GitHub-Release.**

## Änderungen

- Die App stellt beim Neustart die zuletzt angezeigte Ansicht wieder her. Offline-Spiel, Datenbankansicht, zuletzt geöffnete Datenbankpartie, Zugposition und Brettausrichtung werden mit dem jeweils vorhandenen Sitzungs- und Autospeicher wieder geöffnet.
- Die Sitzung wird erst gespeichert, nachdem der alte Stand geladen wurde; so überschreibt der anfängliche Startbildschirm nicht mehr die gespeicherte Ansicht.
- Maia 2 nutzt die in Chess Studio erprobte Auswahl aus Wahrscheinlichkeitskandidaten: seltene Eröffnungszüge und unbegründete Figurenrückzüge werden vermieden; taktisch begründete Züge bleiben zulässig.
- Das kurz aufblitzende Windows-Konsolenfenster beim Enginezug wird unterdrückt.
- Produktname und Fenstertitel lauten auf macOS und Windows „Kibitz DE“.

## Versionsstand

Die fünf App-Manifeste sowie beide Cargo-Lockfiles verwenden gemeinsam **0.1.6**. Mac und Windows bleiben auf demselben Quellstand und derselben Nummer.

## Prüfstatus

- GitHub Actions CI **43725396953**: Versionsabgleich, Frontend, Rust, macOS-, Linux- und Windows-x64-Prüfungen sowie MSI-/NSIS-Paketprüfung erfolgreich.
- Windows-Testinstaller ohne mitgelieferte Maia-Ressourcen: Artefakt [14165209736](https://github.com/wibem1/kibitz/actions/runs/43725396953/artifacts/14165209736), befristet bis 22. November 2026.
- Windows-Vorschauinstaller mit eingebündelter Maia-Engine: Lauf [43725397008](https://github.com/wibem1/kibitz/actions/runs/43725397008) ist noch in Arbeit.
- Ein realer Windows-11-Installations- und Neustartdurchgang wurde noch nicht bestätigt.

Kein Git-Tag und kein offizielles Release erstellt.
