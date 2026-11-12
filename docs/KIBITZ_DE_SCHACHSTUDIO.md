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

## 6. Verbindliches Zielbild: gemeinsames Analyse-Team Kibitz + Stockfish + KI (12.11.2026)

**Status: beschlossene Entwicklungszielsetzung, nicht implementiert oder abgenommen.** Diese Erweiterung konkretisiert Abschnitt 5; sie ersetzt weder die bestehende Offline-Kommentierung noch die grundsätzlichen Architektur- und Lizenzvorgaben in `CLAUDE.md`. Die ursprüngliche LLM-Idee (FeatureRecord sprachlich wiedergeben) reicht für dieses Ziel nicht aus.

### Rollen und Zusammenarbeit

- **Kibitz-Core – strategischer Spezialist:** Liefert nachvollziehbare Stellungsmerkmale, taktische Warnungen, Plankandidaten und ihre Voraussetzungen. Eine erkannte Schwäche ist noch kein nachgewiesener strategischer Vorteil.
- **Stockfish – rechnerischer Prüfer:** Liefert konkrete Varianten, Bewertungen und taktische Einwände. Auf Anfrage prüft es außerdem die Folgen gezielter strategischer Hypothesen; eine Enginezahl ist nicht automatisch eine vollständige strategische Erklärung.
- **Sprachmodell – Analysepartner und Erklärer:** Vergleicht beide Erkenntnisquellen, benennt Widersprüche und Unsicherheiten, priorisiert die wenigen entscheidenden Stellungsfaktoren und formuliert verständliche, dialogfähige Erklärungen. Es darf Rückfragen zur strategischen Erkennung oder weitere begrenzte Engine-Prüfungen vorschlagen, aber keine unbelegten Berechnungsergebnisse behaupten.
- **Nutzer – aktiver vierter Teilnehmer:** Kann eigene Pläne vorschlagen, widersprechen, nachfragen und eine gezielte Überprüfung verlangen. Der Dialog bezieht Stellung, Partieverlauf, Spielerfarbe und aktuell betrachtete Variante ein.

### Geplanter Ablauf

1. Kontext für die aktuelle Stellung konsistent erfassen: FEN, Zugfolge, Partie/Variante, Analysemodus und vorhandene gespeicherte Befunde.
2. Kibitz erstellt einen strukturierten strategischen Befund mit möglichen Plänen; Stockfish liefert auf Anforderung konkrete Bewertungs- und Varianteninformationen. Die Herkunft aller Aussagen wird getrennt festgehalten.
3. Eine **kontrollierte Koordinationsschicht im GPL-App-Layer** vergleicht die Befunde. Bei Widersprüchen oder strategisch wichtigen offenen Fragen kann das Sprachmodell eng umrissene Analyseaufträge **vorschlagen**; die Koordinationsschicht prüft deren Zulässigkeit und startet sie über die vorhandene Engine-Verwaltung und Job-Warteschlange.
4. Eine begrenzte Zahl von Prüfschritten liefert neue Belege; FEN und Variantenkontext müssen zu jedem Ergebnis passen. Kein unbegrenztes rekursives Nachrechnen, keine überflüssigen oder kostenpflichtigen Hintergrundaufrufe.
5. Die Kommentierung erläutert **Gesamturteil, entscheidenden Faktor, wichtigsten Plan, kritische Gegenmöglichkeit und Beleg/Unsicherheit**, statt lediglich möglichst viele Merkmale aufzuzählen. Folgefragen können neue gezielte Prüfungen auslösen.

### Verlässlichkeit, Bedienung und Grenzen

