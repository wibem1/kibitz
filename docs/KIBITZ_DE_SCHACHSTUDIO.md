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

## 7. Produktvision: Kibitz DE als erweitertes Chess Studio für den Desktop (12.11.2026)

**Beschlossene Ausrichtung, noch nicht als Funktionsumfang implementiert oder abgenommen.** Der Benutzer soll Kibitz DE primär als **Weiterentwicklung der dialogorientierten Chess-Studio-Desktop-App** erleben, nicht als bloß übersetzten Kibitz-Datenbankclient. Die erprobten Lern- und Bedienideen von Chess Studio sind die Produktreferenz; Kibitz steuert seine vorhandenen Datenbank-, Trainings-, Erklärungs- und Engine-Fähigkeiten bei. Weiterarbeit im vorhandenen Repository `wibem1/kibitz`, keine automatische Verschmelzung der Quellcodebasen.

### Hauptarbeitsbereiche und Bedienprinzip

- **Spielen:** lokales Mensch–Mensch, Mensch–Stockfish, Mensch–Maia 2; zusätzlich **KI gegen Stockfish** als ausdrücklich gestarteter, jederzeit stoppbarer *lokaler* Experimentier- und Lernmodus. Start auch aus einer frei gewählten legalen Stellung; Zugfolge live auf dem Brett, PGN speichern und zur Analyse übernehmen. KI-Zugvorschläge müssen durch die Schachregeln validiert werden, Engine-Aufträge technisch getrennt laufen. KI kann Züge/Absichten erläutern; keine Behauptung menschlicher oder enginegleicher Spielstärke.
- **Lernen und Analysieren:** großes, ruhiges Brett mit unmittelbar erreichbarem Chat und Stockfish-Bewertung; freier kontextbewusster deutscher Dialog; Vor-/Zurück-/Anfang-Navigation; durch KI und Analyse identifizierte **Schlüsselstellungen** mit anspringbaren Markierungen und gespeicherten Erklärungen; sichtbare Pfeile und Felder für strategische Pläne; eigene Varianten spielen und vergleichen. Die Analyse erfolgt nach dem vereinbarten Teammodell aus Abschnitt 6.
- **Partien und Datenbanken:** PGN-Import fremder und eigener Partien, vorhandene Kibitz-Datenbankfunktionen, Partieauswahl, Speichern von Analyse, Kommentaren, Schlüsselstellen und Varianten pro Partie; Lichess-Import und Online-Spiel unter den Fair-Play-Sperren aus Abschnitt 3.
- **Einstellungen und Diagnose:** klar getrennte Bereiche für Modell-/Anbieterwahl und API-Zugang, aktive Modell-/Verbindungsanzeige, freie dauerhafte KI-Anweisungen, Kosten-/Zeitlimits, Verbindungstest und exportierbare Diagnose; keine überflüssigen Einstellungen im Standardbildschirm.

### Leitlinien für die Übernahme aus Chess Studio

1. **Funktional übernehmen, nicht blind kopieren:** den aktuellen Quellstand und die Funktion jeder Chess-Studio-Komponente erst am tatsächlichen Repository beziehungsweise reproduzierbaren Artefakt prüfen. Das derzeit abrufbare `wibem1/AI-Chess-Studio/PROJECT_STATE.md` ist vom 04.11.2026 und belegt spätere Funktionen nicht. Wo Quellcode nicht verifiziert werden kann, Anforderungen beschreiben und Kibitz-konform neu implementieren, statt Wiederverwendung zu behaupten.
2. **Desktop zuerst:** Intel-macOS als erster realer Abnahmerechner; andere Plattformen weiterhin berücksichtigen. Eine durchgängige, übersichtliche deutsche Oberfläche mit gut lesbarer Schrift; keine springenden Bereiche bei Engine-/KI-Statuswechseln, kein unnötiger Bedienballast.
3. **Eine Funktion – ein geprüfter Entwicklungsschritt:** bestehende Kibitz-Funktionen wiederverwenden, Doppelimplementierungen vermeiden, keine Regression der Offline-/Datenbankfunktionen; anschließende Tests auf realem Gerät. Neue Features erhalten keine voreilige Release-Freigabe.
4. **Einfache Einstiegserfahrung:** Spielen, Lernen/Analysieren und Partien/Datenbanken stehen im Vordergrund; seltene Profiwerkzeuge bleiben erreichbar, aber nachgeordnet. Chat und Brett bleiben während einer Analyse sinnvoll gemeinsam sichtbar.
5. **Sicherheit und Fair Play:** KI gegen Stockfish ausschließlich lokal bzw. in einer ausdrücklich erlaubten abgeschlossenen Testsituation; niemals KI-Zugberatung für eine laufende Lichess-Partie gegen einen Menschen. API-Anfragen nur auf ausdrückliche Nutzeraktion; nachvollziehbare Kosten, Fehler und Diagnose.
6. **Priorisierung:** erst aktuelle Stockfish-/Maia-Lauffähigkeit und deutsche Oberfläche abnehmen; dann gemeinsamer Analyse- und Chatkontext; anschließend KI gegen Stockfish, Schlüsselstellungen, Markierungen, Varianten- und Speicherfunktionen in kleinen nachweisbaren Schritten. Die Reihenfolge einzelner Teilfunktionen ist bei nachgewiesenen technischen Abhängigkeiten anpassbar.

**Produktformel:** *Chess Studio als vertrautes Bedien- und Lernerlebnis, erweitert um Kibitz als Schachwissen-, Datenbank- und Analyseplattform sowie die gemeinsame Arbeit von Kibitz, Stockfish und KI.*
