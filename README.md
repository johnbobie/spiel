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

## Supabase einrichten

Einmalig, ungefähr zehn Minuten, kostenlos. Drei Schritte.

**1. Projekt anlegen**

Auf [supabase.com](https://supabase.com) anmelden → *New project*. Name frei
wählbar, als Region etwas in Europa (z. B. *Frankfurt*). Das Datenbank-Passwort
wird beim Anlegen abgefragt — ihr braucht es für das Spiel nicht, aber notiert
es euch trotzdem. Das Aufsetzen dauert ein, zwei Minuten.

**2. Tabellen anlegen**

Links im Menü *SQL Editor* → *New query*. Den kompletten Inhalt von
[`supabase/schema.sql`](supabase/schema.sql) hineinkopieren und auf *Run*
klicken. Das legt die beiden Tabellen an, erlaubt den Zugriff und schaltet die
Live-Updates ein.

Das Skript darf gefahrlos mehrfach laufen — falls etwas schiefgeht, könnt ihr
es einfach nochmal ausführen, ohne dass laufende Spiele kaputtgehen.

**3. Zugangsdaten eintragen**

*Project Settings* (Zahnrad unten links) → *API*. Dort stehen zwei Werte:

- **Project URL** — sieht aus wie `https://abcdefgh.supabase.co`
- **anon public** — ein langer Schlüssel, der mit `eyJ…` anfängt

Beides in [`js/config.js`](js/config.js) eintragen, fertig.

Diese Werte sind kein Geheimnis. Der anon-Schlüssel ist genau dafür gemacht,
offen im Browser zu stehen; geschützt wird über die Richtlinien aus Schritt 2
und darüber, dass man den vierstelligen Spielcode kennen muss. Sie dürfen also
committet werden.

> **Wenn etwas nicht klappt:** Die App sagt euch, was fehlt. „Die
> Datenbanktabellen fehlen" heißt, dass Schritt 2 noch nicht durchgelaufen ist;
> „Der anon-Schlüssel wird nicht akzeptiert" heißt, dass in Schritt 3 etwas
> Falsches eingetragen wurde (leicht passiert: der `service_role`-Schlüssel
> steht direkt daneben, es muss aber **anon public** sein).

> **Nach längerer Pause:** Kostenlose Supabase-Projekte werden nach etwa einer
> Woche ohne Zugriff pausiert. Dann meldet die App, dass keine Verbindung
> zustande kommt — im Supabase-Dashboard einmal auf *Restore* klicken, und es
> läuft weiter. Wenn ihr regelmäßig spielt, passiert das gar nicht erst.

## Online stellen

Damit ihr das Spiel vom Handy aus erreicht, muss es irgendwo liegen. Am
einfachsten über GitHub Pages:

1. Änderungen nach `main` bringen (Pull Request mergen oder direkt pushen).
2. Im Repo *Settings → Pages → Source: Deploy from a branch*, Branch `main`,
   Ordner `/ (root)`, speichern.
3. Nach ein, zwei Minuten liegt das Spiel unter
   `https://johnbobie.github.io/spiel/`.

Supabase muss dafür nichts wissen — es gibt keine Domain-Freischaltung.

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
js/config.js               Supabase-Zugangsdaten (von euch auszufüllen)
js/questions.js            Fragenkatalog
js/scale.js                Regler-Skalen, Rundung, Zahlenformatierung
js/scoring.js              Punkteberechnung
js/transport.js            Verbindung zwischen den Geräten
js/app.js                  Spielablauf und Oberfläche
supabase/schema.sql        Tabellen, Zugriffsrechte, Live-Updates
tools/check-questions.mjs  Prüfung des Fragenkatalogs
```

Kein Build-Schritt, keine Abhängigkeiten außer dem Supabase-Client, der direkt
vom CDN geladen wird.

### Wie die Geräte zusammenfinden

Der Spielstand liegt in zwei Tabellen: `games` (wer spielt mit, welche Fragen,
wer ist wie weit) und `answers` (eine Zeile pro abgegebener Schätzung). Dass
jede Schätzung eine eigene Zeile bekommt, ist Absicht — so können beide Geräte
gleichzeitig schreiben, ohne sich gegenseitig zu überschreiben.

Änderungen kommen über Supabase Realtime sofort an. Zusätzlich schaut die App
alle fünf Sekunden selbst nach, solange sie im Vordergrund ist. Das ist der
Grund, warum das Spiel auch dann weiterläuft, wenn die Live-Verbindung mal
klemmt — sie ist ein Beschleuniger, keine Voraussetzung.