- Aussagen werden kenntlich gemacht als **konkret belegt**, **strategisch gut begründet** oder **ungeprüfte Hypothese**. Bei fehlender Datenlage, Engine-Fehlern oder widersprüchlichen Ergebnissen keine scheinbare Gewissheit vortäuschen.
- Zug- und Variantenangaben auf Legalität, Stellungskontext und tatsächliche Engine-Ausgaben prüfen. Die KI darf keine Stockfish-Züge, Bewertungswerte oder Stellungsbefunde erfinden. Unsichere KI-Ausgabe abweisen oder auf nachvollziehbare bestehende Textbausteine zurückfallen.
- Die bisherige Architektur bleibt maßgeblich: `crates/*` BSD-3-Clause ohne GPL-Abhängigkeiten; externe Modellzugriffe und Koordination im dafür geeigneten App-Layer; Stockfish standardmäßig **aus**, nur bei ausdrücklich angeforderter Analyse beziehungsweise den bereits vorgesehenen begrenzten taktischen Prüfauslösern.
- Online-Fair-Play ist zwingend: **Keine positionsbezogene KI-Beratung, Engineanalyse, Zugempfehlungen oder Umgehung der Sperre während laufender Mensch-gegen-Mensch-Partien auf Lichess.** Erst nach Partieende freischalten.
- Offline-Schach und bisherige regelbasierte Erklärungen bleiben ohne API-Schlüssel nutzbar. Externe Modellanbieter nur nach ausdrücklicher Nutzeraktion; Modell-/Anbieterauswahl, Kosten- und Zeitlimits, nachvollziehbare Statusmeldungen sowie Diagnoseexport vorsehen.
- Maia 2 bleibt zunächst separater menschlich orientierter **Gegenspieler**; seine Zugwahrscheinlichkeiten dürfen nicht mit Stockfish-Bewertungen verwechselt werden. Eine spätere Einbindung in die Analyse bedarf eines eigenen geprüften Schritts.

### Entwicklungsreihenfolge und Abnahme

1. Zuerst vorhandene Stockfish-Anzeige, Live-Analyse, Einmalbewertung und Maia-2-Installation auf echtem Intel-Mac abnehmen; Übersetzung und offene Basisfehler absichern. **Kein KI-Ausbau auf unbestätigter Engine-Anbindung.**
2. Kleine Teststellungssammlung mit strategisch anspruchsvollen Fällen aufbauen: bekannte Meisterkommentare als unabhängige Referenz, taktische Gegenbeispiele, unklare Stellungen und bewusst widersprüchliche Kibitz-/Engine-Befunde. Urheberrecht der Quellen beachten.
3. Strukturierte Belege und begrenzte Koordinationsaufträge zunächst **ohne Sprachmodell** testen: FEN-/Variantenbindung, unabhängige Engine-Prozesse, Zeit-/Knotenbudgets, Rückmeldung bei fehlenden Ergebnissen.
4. KI zunächst zur priorisierten **Kommentierung geprüfter Befunde** einsetzen; danach kontrollierte Rückfragen, strategische Hypothesen und gezielte Nachprüfung ergänzen.
5. Freien deutschen Dialog mit Brettkontext, Fehlerszenarien, Budgetkontrolle, Diagnose und zwingendem Fair-Play-Schutz testen.
6. Abnahmekriterien: entscheidenden Stellungsfaktor im Testkorpus nachvollziehbar priorisieren; konkrete Varianten legal und nachweisbar; Widerspruch von Strategie und Taktik offenlegen und wenn möglich überprüfen; keine erfundenen Enginebelege; verständliche Unsicherheitsangaben; kein Analysezugriff in aktiven Online-Partien; keine Regression im Offline-Betrieb.

**Leitidee:** *Kibitz erkennt strategische Fragen, Stockfish prüft konkrete Möglichkeiten, die KI organisiert eine überprüfbare Synthese und diskutiert mit dem Nutzer.* Die Rollen sind ein anschauliches Konzept, keine Garantie schachlicher Richtigkeit.

## 7. Produktvision: Kibitz-Oberfläche mit erweitertem Chess-Studio-Funktionsumfang (12.11.2026)

