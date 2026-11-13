# Kibitz DE – Intel-Mac-Abnahme vor Veröffentlichung

**Status:** Prüfanleitung; die nachfolgenden Prüfungen sind **noch nicht ausgeführt**.
Der GitHub-CI-Job unter `macos-latest` ersetzt keinen Test auf einem Intel-Mac.
Dieser Ablauf gilt für den Entwicklungszweig `feat/de-simple-readable-ui`.
Ein erfolgreicher Quellbuild ist **noch kein freigegebenes Installationspaket**.

## 1. Voraussetzungen und Architektur

Auf einem **Intel-Mac** (nicht Apple Silicon) im Terminal prüfen:

```sh
uname -m
rustc --version
node --version
```

Erwartet: `x86_64`, aktuelles Rust stable sowie Node.js 22+.
Die mit dem Upstream-Repository verbundene Datei
`tools/stockfish/stockfish-macos-m1-apple-silicon` ist **keine Intel-Engine**.
Auf Intel-Macs muss ein **x86_64-kompatibles Stockfish** separat vorliegen.
Ein eigenes, passendes Stockfish-Programm verwenden; die App soll nicht
ungefragt eine Engine aus dem Internet herunterladen.

## 2. Entwicklungszweig frisch bauen

```sh
git clone --branch feat/de-simple-readable-ui https://github.com/wibem1/kibitz.git kibitz-de-test
cd kibitz-de-test
cargo fmt --all --check
cargo test --workspace
cd app
npm ci
npx vitest run
npm run build
CI=true npm run tauri build
```

Falls der Checkout bereits besteht, vor dem Test den Branch und Commit
festhalten (`git rev-parse HEAD`). Der hier gezeigte Build benötigt eine
funktionierende Xcode-Command-Line-Tools-Installation.
Die von Tauri erzeugten Pakete liegen unter
`app/src-tauri/target/release/bundle/`. Der genaue Dateiname kann
von der Bundler-Version abhängen.

**Abnahmekriterium:** Die Befehle enden ohne Fehler, der `dmg/`-Ordner
enthält ein x86_64-kompatibles DMG und die darin enthaltene App startet
auf dem Intel-Mac. Die Architektur des erzeugten Programms muss
überprüft werden (`file` oder `lipo -info` auf der Haupt-Binary
in `Kibitz.app/Contents/MacOS/`).

## 3. Engine vor dem Spielen prüfen

In **Einstellungen → Engineverwaltung → Engineprogramm** den vollständigen
Pfad zur passenden Stockfish-Datei eintragen.
**„Verbindung und Version prüfen“** auslösen.
Erwartet: Die Engine meldet einen Namen und akzeptiert den UCI-Handshake.
Der Pfad bleibt nach einem Neustart erhalten.

Wenn das Programm fehlt oder inkompatibel ist, muss die App eine verständliche
Fehlermeldung zeigen, statt stillschweigend das Apple-Silicon-Binary zu nutzen.
Der bloße UCI-Handshake prüft **noch keinen tatsächlich berechneten Zug**.

## 4. Offline-Spiel gegen Stockfish – Pflichtproben

1. **Weiß:** Neue Partie → Stockfish (offline) → Weiß; `1. e4` spielen.
   Erwartet: Stockfish antwortet mit einem **legalen schwarzen Zug**,
   der im Brett und in der Zugliste sichtbar wird.
2. **Rücknahme:** „Zug zurücknehmen“ entfernt die eigene Entscheidung
   und die Antwort der Engine; Weiß ist wieder am Zug. Auch während
   einer laufenden Engine-Berechnung muss Rücknahme möglich sein.
3. **Schwarz:** Neue Partie → Schwarz; Stockfish eröffnet selbst.
   Erwartet: Weißer Engine-Zug wird angezeigt; nach eigenem Antwortzug
   antwortet Stockfish erneut. Rücknahme führt zur vorherigen
   menschlichen Entscheidungsstellung.
4. **Neustart:** Kibitz während einer laufenden Partie schließen,
   erneut öffnen und „Offline spielen“ auswählen.
   Erwartet: Stellung, Zugliste, Gegner und eigene Farbe sind wiederhergestellt.
5. **PGN:** „PGN speichern“ verwenden und die Datei in einer unabhängigen
   Schach-App öffnen. Erwartet: Zugfolge und Ergebnis sind korrekt; die
   Datei enthält keine erfundenen Zugbewertungen.
6. **Fehlerfall:** Engine-Pfad bewusst ungültig setzen und einen
   Engine-Zug anfordern. Erwartet: Deutsche Hilfemeldung, Möglichkeit
   zum erneuten Versuch; keine beschädigte Partie. Danach gültigen
   Pfad setzen und mit derselben Partie fortfahren.

Für jede Fehlfunktion: Commit-SHA, macOS-Version, `uname -m`,
Stockfish-Version, die sichtbare Fehlermeldung und den zuletzt
gespielten Zug notieren. **Keine geheimen Pfade, Tokens oder Kontodaten
veröffentlichen.**

## 5. Freigabeschranken

- Erfolgreiche CI-Tests auf dem tatsächlich zu veröffentlichenden Commit.
- Ein realer Intel-Mac-Test von **genau dem zur Freigabe vorgesehenen DMG**
  (nicht nur vom Quellcode oder einem anderen Build).
- Prüfen, ob das DMG signiert/notarisiert ist; bei unsigniertem Build
  den Warnhinweis ausdrücklich angeben und die geltenden Projektregeln
  beachten. Nicht behaupten, Gatekeeper sei erfolgreich geprüft, wenn
  das nicht erfolgt ist.
- `docs/RELEASING.md`, `docs/RELEASE_CHECKLIST.md` und
  `.github/release-targets.json` abgleichen: die vorhandene
  Veröffentlichungsroutine verlangt zusätzliche Pakete für Apple Silicon,
  Linux und Windows. Diese Matrix nicht durch eine einzelne Mac-Probe ersetzen.
- **Erst danach** eine Versionsnummer vergeben, Release-Artefakte kontrollieren
  und die Veröffentlichung freigeben.

**Dokumentationsstatus:** Dieser Ablauf liefert ein reproduzierbares
Testprotokoll; er bestätigt selbst noch **keinen** bestandenen Mac-Test.
