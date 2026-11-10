# Kibitz DE – Zielbild Schachstudio (10.11.2026)

Status: **beschlossene Anforderungen, noch nicht implementiert**. Fortführung des vorhandenen Forks, kein neues Repository. Nicht als Abnahme oder Release interpretieren.

## 1. Vollständig Deutsch
- Sämtliche Navigation, Formulare, Dialoge, Hinweise, Status- und Fehlertexte, Trainingsansichten, Hilfe und automatisch generierten Schacherklärungen auf Deutsch.
- Technische Standardsymbole (FEN, PGN, UCI, SAN), Eigennamen und externe Datenformate nicht übersetzen.
- Laufende Arbeit in `docs/I18N_STATUS_DE.md`; Rust-Erklärungstemplates und dynamische Textbausteine ausdrücklich prüfen. Automatisierte Textsuche plus manuelle Sichtkontrolle.

## 2. Offline spielen
- Im selben Brettmodus wählbar: gegen Menschen am Gerät, gegen Stockfish, gegen Maia 2. Eigene Farbe, Startstellung/FEN, Schwierigkeitsgrad (modellgerecht), Zugrücknahme und Speichern/Übernahme als PGN.
- Stockfish: vorhandene UCI-Infrastruktur weiterverwenden, aber Spielzüge von Analyse-Jobs sauber isolieren. Bereits vorhandene Analyse ist **nicht** gleichbedeutend mit implementiertem Spielmodus.
- Offline heißt: während der Partie keine Verbindung notwendig. Bei Maia kann eine einmalige Installation der Engine/Modelldateien erforderlich sein.

## 3. Online spielen mit Lichess
- Bestehenden `PlayView.tsx`, `lib/lichessPlay.ts` und Rust-Board-API-Client erhalten und vollständig übersetzen.
- Vorhanden im Code: persönlicher Zugangstoken, Suche nach Gegnern, Züge über das Brett, laufende Partien, Zeitkontrollen, Aufgabe/Remis, Import abgeschlossener Partien. Nutzung mit realem Lichess-Konto noch durch Nutzer zu bestätigen.
- Ergänzungsziel: leicht verständliche Anmeldung (nach technischer Prüfung OAuth PKCE statt manueller Token-Eingabe), direkte Herausforderungen an bestimmte menschliche Gegner, eingehende Einladungen und klare Fehlermeldungen. Bestehenden Code auf tatsächliche Unterstützung prüfen, nicht doppelt implementieren.
- **Fair Play:** In laufenden Partien gegen Menschen keinerlei Engine-Analyse, KI-Beratung, Zugvorschläge oder erklärende Hilfen. Das gilt auch für den KI-Chat. Nach Partieende Analyse freischalten. Lichess Board API bei normaler Gegnersuche nur Rapid, Klassisch, Fernschach; Blitz ist gemäß aktueller API bei direkten Herausforderungen möglich. Keine Zusage für Bullet.
- Referenz: https://lichess-org.github.io/api/ und https://lichess.org/page/fair-play

## 4. Maia 2
- Primär Maia-2-kompatible **lokale UCI-Engine**, etwa https://github.com/ChessWaveIO/maia2-uci; frei wählbarer Pfad, Erkennung per UCI-Handshake, CPU ohne leistungsfähige GPU bevorzugt, Elo-Level von Maia korrekt und nicht als garantierte Spielstärke darstellen.
- Maia 2 sagt menschlich wahrscheinliche Züge voraus; ihre Wahrscheinlichkeiten sind nicht Stockfish-Bewertungen. Nachfragen zu einer Stellung durch KI dürfen beides unterscheiden.
- Vor Integration Intel-macOS-Kompatibilität, Speicherbedarf, Laufzeiten, gebündelte Modelle und Lizenzen prüfen; keine ungetestete Download-Automatik. Maia 3 wurde inzwischen offiziell als Nachfolger veröffentlicht; spätere optionale Engine prüfen, **Maia 2 bleibt ausdrücklich Bestandteil dieses Auftrags**.
- BSD/GPL-Schichtgrenzen und Third-Party-Notices nach `CLAUDE.md` wahren.

## 5. Freie KI-Diskussion (Vorbild Chess Studio)
- Dialogfeld unter/neben dem Schachbrett, frei formulierbare deutsche Fragen, zusammenhängender Verlauf, Bezug zu aktueller FEN, Partiezügen, aktiver Variante und Spielerfarbe.
- Nach Aufforderung Stellung, Pläne, menschlich typische Fehler, Kandidaten und Varianten erläutern; auf Wunsch Pfeile/Markierungen am Brett, navigierbare Schlüsselstellungen.
- Einstellbare Anbieter/Modelle mit nutzereigenen Zugangsdaten, Kostenbewusstsein, verständliche Status-/Fehlermeldungen und diagnostischer Export. Vorhandene Kibitz-Erklärungen und Stockfish-Ergebnisse strukturiert bereitstellen, aber keine erfundenen Engine-Analysen.
- Offline-Kern und nicht-KI-Funktionen müssen ohne API-Key vollständig nutzbar bleiben. Chat nur auf Anfrage extern, keine kostenpflichtigen Aufrufe im Hintergrund.
- Während *jeder laufenden Lichess-Mensch-gegen-Mensch-Partie* KI-Dialog mit positionsbezogener Unterstützung deaktivieren. Klare getrennte Modi »Spielen« und »Lernen/Analysieren«.

## Priorisierte Umsetzung, jeweils ein geprüfter Schritt
1. Aktuelle CI- und Intel-Mac-Fensterkorrektur abnehmen; laufende Übersetzung konsistent abschließen.
2. Bereits vorhandenen Lichess-Spielmodus vollständig deutsch und bedienbar machen, mit klarer Kontoverbindung; Test mit echtem Account nur durch Nutzer.
3. Eigenständiger lokaler Spielmodus zunächst Mensch–Mensch / Stockfish, inkl. Speichern und Regressionstests.
4. Maia-2-UCI als optionalen Gegenspieler mit CPU-Test integrieren.
5. Freien KI-Dialog mit kontextgenauem Datenpaket und strikter Fair-Play-Sperre integrieren.
6. Direkte Lichess-Herausforderungen, Einladungen, UI-Feinschliff und vollständigen Übersetzungs-/Regressionsaudit abschließen.

## Technische Nachweise / Abnahme
- Jede Änderung separat in Branch/PR, Tests dokumentieren; keine neuen Versionsnummern oder Releases ohne grüne Tests und echte App-Prüfung.
- Offline: Partie ohne Netz, Engine-Wechsel, Mensch–Mensch, PGN-Rundreise.
- Lichess: Login, Partiestart mit Mensch, Zugübertragung, Wiederverbinden, Speicherung; keinerlei Hilfen bei aktiver Partie.
- Maia: UCI-Handshake, legaler Zug, Elo-Steuerung und akzeptable Laufzeit auf Ziel-Mac.
- KI: freie Fragen inklusive Kontextwechsel, Antwort-/API-Fehler, Pfeile und Schlüsselstellungen, Fair-Play-Sperre.
- Deutsch: alle Screens und Vorlagen einschließlich Grenzfällen, kein fälschlich lokalisierter SAN/PGN-Standard.
