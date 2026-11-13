# Kibitz – Deutsche Bedienungsanleitung

Kibitz ist ein Schachprogramm zum Durchspielen und Untersuchen von Partien, zur Stellungsanalyse und zum Training. Die wichtigsten Funktionen arbeiten mit einer geöffneten Partiedatenbank. Die Engine bleibt grundsätzlich ausgeschaltet, solange du nicht ausdrücklich eine Analyse anforderst oder einen Analyseauftrag startest.

## Oberfläche und Navigation

Links befindet sich die Navigation. Standardmäßig erscheinen nur die wichtigsten Einträge. Über **Weitere Funktionen** werden die zusätzlichen Werkzeuge eingeblendet. Unten stehen **Einstellungen** und **Hilfe**.

- **Partien:** Partiedatenbank, Partieansicht, Eröffnungsbaum und Stellungssuche.
- **Analyse:** Startseite, Stellungserklärung, Spielerprofil und Gegnervorbereitung.
- **Training:** Eröffnungswiederholung, Repertoireprüfung, Eröffnungslabor, Taktik und Endspiele.
- **Datenverwaltung:** Import, TWIC, Kontoabgleich und Analyseaufträge.

In Datentabellen lässt sich nach verschiedenen Spalten sortieren. Der untere Statusbereich zeigt unter anderem die Datenbank, die Engine und laufende Arbeiten.

## Erste Schritte und Startseite

Beim ersten Start legst du eine Partiedatenbank an oder öffnest eine vorhandene Datenbank. Danach kannst du PGN-Partien importieren oder Lichess beziehungsweise Chess.com verbinden.

Die Startseite zeigt die zuletzt geöffnete Partie, fällige Eröffnungsübungen, Gegner-Vorbereitung, vorhandene Erkenntnisse aus dem Spielerprofil und neue Partien. Solange keine Daten vorliegen, werden dafür keine künstlichen Zahlen angezeigt.

## Partieansicht

Öffne eine Partie aus der Datenbank oder importiere sie als PGN. Die Partieansicht enthält das Brett, die Zugliste und – sofern eingeschaltet – die Stellungserklärung.

**Züge durchspielen:** Mit den Schaltflächen **Zurück** und **Weiter** oder den Pfeiltasten links/rechts bewegst du dich um einen Halbzug. Pfeil hoch/runter springt jeweils fünf Halbzüge, Pos1/Ende an den Anfang beziehungsweise das Ende. Mit **Brett drehen** oder der Taste **F** wechselst du die Orientierung.

**Zugliste:** Ein Klick auf einen Zug zeigt die Stellung auf dem Brett. Die Zugliste folgt dem aktuellen Zug innerhalb ihres eigenen Bereichs. Kommentare und Varianten lassen sich ein- oder ausblenden. Klicke auf eine Variante, um sie gesondert anzusehen; kehre anschließend zur Hauptpartie zurück.

**Partie erläutern:** Für eine gespeicherte Datenbankpartie können Kommentare und taktische Hinweise erstellt werden. **Neu bewerten** führt Enginebewertungen für Partiestellungen aus. Diese Arbeiten werden als Aufträge verwaltet.

**Live-Analyse:** Ein eigener Schalter startet eine fortlaufende Engineanalyse der aktuell angezeigten Stellung. Sie endet beim Ausschalten, beim Laden einer anderen Partie oder beim Verlassen der Partieansicht. Die Engine startet nicht automatisch beim bloßen Durchspielen.

**PGN exportieren:** Das Ergebnis kann samt gespeicherten Kommentaren als PGN ausgegeben und kopiert werden. Änderungen an Kommentaren oder Varianten müssen ausdrücklich gespeichert werden.

### Stellungserklärung

Die Erklärung unterscheidet taktische Hinweise, Ungleichgewichte sowie kurz- und langfristige Pläne. In der vereinfachten Ansicht erscheinen zunächst die wichtigsten Aussagen; weitere Hinweise können aufgeklappt werden. Markierungen und Pfeile auf dem Brett zeigen die betreffenden Felder.

Über den Erklärstil wählst du zwischen einer trainerorientierten und einer neutralen Formulierung. Ein Klick auf ein Feld kann die dazu passenden Aussagen hervorheben. Auf ausdrücklichen Wunsch lässt sich auch eine ruhige Stellung erklären.

