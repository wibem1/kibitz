# Kibitz DE – Entwicklungsanweisungen

1. Zu Beginn jedes Entwicklungsauftrags die zentralen Regeln aus [wibem1/AI-Development-Standards](https://github.com/wibem1/AI-Development-Standards) lesen: `DEVELOPMENT_STANDARDS.md` und `AGENTS.md`.
2. Anschließend `CLAUDE.md` (übernommene Upstream-Vorgaben), `PROJECT_STATE.md`, vorhandene TODO-Dateien und die jeweils betroffenen Quelldateien lesen. GitHub ist die verbindliche Quelle für den Entwicklungsstand.
3. Ziel dieses Forks: Kibitz mit deutscher Benutzerführung, wahlweise heller/dunkler Oberfläche, gut lesbarer Schrift und einfacher Standardnavigation. Den Schach-, Datenbank- und Rust-Kern nicht ohne konkreten Auftrag ändern.
4. Seltene Funktionen zuerst in einer erweiterten Navigation zugänglich halten, nicht Code oder gespeicherte Daten vorschnell entfernen. Bestehende Werkzeuge und Importpfade dürfen nicht kaputtgehen.
5. Original-Lizenzen und Attribution bewahren. `app/` unter GPL-3.0, die BSD-Crates getrennt halten, wie in `CLAUDE.md` beschrieben. Keine unauthorisierten Releases oder Builds.
6. Nach einer Änderung Tests dokumentieren und den Stand in `PROJECT_STATE.md` aktualisieren. Niemals einen statischen Test als vollständige Laufzeitabnahme ausgeben.