**Beschlossene Ausrichtung, noch nicht als Funktionsumfang implementiert oder abgenommen.** **Die bestehende Kibitz-Benutzeroberfläche bleibt das maßgebliche Interface und bildet die visuelle sowie strukturelle Grundlage der Desktop-App.** Chess Studio ist die **funktionale Referenz** für dialogorientiertes Lernen und Spielen, ausdrücklich **keine Design- oder Layoutvorlage**. Kibitz DE erweitert die bestehende Kibitz-Anwendung um geeignete Chess-Studio-Funktionen; vorhandene Datenbank-, Trainings-, Erklärungs- und Engine-Fähigkeiten und ihre Bedienwege bleiben erhalten. Weiterarbeit im vorhandenen Repository `wibem1/kibitz`, keine automatische Verschmelzung der Quellcodebasen.

### Hauptarbeitsbereiche und Bedienprinzip

- **Spielen:** lokales Mensch–Mensch, Mensch–Stockfish, Mensch–Maia 2; zusätzlich **KI gegen Stockfish** als ausdrücklich gestarteter, jederzeit stoppbarer *lokaler* Experimentier- und Lernmodus. Start auch aus einer frei gewählten legalen Stellung; Zugfolge live auf dem Brett, PGN speichern und zur Analyse übernehmen. KI-Zugvorschläge müssen durch die Schachregeln validiert werden, Engine-Aufträge technisch getrennt laufen. KI kann Züge/Absichten erläutern; keine Behauptung menschlicher oder enginegleicher Spielstärke.
- **Lernen und Analysieren:** großes, ruhiges Brett mit unmittelbar erreichbarem Chat und Stockfish-Bewertung; freier kontextbewusster deutscher Dialog; Vor-/Zurück-/Anfang-Navigation; durch KI und Analyse identifizierte **Schlüsselstellungen** mit anspringbaren Markierungen und gespeicherten Erklärungen; sichtbare Pfeile und Felder für strategische Pläne; eigene Varianten spielen und vergleichen. Die Analyse erfolgt nach dem vereinbarten Teammodell aus Abschnitt 6.
- **Partien und Datenbanken:** PGN-Import fremder und eigener Partien, vorhandene Kibitz-Datenbankfunktionen, Partieauswahl, Speichern von Analyse, Kommentaren, Schlüsselstellen und Varianten pro Partie; Lichess-Import und Online-Spiel unter den Fair-Play-Sperren aus Abschnitt 3.
- **Einstellungen und Diagnose:** klar getrennte Bereiche für Modell-/Anbieterwahl und API-Zugang, aktive Modell-/Verbindungsanzeige, freie dauerhafte KI-Anweisungen, Kosten-/Zeitlimits, Verbindungstest und exportierbare Diagnose; keine überflüssigen Einstellungen im Standardbildschirm.

### Leitlinien für die Übernahme aus Chess Studio

1. **Funktional übernehmen, nicht blind kopieren:** den aktuellen Quellstand und die Funktion jeder Chess-Studio-Komponente erst am tatsächlichen Repository beziehungsweise reproduzierbaren Artefakt prüfen. Das derzeit abrufbare `wibem1/AI-Chess-Studio/PROJECT_STATE.md` ist vom 04.11.2026 und belegt spätere Funktionen nicht. Wo Quellcode nicht verifiziert werden kann, Anforderungen beschreiben und Kibitz-konform neu implementieren, statt Wiederverwendung zu behaupten.
2. **Kibitz-Interface beibehalten; Desktop zuerst:** Bestehende Kibitz-Navigation, Grundlayout, Brettdarstellung und visuelle Identität nicht durch Chess-Studio-Design ersetzen. Neue Funktionen als passende, sparsame Ergänzungen in die vorhandenen Ansichten und Bedienelemente integrieren; sinnvolle Anordnung des Chats und der Analysewerte innerhalb dieses Interfaces erproben. Intel-macOS als erster realer Abnahmerechner; andere Plattformen berücksichtigen. Durchgehend Deutsch, gut lesbare Schrift, keine springenden Bereiche bei Engine-/KI-Statuswechseln.
3. **Eine Funktion – ein geprüfter Entwicklungsschritt:** bestehende Kibitz-Funktionen wiederverwenden, Doppelimplementierungen vermeiden, keine Regression der Offline-/Datenbankfunktionen; anschließende Tests auf realem Gerät. Neue Features erhalten keine voreilige Release-Freigabe.
4. **Kibitz statt Neu-Design:** Spielen, Lernen/Analysieren und Partien/Datenbanken sind funktionale Orientierung, **keine Vorgabe für eine neue dreiteilige Hauptnavigation**. Die bestehende Kibitz-Navigation und Arbeitsoberfläche bleiben erhalten; seltene Profiwerkzeuge bleiben erreichbar. Chat und Brett sollen innerhalb des vorhandenen Layouts sinnvoll gemeinsam sichtbar sein.
5. **Sicherheit und Fair Play:** KI gegen Stockfish ausschließlich lokal bzw. in einer ausdrücklich erlaubten abgeschlossenen Testsituation; niemals KI-Zugberatung für eine laufende Lichess-Partie gegen einen Menschen. API-Anfragen nur auf ausdrückliche Nutzeraktion; nachvollziehbare Kosten, Fehler und Diagnose.
6. **Priorisierung:** erst aktuelle Stockfish-/Maia-Lauffähigkeit und deutsche Oberfläche abnehmen; dann gemeinsamer Analyse- und Chatkontext; anschließend KI gegen Stockfish, Schlüsselstellungen, Markierungen, Varianten- und Speicherfunktionen in kleinen nachweisbaren Schritten. Die Reihenfolge einzelner Teilfunktionen ist bei nachgewiesenen technischen Abhängigkeiten anpassbar.

