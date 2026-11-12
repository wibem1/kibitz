# Kibitz DE – Speichermanagement

Stand: 12.11.2026 · **Produktregeln verbindlich, Implementierung teilweise und noch nicht abgenommen**

## Grundsatz

**Datenbankkopie, lokale automatische Zwischensicherung, PGN-Datei und reiner Ansichts-/Navigationszustand sind unterschiedliche Speicherarten.** Die Oberfläche muss den Ort und die Bestätigung der Speicherung korrekt anzeigen. „Gesichert“ darf erst nach bestätigtem Erfolg des betreffenden Vorgangs erscheinen. Ein Download-Aufruf allein beweist nicht, dass die Datei wirklich auf der Festplatte liegt.

## Speicherarten und Lebensdauer

| Gegenstand | Speicherart | Dauerhaft? | Details |
| --- | --- | --- | --- |
| Übernommene Lichess-Partien, PGN-Dateien, TWIC/SCID | Geöffnete SQLite-Partiedatenbank | Ja, sofern Import bestätigt | Gespeicherte Partien, Quellen-/Provenienz-Einträge, indizierte Stellungen; Duplikate werden erkannt. |
| Gespeicherte Enginebewertungen, Kommentare | Zuordnung zur Datenbankpartie | Ja, gemäß vorhandenem Datenbankschema | Nur für passende Partie im geöffneten Datenbestand. |
| Normale laufende Offline-Partie | Webview `localStorage`, `kibitz.offlineGame.v1` | Lokale Wiederherstellung, **keine** verlässliche Datensicherung | Eine einzelne automatisch gespeicherte Partie; Verlust beim Löschen des Anwendungsspeichers möglich. |
| Übungsfortsetzung ab einer beliebigen Stellung | Aktuelle Spielansicht / Sitzungssnapshot | **Nein**, bis ausdrücklicher DB-Import oder PGN-Export | Originalpartie bleibt unverändert; Start-FEN und Fortsetzungszüge gehören zusammen. |
| „In Datenbank speichern“ | Aktive SQLite-Datenbank per vorhandenem PGN-Import | Ja, **nur nach bestätigtem Erfolg** | Kein stilles Öffnen/Erzeugen einer anderen Datenbank. Bei Fehler bleibt Partie/Übung geöffnet. |
| „PGN speichern“ | Benutzerdatei per Download | Erst nach tatsächlicher Ablage durch Betriebssystem/Browser | Meldung nur „Download angefordert“, nie „Datei sicher gespeichert“. |
| Spielansicht, zuletzt betrachteter Zug, Filter | Metadaten/Session in SQLite bzw. UI-Zustand | Nicht mit Partieinhalt verwechseln | `ui_session`, `last_game` und Filter sind keine Partiedatensicherung. |

## Verbindliche Abläufe

