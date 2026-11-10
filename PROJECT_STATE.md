# Kibitz DE – Entwicklungsstand (10. November 2026)

**Repository:** Fork von `avienu/kibitz` auf `wibem1/kibitz`; Originalcode und Lizenzen bleiben erhalten. Entwicklungsbranch: `feat/de-simple-readable-ui`, nicht in `main` gemergt, kein Release.

**Ziel:** Vereinfachte deutschsprachige Kibitz-Desktop-App mit größeren Schriften, hell/dunkel umschaltbarem Design und möglichst wenig Bedienballast; Engine und Datenbank bleiben unverändert.

**Implementiert:** `app/src/App.tsx` helles Thema als Voreinstellung für neue Installationen, vorhandene Nutzerwahl bleibt bestehen; deutsche Bildschirmtitel und deutscher Starttext. `app/src/lib/shell.ts` deutsche Hauptnavigation; `app/src/shell/NavRail.tsx` reduzierte Standardnavigation mit „Weitere Funktionen“ und Erhalt des aktuell aktiven Eintrags. `app/src/SettingsView.tsx` wichtige Darstellungsoptionen auf Deutsch. `app/src/app.css` größere Grundschrift, Hauptschaltflächen, Navigation und Fokuskennzeichnung.

**Prüfung:** 8 von 8 statischen Quelltextkontrollen bestanden. **Noch keine** TypeScript-/React-Tests, kein Tauri-Build und kein Laufzeittest auf macOS/Windows; kein installierbares Paket. Weitere Unterseiten und Hilfe sind weiterhin teils englisch. Bestehende große Layout- und Navigationstests müssen in einer Buildumgebung laufen. Keine KI-API- oder Engine-Kosten.

**Nächster Schritt:** `cd app && npm ci && npm test && npm run build`; anschließend echten macOS-/Windows-UI-Test (Darstellung, responsive Navigation, Settings) und weiter schrittweise übersetzen, ohne den Funktionsumfang zu erhöhen. Erst nach erfolgreicher Prüfung zur Übernahme in `main` entscheiden.