**Produktformel:** *Die Kibitz-Desktop-App behält ihr eigenes Interface und gewinnt die dialogorientierten Lern-, Spiel- und Analysefunktionen von Chess Studio hinzu. Kibitz, Stockfish und KI bilden das gemeinsame Analyse-Team.*

## 8. Windows als verbindliche zweite Desktop-Zielplattform (12.11.2026)

**Status: beschlossene Plattformanforderung, noch keine bestätigte lauffähige Windows-Freigabe.** Kibitz DE soll **nativ auf Windows 11 (x64)** und macOS nutzbar sein. Die Kibitz-Oberfläche, die deutschen Texte und die Kernfunktionen müssen auf beiden Plattformen funktional gleichwertig bleiben; kein separates Windows-Produkt und keine abweichende Bedienphilosophie.

### Technische Anforderungen

- Bestehenden plattformübergreifenden Stack (Rust/Tauri 2, React/TypeScript) beibehalten; Windows-spezifische Pfade, UCI-Prozessaufrufe, Berechtigungen, Abhängigkeiten und Ressourcen explizit prüfen.
- Eigenständige, installierbare Windows-Pakete über einen **geprüften Windows-x64-Build** bereitstellen (bevorzugt Tauri-Installer MSI oder NSIS, anhand vorhandener CI-/Packaging-Konfiguration entscheiden). Keine bloße ZIP-Datei als Nachweis einer fertigen Installation.
- Stockfish und Maia 2 als getrennte Engine-Optionen auch unter Windows: ausführbare x64-Binaries, ggf. Maia/ONNX-Runtime-Abhängigkeiten, korrekte Pfadauflösung, UCI-Handshake, Bewertung beziehungsweise legalen Zug und sauberes Beenden nachweisen. Keinesfalls macOS-Binaries in Windows-Pakete übernehmen.
- Funktionsgleichheit einschließlich Offline-Partien, PGN-Import/-Export, Datenbankverwaltung, späterem KI-Dialog, KI gegen Stockfish, Schlüsselstellungen, Varianten, Modell-/Anbietereinstellungen, Diagnose und Fair-Play-Sperre.
- Windows-typische Bedienung prüfen: skalierbares Fenster, hochauflösende Anzeige/DPI, Schriftgrößen, Dateidialoge, Tastatur, Pfade und Speichern/Öffnen; stabile Platzierung von Brett, Status und Analysefeldern ohne Springen.
- Keine neuen Windows-spezifischen Lizenz- oder Geheimnisprobleme: Drittanbieter-Lizenzen, API-Schlüssel und gebündelte Engine-Ressourcen auf beiden Plattformen kontrollieren.