**Wichtig:** Die Programmhinweise sind keine Garantie für eine richtige schachliche Entscheidung. Taktische Kandidaten können mit der Engine geprüft werden.

### Brettmarkierungen

Rot kennzeichnet taktische Gefahren, Orange Angreifer, Blau Verteidiger, Grün strukturelle Ungleichgewichte und Violett strategische Zielfelder. Gelb zeigt den letzten Zug. Das ausgewählte Feld erhält einen gesonderten Ring.

### Kommentare und Varianten

In gespeicherten Datenbankpartien kannst du Zugkommentare bearbeiten, Bewertungszeichen setzen und Varianten löschen oder ergänzen. Ein leer gespeicherter Kommentar wird entfernt. **Enter** bestätigt, **Esc** bricht eine Eingabe ab.

Bei einer Bauernumwandlung öffnet sich eine Auswahl für Dame, Turm, Läufer oder Springer. Die Tasten **1–4** wählen die Figur, **Esc** bricht ab.

## Partiedatenbank

Die Datenbank zeigt vorhandene Partien mit Angaben zu Spielern, Ergebnis, Eröffnung und Herkunft. Filter erleichtern die Suche. Einzelne Partien öffnest du per Klick. Für gespeicherte Turniere mit passenden Rundendaten kann eine Kreuztabelle angezeigt werden.

**Datenbankweit erläutern** erzeugt Kommentare und gegebenenfalls taktische Prüfaufträge. **Partien neu bewerten** ergänzt aktuelle Enginebewertungen. Ein Bestätigungsdialog soll vor größeren Aufträgen den Umfang anzeigen.

### Kreuztabelle

Die Kreuztabelle zeigt Spieler, Wertungszahlen, Punkte und Partien. Wenn die Turnierdaten keine zuverlässigen Rundennummern enthalten, wird statt einer vollständigen Rundentabelle eine Ergebnisliste angezeigt.

### Eröffnungsbaum

Der Eröffnungsbaum wertet die in der Datenbank enthaltenen Stellungen und Fortsetzungen aus. Zugumstellungen können zur gleichen Stellung führen. Falls aktiviert, kann ergänzend der öffentliche Lichess-Eröffnungs-Explorer abgefragt werden. Das sind fremde Spieldaten, nicht automatisch deine eigenen.

### Stellungssuche

Über die Brettstellung beziehungsweise FEN kannst du Partien suchen, die eine bestimmte Stellung enthalten. FEN ist ein technisches Austauschformat und bleibt unverändert.

## Spielerprofil und Gegnervorbereitung

Das **Spielerprofil** fasst aus vorhandenen Partien auffällige Motive, Strukturen und mögliche Schwachstellen zusammen. Die angezeigten Erkenntnisse beruhen auf Daten, nicht auf frei erfundenen Bewertungen. Einzelne Hinweise führen zu den unterstützenden Partien.

Die **Gegnervorbereitung** untersucht gespeicherte Partien eines bestimmten Gegners, soweit diese in der Datenbank vorhanden sind. Verwende die Ergebnisse als Vorbereitung, nicht als garantierte Vorhersage seines nächsten Zuges.

## Training

### Eröffnungen üben

Das Wiederholungssystem legt gespeicherte Repertoirevarianten in sinnvollen Abständen erneut vor. Bewerte deine Antwort, um die nächste Wiederholung zu steuern. Bereits vorhandene Repertoirekarten werden beim erneuten Hinzufügen nicht beliebig dupliziert.

### Eröffnungen prüfen und Eröffnungslabor

Diese Werkzeuge untersuchen, an welcher Stelle eine eigene Partie vom gespeicherten Repertoire abweicht und in welchen Varianten die praktischen Ergebnisse auffällig sind. Sie helfen dabei, gezielt Varianten nachzuarbeiten, statt blind mehr Theorie zu sammeln.

### Taktik

Löse Taktikstellungen auf dem Brett. Die Auswahl kann sich an früheren Schwächen orientieren. Ein dauerhaftes Kontingent „heute fällig“ wird für Taktik nicht vorgetäuscht.

### Endspiele

Das Endspieltraining verwendet Aufgaben unterschiedlicher Schwierigkeit. Wenn geeignete Syzygy-Endspieldatenbanken eingerichtet sind, können sie die objektive Bewertung bestimmter Stellungen liefern.

## Online spielen

