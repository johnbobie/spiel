# Schätzduell

Ein Schätzspiel für genau zwei Personen auf zwei Geräten. Beide bekommen
dieselbe Allgemeinwissensfrage, jede schiebt ihre Schätzung auf einem Regler
ein — und sobald beide abgegeben haben, wird aufgelöst: richtige Antwort,
beide Schätzungen auf einem Zahlenstrahl, Punkte. Danach die nächste Frage.
Zehn Fragen pro Spiel.

Ihr müsst dafür **nicht gleichzeitig online sein**. Wer zuerst schätzt, sieht
„Warte auf …" und kann die App zumachen; die Auflösung ist da, wenn die andere
Person geschätzt hat.

## Punkte

Pro Frage gibt es zwei Dinge:

| | |
|---|---|
| **Genauigkeit** | 0–100 Punkte, je nachdem wie nah die Schätzung dran war. Jede Frage hat eine eigene Toleranz — bei „Wie hoch ist der Everest?" zählt eine andere Abweichung als bei „Wie viele Länder gibt es?" |
| **Duell-Bonus** | +50 Punkte für die nähere Schätzung. Bei exakt gleichem Abstand bekommen beide +25. |

Maximal also 150 Punkte pro Frage, 1.500 pro Spiel. Eine gute Schätzung wird
dadurch auch dann belohnt, wenn die andere Person knapp näher dran war.

## Sofort ausprobieren

Ohne jede Einrichtung, nur zum Anschauen — zwei Browser-Tabs auf demselben
Rechner spielen gegeneinander:

```bash
python3 -m http.server 8000
```

Dann `http://localhost:8000` in **zwei Tabs** öffnen, in einem ein Spiel
starten, im anderen mit dem Code beitreten.

In diesem Modus läuft alles nur lokal im Browser — für das echte Spiel auf zwei
Geräten braucht ihr den nächsten Schritt.

## Firebase einrichten

Das ist einmalig, dauert ungefähr zehn Minuten und kostet nichts (der
kostenlose Spark-Tarif reicht für ein Spiel zu zweit bei Weitem).

**1. Projekt anlegen**

Auf [console.firebase.google.com](https://console.firebase.google.com) mit
einem Google-Konto anmelden → *Projekt hinzufügen* → Name z. B. `schaetzduell`.
Google Analytics könnt ihr abwählen.

**2. Realtime Database anlegen**

Links im Menü *Build → Realtime Database → Datenbank erstellen*.
Als Region **`europe-west1`** wählen. Beim Sicherheitsmodus ist es egal, was
ihr auswählt — die Regeln ersetzt ihr gleich in Schritt 3.

> Wichtig: Die von Firebase vorgeschlagenen Testmodus-Regeln laufen nach 30
> Tagen ab, danach würde das Spiel plötzlich nicht mehr funktionieren. Deshalb
> unbedingt Schritt 3 machen.

**3. Regeln setzen**

Im Reiter *Regeln* der Realtime Database alles markieren und hierdurch ersetzen:

```json
{
  "rules": {
    ".read": false,
    ".write": false,
    "games": {
      "$code": {
        ".read": "auth != null",
        ".write": "auth != null",
        ".validate": "$code.matches(/^[A-Z]{4}$/)"
      }
    }
  }
}
```

Dann *Veröffentlichen*. Damit kommt nur an die Spieldaten heran, wer angemeldet
ist und den vierstelligen Code kennt.

**4. Anonyme Anmeldung aktivieren**

*Build → Authentication → Los geht's → Sign-in-Methode → Anonym → aktivieren.*
Ohne diesen Schritt verweigert die Datenbank den Zugriff; die App sagt euch
das dann aber auch direkt.

**5. Zugangsdaten eintragen**

*Projektübersicht* → auf das Web-Symbol `</>` klicken → App-Name eingeben →
*App registrieren*. Firebase zeigt euch einen Block `firebaseConfig = { … }`.
Die Werte daraus in [`js/config.js`](js/config.js) eintragen.

Achtet darauf, dass `databaseURL` dabei ist — wenn nicht, findet ihr die URL
oben in der Realtime Database (Form:
`https://PROJEKT-default-rtdb.europe-west1.firebasedatabase.app`).

Diese Werte sind kein Geheimnis. Sie stehen bei jeder Firebase-Web-App offen im
Quelltext; der Schutz kommt aus den Regeln von Schritt 3. Sie dürfen also
committet werden.

## Online stellen

Damit ihr das Spiel vom Handy aus erreicht, muss es irgendwo liegen. Am
einfachsten über GitHub Pages:

1. Änderungen nach `main` bringen (Pull Request mergen oder direkt pushen).
2. Im Repo *Settings → Pages → Source: Deploy from a branch*, Branch `main`,
   Ordner `/ (root)`, speichern.
3. Nach ein, zwei Minuten liegt das Spiel unter
   `https://johnbobie.github.io/spiel/`.

Diese Adresse dann in Firebase unter *Authentication → Settings → Autorisierte
Domains* hinzufügen, falls sie dort noch nicht steht.

## Aufs Handy legen

Im Browser die Adresse öffnen und *Zum Home-Bildschirm hinzufügen* wählen
(iPhone/iPad: Teilen-Symbol → nach unten scrollen). Danach startet das Spiel
wie eine normale App im Vollbild.

## Spielen

Eine startet ein neues Spiel und bekommt einen vierstelligen Code wie `KFLJ`.
Über *Link teilen* geht ein fertiger Link raus — wer ihn antippt, muss nur noch
den Namen eintragen. Alternativ den Code von Hand eintippen.

Das laufende Spiel wird auf dem Gerät gemerkt: App zumachen und später wieder
öffnen landet direkt an der richtigen Stelle.

## Eigene Fragen

Alle Fragen stehen in [`js/questions.js`](js/questions.js), eine pro Objekt:

```js
{
  id: 'geo-everest', cat: 'Geografie',
  q: 'Wie hoch ist der Mount Everest über dem Meeresspiegel?',
  answer: 8849, unit: 'm', min: 2000, max: 15000, scale: 'linear',
  note: 'Seit der Neuvermessung 2020 gelten offiziell 8.849 m.',
}
```

Ein paar Dinge, auf die es ankommt:

- **`scale: 'log'`** für alles mit riesiger Spannweite (Einwohnerzahlen,
  Entfernungen im All). Sonst klebt die ganze interessante Zone am linken
  Reglerrand.
- **`min`/`max` so wählen, dass die Antwort nicht in der Mitte liegt.** Sonst
  bekommt man Punkte geschenkt, ohne den Regler anzufassen.
- **`step: 1, format: 'year'`** für Jahreszahlen, damit kein Tausenderpunkt
  erscheint und man einzelne Jahre treffen kann.
- **`id` nie nachträglich ändern** — laufende Spiele verweisen darauf.

Danach die Prüfung laufen lassen, sie fängt genau diese Fehler ab:

```bash
node tools/check-questions.mjs
```

## Aufbau

```
index.html                 Gerüst
css/styles.css             Gestaltung
js/config.js               Firebase-Zugangsdaten (von euch auszufüllen)
js/questions.js            Fragenkatalog
js/scale.js                Regler-Skalen, Rundung, Zahlenformatierung
js/scoring.js              Punkteberechnung
js/transport.js            Verbindung zwischen den Geräten
js/app.js                  Spielablauf und Oberfläche
tools/check-questions.mjs  Prüfung des Fragenkatalogs
```

Kein Build-Schritt, keine Abhängigkeiten außer dem Firebase-SDK, das direkt vom
Google-CDN geladen wird.