### Umsetzung und Abnahme

1. Bestehenden Build- und Installationsweg für Windows im Repository feststellen; fehlende plattformspezifische Anpassungen und Abhängigkeiten dokumentieren, ohne die Mac-Abnahme zu überspringen.
2. Windows-x64-CI mit deterministischem Build, statischen Prüfungen und Paket-/Ressourcenkontrolle einrichten beziehungsweise vorhandenen Weg gezielt verbessern; keine vorschnelle Release-Bezeichnung.
3. Installierbares Paket auf einem **realen Windows-11-x64-Rechner** starten und die Kernabläufe testen: Brett, lokale Spiele, Stockfish-Analyse, Maia-Zug, PGN-Rundreise, Datenbank, Einstellungen, Diagnose sowie UI-Verhalten.
4. Neue Chess-Studio-Funktionen bei jeder späteren Erweiterung auch unter Windows absichern. Eine grüne CI allein gilt nicht als Nutzerabnahme.

**Reihenfolge:** Intel-macOS bleibt erster aktueller Diagnoserechner. **Windows 11 x64 ist jedoch gleichberechtigtes verbindliches Auslieferungsziel** und soll nicht erst als unverbindliche ferne Portierungsoption betrachtet werden.

## 9. Einstellungen aufräumen und verständlich strukturieren (12.11.2026)

**Status: aus aktuellem Branch-Quellcode abgeleiteter UI-Verbesserungsbedarf; Umsetzung und Bedienabnahme stehen aus.** Das Kibitz-Interface bleibt erhalten. Das Ziel ist keine neue Oberfläche, sondern eine reduzierte, selbsterklärende Einstellungsseite mit konsequent deutscher Sprache.

### Festgestellte Probleme im aktuellen Code

- `app/src/SettingsView.tsx` vermischt echte Einstellungen mit **ausführenden Datenbankaktionen** (»Datenbank erläutern«, »Partien neu bewerten«), Konten-Synchronisation, Endspielstatus und wiederkehrendem Schachtermin.
- Nicht veränderbare beziehungsweise nicht in der Oberfläche nutzbare Einträge wie »Engine-Start« (Produktregel), »Figurensatz« (fest vorgegeben) und »LLM verbaliser« (CLI-/Umgebungsvariable, kein Dialog zur KI-Konfiguration) wirken wie einstellbare Funktionen.
- Teilweise englische Schaltflächen und Meldungen (u. a. »Switch to Coach«, »Estimate & run«, »TWIC auto-download«, »Save/Clear«, Dialogtexte). Weitere Teilmodule `settings/EngineSection.tsx`, `settings/LichessSection.tsx`, `settings/StorageSection.tsx` und `UpdatesSettings.tsx` benötigen gemeinsame Begriffe.
- Die Endspieldatenbank erscheint im Bereich Engineverwaltung und erneut als Daten-Status; technische Pfade/Umgebungsvariablen werden ohne Einordnung gezeigt.

### Zielstruktur innerhalb der vorhandenen Kibitz-Oberfläche

1. **Darstellung:** Hell/Dunkel, Brettansicht, Kommentar-Anzeige, später sinnvoll veränderbare Schriftgröße. Fest vorgegebene Figurensätze nicht als Einstellung anbieten.
2. **Schachengines und Analyse:** Stockfish-Pfad und Verbindungstest, Rechenlimit sowie bei Bedarf Syzygy-Pfad. Maia-2-Auswahl/-Pfad konsistent mit den Offline-Spieloptionen. Engine-Startregel als kurze Erklärung, nicht als Pseudoeinstellung.
3. **KI und Modelle (erst bei realer Implementierung):** Anbieter/Modell und Status separat von Zugangsdaten; nutzereigene Schlüssel, allgemeine KI-Anweisungen, begrenzte Kosten/Diagnose. Den bisherigen CLI-only-»LLM verbaliser« nicht als funktionsfähige Modellwahl darstellen.
4. **Konten und Online-Spiel:** Lichess-Zugang in verständlicher Sprache; Synchronisation anderer Konten möglichst über den bereits vorhandenen separaten Synchronisationsbildschirm.
5. **Daten und Speicher:** Speicherort, Sicherung/Migration, ggf. Updates. Umfangreiche Stapelanalysen in die Datenbankansicht beziehungsweise einen dort vorhandenen Aktionsbereich verlegen – mit Kostenschätzung, Bestätigung und Fortschrittsanzeige.
6. **Erweiterte Optionen / Diagnose:** Syzygy-/Netz-/Update-Details und Diagnose dort, wo sie gebraucht werden; seltene technische Informationen nachgeordnet. Einen Schachtermin in eine passende Startseiten-/Planungsfunktion verschieben, wenn diese existiert.