1. **Neue Partie spielen:** Laufende normale Offline-Partie wird lokal automatisch zwischengespeichert; die aktive Stellung und der Zugverlauf werden nie stillschweigend in eine Datenbank importiert. Ein eigenständiger Button speichert eine ausdrückliche Kopie in die geöffnete Datenbank. Alternativ PGN exportieren.
2. **Gesamte Partie von Analyse zur Spielseite:** Vor dem Wechsel eine explizite Nachfrage. Vorherige Player-Partie anzeigen; Optionen: Abbrechen, bisherige Partie als PGN exportieren, vorherige Partie in die geöffnete Datenbank sichern, bewusst ersetzen. Ein fehlgeschlagener Speicherversuch darf keine automatische Ersetzung auslösen; der Nutzer muss sie weiterhin aktiv bestätigen. Das Original in der Analyse-/Datenbankseite bleibt unangetastet.
3. **Übernommene Originalpartie auf Spielseite:** Vollständigen Hauptlinien-Zugverlauf aufbewahren, blättern, eine Stellung wählen und daraus getrennt gegen Stockfish weiterspielen. Aus einer Übung wird nicht durch stilles Zurücksetzen die Originalpartie verändert.
4. **Übungsfortsetzung speichern:** Durch ausdrücklichen Datenbankimport oder PGN-Export. Nicht-Startstellungen werden als PGN mit `SetUp=1` und `FEN` ausgegeben; aus dem Import ist die neue Datenbankpartie eigenständig. Der laufende Normalspielstand im alten `localStorage` wird bei übernommenen Partien nicht überschrieben.
5. **Nach der Speicherung weitere Züge spielen:** Aktueller Zugverlauf unterscheidet sich von der zuvor gespeicherten Fassung; die UI meldet für die neue Fassung wieder „nicht in der Datenbank bestätigt“. Erneutes Speichern ist eine neue explizite Aktion, keine automatische Änderung vorhandener Datenbankpartien.
6. **Import fehlgeschlagen / DB geschlossen:** Keine Erfolgsmeldung, keine automatische Neuanlage einer Datenbank, keine Löschung der aktuellen Partie. PGN-Export als Ausweichmöglichkeit nennen. Bereits vorhandene Datenbankkopien bleiben unberührt.
7. **Duplikate:** Das vorhandene Importmodul erkennt Duplikate. Die UI zeigt nicht „neu gespeichert“, sondern „bereits in Datenbank vorhanden“, wenn der Import keine neue Partie erzeugt hat.
8. **Backups:** SQLite-Dateien sind Nutzerdaten, für die eine Sicherung auf einen zweiten Speicherort nötig ist. Derzeit existiert im erweiterten Dialog **noch kein automatisches, überprüftes Backup**. Ein PGN-Export kann einzelne Partien übertragen, ersetzt aber kein Datenbank-Backup inklusive Analysen. Backups bei laufenden Datenbanktransaktionen dürfen nicht durch naives Kopieren eines offenen SQLite-Dateisatzes erfolgen; eine spätere Backupfunktion soll die SQLite-Backup-API oder `VACUUM INTO` mit verifiziertem Ziel verwenden.

## Geplanter dauerhafter Zielzustand (noch nicht vollständig implementiert)

- **Zentrales Partienarchiv** mit Herkunft (Lichess/Import/Eigenspiel/Übung), eindeutiger Partie-ID, Zeitstempeln und zugehörigen Analysen.
- **Mehrere wiederaufnehmbare Spielstände und Übungen**, statt nur ein `localStorage`-Slot. In Übungsdatensätzen Referenz zur ursprünglichen Partie-ID, gewählter Halbzug/Start-FEN, geänderte Fortsetzung und Titel.
- **Versionierung statt Überschreiben:** „Neue Kopie speichern“, „bestehende Fassung ersetzen“ nur mit ausdrücklicher Nachfrage; bei konkurrierenden Änderungen Konfliktmeldung.
- **Robuste Autosicherung** mit Wiederherstellung nach Absturz; Kennzeichnung `ungespeichert` / `lokal zwischengespeichert` / `in Datenbank gespeichert` / `Export angefordert` / `Speichern fehlgeschlagen`.
- **Backup und Wiederherstellung** mit Test des entstandenen Backups sowie wählbarem Ziel und Löschschutz.
- **Sichtbare Speicherinformationen** (welche Datenbankdatei, letztes bestätigtes Speichern, Kopie/Original, Herkunft). Keine Behauptung einer automatischen Datensicherung, bevor sie wirklich implementiert und getestet ist.

## Aktuelle Implementierungsstellen

- `app/src/OfflinePlayView.tsx`: lokaler Offline-Spielstand, Übernahme/Übungsfortsetzungen, PGN-Export und expliziter SQLite-Speicherknopf.
- `app/src/App.tsx`: Übergabe-Dialog, optionaler PGN-Export und optionales vorheriges Datenbankspeichern.
- `app/src/lib/offlineSession.ts`: normaler Offline-Autosave in lokalem Anwendungsspeicher.
- `app/src/lib/localPlay.ts`: regelkonforme Zugfolge, FEN-basierte Übung und PGN-Export.
- `app/src/lib/db.ts` → `app/src-tauri/src/dbops.rs:import_pgn_database` → `app/kibitz-db/src/import.rs:import_pgn`: derzeitige SQLite-Übernahme mit Duplikatbehandlung.

**Abnahme noch offen:** TypeScript-Build, Rust-/Vitest-Tests, echte DB-Speicherung und Wiederöffnung, Duplikate, geschlossene Datenbank, Abbruch, Backups. Insbesondere ist der bisherige PGN-Importer noch kein dediziertes, revisionssicheres System zur Verwaltung beliebig vieler Übungsfassungen. Ohne Tests keine neue Versionsfreigabe.