Für Lichess wird ein persönliches Zugriffstoken mit der Berechtigung `board:play` benötigt. Es wird auf deinem Gerät gespeichert und nicht in der Partiedatenbank abgelegt. Das Programm unterstützt den vorgesehenen Online-Spielablauf einschließlich der angebotenen Zeitkontrollen.

**Fair Play:** Während einer laufenden Onlinepartie ist die Enginehilfe auf der Spielansicht deaktiviert. Verwende auch keine externe Engineunterstützung entgegen den Regeln der Plattform.

## Daten importieren und abgleichen

### PGN und SCID

PGN-Dateien können geöffnet oder als Text eingefügt werden. PGN und die darin verwendeten Schachzüge bleiben in ihrem Standardformat. SCID-Datenbanken erfordern bei manchen Importwegen weiterhin ein Kommandozeilenwerkzeug; solche Wege werden nicht durch eine bloße Übersetzung verändert.

### TWIC

TWIC stellt Schachpartien aus Turnieren bereit. Kibitz kann neue Ausgaben abrufen und importieren. Beachte die Nutzungsbedingungen; TWIC-Daten werden nicht mit unserer App weiterverteilt.

### Konten abgleichen

Soweit eingerichtet, können Partien aus Lichess, Chess.com oder FICS übernommen werden. Der Fortschritt erscheint in der Anwendung. Konten und Zugangsdaten werden nur für die jeweiligen Funktionen verwendet.

### Analyseaufträge

Hier erkennst du wartende, laufende, erledigte und fehlgeschlagene Aufgaben. Die Engine wird nicht allein deshalb gestartet, weil Aufträge in der Liste stehen.

## Einstellungen

**Darstellung:** Wähle zwischen hellem und dunklem Design. Die deutsche Fassung verwendet größere Schrift und eine reduzierte Hauptnavigation.

**Engine:** Wähle gegebenenfalls den Pfad zu Stockfish und prüfe die UCI-Verbindung. Du kannst die Rechenbegrenzung einstellen. Die Engine bleibt standardmäßig aus.

**Endspieldatenbanken:** Ein Verzeichnis mit Syzygy-Dateien kann angegeben werden. Ist kein nutzbares Verzeichnis vorhanden, stehen die entsprechenden Tabellenfunktionen nicht zur Verfügung.

**Datenbankablage:** Bei Datenbanken in automatisch synchronisierten Cloud-Ordnern ist Vorsicht geboten. Eine lokale Ablage kann Konflikte und Beschädigungen vermeiden. Vor dem Umzug vorhandene Sicherungen beachten.

**Aktualisierungen:** Die Testfassung besitzt noch keinen vollständig eingerichteten eigenen signierten Updatekanal. Neue Programmversionen nicht mit einer beliebigen Original-Kibitz-Aktualisierung verwechseln.

## Tastatur und technische Begriffe

- **Pfeil links/rechts:** vorheriger/nächster Halbzug.
- **Pfeil hoch/runter:** fünf Halbzüge zurück/vor.
- **Pos1/Ende:** Partieanfang/Partieende.
- **F:** Brett drehen.
- **E:** aktuelle Stellung erklären.
- **Esc:** Dialog oder Variantenansicht schließen, sofern passend.

FEN, PGN, UCI, SAN, ECO, CLI sowie Dateiendungen und Programmaufrufe bleiben international gebräuchliche technische Bezeichnungen. Sie werden nicht übersetzt, damit Austauschformate und Befehle funktionieren.

## Funktionen für die Kommandozeile

Einige spezielle Import-, Analyse- und Wartungsarbeiten sind weiterhin nur über `kibitz-cli` möglich. Die Befehlsnamen, Parameter und Dateiformate müssen unverändert verwendet werden; der englische Originalleitfaden im Repository enthält die ausführliche technische Referenz. Die deutsche Oberfläche ist kein Ersatz für eine vollständige technische Kommandozeilenreferenz.

## Datensicherheit und Grenzen

Gespeicherte Partien und ihre Kommentare sind deine Daten. Vor umfangreichen Importen, Datenbankmigrationen oder Neuinstallationen empfiehlt sich eine Sicherung. Eine unsignierte Test-DMG wurde nicht von Apple notarisiert und ist keine öffentliche stabile Version. Der Nachweis eines erfolgreichen Builds ersetzt keinen Test der Oberfläche und Schachfunktionen auf dem tatsächlichen Gerät.