### Verbindliche Umsetzungsregeln

- **Kein Funktionsverlust:** zuerst bestehende Funktion, Speicherort und Aufrufweg prüfen; lediglich versetzen/vereinfachen und vorhandene Speicherwerte bewahren. Keine Datenbankaktionen ersatzlos löschen.
- **Kleine Schritte:** zuerst tatsächliche Einstellungen, reine Statusanzeigen und Aktionen inventarisieren; danach missverständliche Zeilen und englische Texte bereinigen; erst anschließend einzelne Aktionen an passende Orte versetzen.
- **Tests:** bestehende Einstellungen müssen Neustarts überstehen; insbesondere Stockfish-Pfad, Maia-Konfiguration, Syzygy, Lichess-Zugang, Datenbankort, Themes und Updates. Keine unbeabsichtigten Engine-Starts oder Batchaktionen; echte Bedienabnahme auf Intel-macOS und später Windows 11.
- **Keine Vorab-Funktionen vortäuschen:** nicht implementierte KI-Einstellungen bis zur echten Anbindung nicht als bedienbar anzeigen.

**Leitlinie:** *Nur echte Einstellungen gehören in die Einstellungen. Aktionen gehören dorthin, wo man sie benötigt. Technische Statusangaben erscheinen bei Bedarf.*

### Umsetzungsstand der Einstellungsbereinigung (12.11.2026)

**Im Entwicklungsbranch implementiert, noch nicht durch vollständige CI und reale Desktop-Bedienabnahme bestätigt:**

- Die Pseudoeinstellungen »Engine-Start«, »LLM verbaliser« und »Figurensatz« sowie doppelte Statusanzeigen sind aus der Einstellungsansicht entfernt. Vorhandene Engine-/Syzygy-Konfiguration bleibt erhalten.
- »Datenbank erläutern« und »Partien neu bewerten« sind nicht mehr doppelt in den Einstellungen zu sehen: ihre tatsächlich vorhandenen Ausführungen mit Bestätigung, Fortschritt und Pause sind ausschließlich im Datenbankbereich. Bedienelemente und Auftragsdialoge dort wurden auf Deutsch gebracht.
- Die TWIC-Automatik wird ausschließlich im TWIC-Bereich bedient; die bisher redundante Einstellung ist entfernt. Das bestehende gespeicherte Flag und seine Funktion werden nicht verändert.
- Der optionale Schachtermin lässt sich statt über die Einstellungen über »Schachtermin bearbeiten« auf der Startseite bearbeiten; vorhandene Daten bleiben erhalten.
- Einstellungen sind neu sortiert: Darstellung → Trainer → Engineverwaltung → Lichess → Daten/Speicher → Aktualisierungen → Diagnose. Einzelne restliche technische Bezeichnungen in anderen Ansichten sind gesondert über die Gesamtübersetzungsprüfung abzudecken.

**Abnahmegrenze:** Die Änderung ist im Quellcode gesichert. Ein TypeScript-/Build-Erfolg und das Verhalten des Termineditors auf macOS/Windows sind bislang nicht belegt; keine Versionsfreigabe. Insbesondere prüfen: TWIC-Automatik nach Neustart, Termin speichern/entfernen und Anzeige auf Home, Datenbank-Aufträge start-/pausierbar, Enginepfad/Syzygy/Lichess und Darstellungsoptionen unverändert.
