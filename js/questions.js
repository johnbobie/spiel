// Fragenkatalog.
//
// Felder pro Frage:
//   id       eindeutige, stabile ID (nicht ändern – steckt in laufenden Spielen)
//   cat      Kategorie (wird beim Spielen angezeigt)
//   q        Fragetext
//   answer   die korrekte Zahl
//   unit     Einheit hinter der Zahl ('' für Jahreszahlen)
//   min/max  Grenzen des Reglers
//   scale    'linear' oder 'log' (log für Fragen mit riesiger Spannweite)
//   step     optionale Rasterung des Reglers (Jahre: 1, Geld: 0.05, ...)
//   decimals Nachkommastellen für Anzeige und Rundung
//   tol      Abweichung, ab der es 0 Genauigkeitspunkte gibt.
//            Ohne Angabe: linear -> 15 % der Reglerbreite, log -> 50 % der Antwort.
//   format   'year' unterdrückt den Tausenderpunkt
//   note     kurzer Zusatz, der bei der Auflösung erscheint

export const QUESTIONS = [
  // ---------------------------------------------------------------- Geografie
  {
    id: 'geo-everest', cat: 'Geografie',
    q: 'Wie hoch ist der Mount Everest über dem Meeresspiegel?',
    answer: 8849, unit: 'm', min: 2000, max: 15000, scale: 'linear',
    note: 'Seit der Neuvermessung 2020 gelten offiziell 8.849 m.',
  },
  {
    id: 'geo-nil', cat: 'Geografie',
    q: 'Wie lang ist der Nil?',
    answer: 6650, unit: 'km', min: 500, max: 16000, scale: 'linear',
  },
  {
    id: 'geo-un', cat: 'Geografie',
    q: 'Wie viele Mitgliedstaaten hat die UNO?',
    answer: 193, unit: 'Staaten', min: 50, max: 400, scale: 'linear',
    note: 'Dazu kommen zwei Beobachterstaaten: der Vatikan und Palästina.',
  },
  {
    id: 'geo-marianen', cat: 'Geografie',
    q: 'Wie tief ist die tiefste Stelle des Meeres (Marianengraben)?',
    answer: 10935, unit: 'm', min: 1000, max: 16000, scale: 'linear',
  },
  {
    id: 'geo-flaeche-de', cat: 'Geografie',
    q: 'Wie groß ist die Fläche Deutschlands?',
    answer: 357600, unit: 'km²', min: 50000, max: 1000000, scale: 'log',
  },
  {
    id: 'geo-zugspitze', cat: 'Geografie',
    q: 'Wie hoch ist die Zugspitze?',
    answer: 2962, unit: 'm', min: 1000, max: 6000, scale: 'linear',
  },
  {
    id: 'geo-rhein', cat: 'Geografie',
    q: 'Wie lang ist der Rhein?',
    answer: 1233, unit: 'km', min: 300, max: 3000, scale: 'linear',
  },
  {
    id: 'geo-russland', cat: 'Geografie',
    q: 'Wie groß ist die Fläche Russlands?',
    answer: 17100000, unit: 'km²', min: 1000000, max: 50000000, scale: 'log',
    note: 'Russland ist damit fast doppelt so groß wie Kanada.',
  },
  {
    id: 'geo-baikal', cat: 'Geografie',
    q: 'Wie tief ist der tiefste See der Welt (Baikalsee)?',
    answer: 1642, unit: 'm', min: 100, max: 2500, scale: 'linear',
    note: 'Im Baikalsee steckt rund ein Fünftel des flüssigen Süßwassers der Erde.',
  },
  {
    id: 'geo-mond', cat: 'Geografie',
    q: 'Wie weit ist der Mond im Mittel von der Erde entfernt?',
    answer: 384400, unit: 'km', min: 10000, max: 3000000, scale: 'log',
  },
  {
    id: 'geo-erdumfang', cat: 'Geografie',
    q: 'Wie groß ist der Erdumfang am Äquator?',
    answer: 40075, unit: 'km', min: 5000, max: 150000, scale: 'log',
  },
  {
    id: 'geo-bodensee', cat: 'Geografie',
    q: 'Wie groß ist die Fläche des Bodensees?',
    answer: 536, unit: 'km²', min: 50, max: 3000, scale: 'log',
  },
  {
    id: 'geo-kilimandscharo', cat: 'Geografie',
    q: 'Wie hoch ist der Kilimandscharo?',
    answer: 5895, unit: 'm', min: 2000, max: 9000, scale: 'linear',
  },
  {
    id: 'geo-afrika', cat: 'Geografie',
    q: 'Wie viele Länder liegen in Afrika?',
    answer: 54, unit: 'Länder', min: 10, max: 120, scale: 'linear',
  },
  {
    id: 'geo-amazonas', cat: 'Geografie',
    q: 'Wie lang ist der Amazonas?',
    answer: 6400, unit: 'km', min: 2000, max: 14000, scale: 'linear',
    note: 'Je nach Messmethode werden 6.400 bis 6.900 km angegeben.',
  },
  {
    id: 'geo-berlin', cat: 'Geografie',
    q: 'Wie viele Einwohner hat Berlin?',
    answer: 3800000, unit: 'Einwohner', min: 500000, max: 15000000, scale: 'log',
  },
  {
    id: 'geo-tokio', cat: 'Geografie',
    q: 'Wie viele Menschen leben in der Metropolregion Tokio?',
    answer: 37000000, unit: 'Einwohner', min: 3000000, max: 100000000, scale: 'log',
    note: 'Damit ist Tokio der größte Ballungsraum der Welt.',
  },
  {
    id: 'geo-panama', cat: 'Geografie',
    q: 'Wie lang ist der Panamakanal?',
    answer: 82, unit: 'km', min: 10, max: 400, scale: 'log',
  },
  {
    id: 'geo-sahara', cat: 'Geografie',
    q: 'Wie groß ist die Sahara?',
    answer: 9200000, unit: 'km²', min: 500000, max: 30000000, scale: 'log',
    note: 'Die Sahara ist damit ungefähr so groß wie die USA.',
  },
  {
    id: 'geo-zeitzonen-ru', cat: 'Geografie',
    q: 'Wie viele Zeitzonen hat Russland?',
    answer: 11, unit: 'Zeitzonen', min: 1, max: 30, scale: 'linear',
  },
  {
    id: 'geo-wasserfall', cat: 'Geografie',
    q: 'Wie hoch ist der höchste Wasserfall der Welt (Salto Ángel)?',
    answer: 979, unit: 'm', min: 100, max: 2000, scale: 'linear',
  },
  {
    id: 'geo-finnland-seen', cat: 'Geografie',
    q: 'Wie viele Seen hat Finnland?',
    answer: 188000, unit: 'Seen', min: 1000, max: 1000000, scale: 'log',
    note: 'Gezählt werden alle Wasserflächen ab 500 m².',
  },
  {
    id: 'geo-sprachen', cat: 'Geografie',
    q: 'Wie viele Sprachen werden weltweit gesprochen?',
    answer: 7100, unit: 'Sprachen', min: 500, max: 30000, scale: 'log',
    note: 'Etwa die Hälfte davon gilt als vom Aussterben bedroht.',
  },
  {
    id: 'geo-island', cat: 'Geografie',
    q: 'Wie viele Einwohner hat Island?',
    answer: 390000, unit: 'Einwohner', min: 20000, max: 5000000, scale: 'log',
  },
  {
    id: 'geo-autobahn', cat: 'Geografie',
    q: 'Wie lang ist das deutsche Autobahnnetz?',
    answer: 13200, unit: 'km', min: 2000, max: 50000, scale: 'log',
  },
  {
    id: 'geo-australien', cat: 'Geografie',
    q: 'Wie groß ist die Fläche Australiens?',
    answer: 7690000, unit: 'km²', min: 1000000, max: 30000000, scale: 'log',
  },

  // ------------------------------------------------------ Wissenschaft & Natur
  {
    id: 'sci-lichtgeschw', cat: 'Wissenschaft & Natur',
    q: 'Wie schnell ist Licht im Vakuum?',
    answer: 299792, unit: 'km/s', min: 1000, max: 3000000, scale: 'log',
  },
  {
    id: 'sci-chromosomen', cat: 'Wissenschaft & Natur',
    q: 'Wie viele Chromosomen hat eine menschliche Körperzelle?',
    answer: 46, unit: 'Chromosomen', min: 2, max: 200, scale: 'log',
  },
  {
    id: 'sci-elemente', cat: 'Wissenschaft & Natur',
    q: 'Wie viele Elemente enthält das Periodensystem?',
    answer: 118, unit: 'Elemente', min: 20, max: 400, scale: 'linear',
  },
  {
    id: 'sci-sonne-dist', cat: 'Wissenschaft & Natur',
    q: 'Wie weit ist die Sonne im Mittel von der Erde entfernt?',
    answer: 149600000, unit: 'km', min: 1000000, max: 5000000000, scale: 'log',
  },
  {
    id: 'sci-erdalter', cat: 'Wissenschaft & Natur',
    q: 'Wie alt ist die Erde?',
    answer: 4540000000, unit: 'Jahre', min: 1000000, max: 50000000000, scale: 'log',
  },
  {
    id: 'sci-knochen', cat: 'Wissenschaft & Natur',
    q: 'Wie viele Knochen hat ein erwachsener Mensch?',
    answer: 206, unit: 'Knochen', min: 50, max: 600, scale: 'linear',
    note: 'Babys starten mit über 300 – viele wachsen später zusammen.',
  },
  {
    id: 'sci-neuronen', cat: 'Wissenschaft & Natur',
    q: 'Wie viele Nervenzellen hat das menschliche Gehirn?',
    answer: 86000000000, unit: 'Neuronen', min: 100000000, max: 1000000000000, scale: 'log',
  },
  {
    id: 'sci-herzschlag', cat: 'Wissenschaft & Natur',
    q: 'Wie oft schlägt ein Herz in Ruhe an einem Tag?',
    answer: 100000, unit: 'Schläge', min: 10000, max: 500000, scale: 'log',
  },
  {
    id: 'sci-sonnentemp', cat: 'Wissenschaft & Natur',
    q: 'Wie heiß ist die Oberfläche der Sonne?',
    answer: 5500, unit: '°C', min: 500, max: 20000, scale: 'log',
    note: 'Im Kern sind es dagegen rund 15 Millionen °C.',
  },
  {
    id: 'sci-lichtlaufzeit', cat: 'Wissenschaft & Natur',
    q: 'Wie lange braucht das Sonnenlicht bis zur Erde?',
    answer: 500, unit: 'Sekunden', min: 10, max: 3000, scale: 'log',
    note: 'Das sind gut 8 Minuten.',
  },
  {
    id: 'sci-gepard', cat: 'Wissenschaft & Natur',
    q: 'Wie schnell rennt ein Gepard im Spitzentempo?',
    answer: 110, unit: 'km/h', min: 30, max: 300, scale: 'log',
  },
  {
    id: 'sci-blauwal-laenge', cat: 'Wissenschaft & Natur',
    q: 'Wie lang wird ein ausgewachsener Blauwal?',
    answer: 30, unit: 'm', min: 5, max: 100, scale: 'log',
  },
  {
    id: 'sci-blauwal-gewicht', cat: 'Wissenschaft & Natur',
    q: 'Wie schwer wird ein ausgewachsener Blauwal?',
    answer: 150, unit: 't', min: 10, max: 500, scale: 'log',
  },
  {
    id: 'sci-zaehne', cat: 'Wissenschaft & Natur',
    q: 'Wie viele Zähne hat ein Erwachsener inklusive Weisheitszähnen?',
    answer: 32, unit: 'Zähne', min: 10, max: 80, scale: 'linear',
  },
  {
    id: 'sci-erddurchmesser', cat: 'Wissenschaft & Natur',
    q: 'Wie groß ist der Durchmesser der Erde am Äquator?',
    answer: 12742, unit: 'km', min: 2000, max: 60000, scale: 'log',
  },
  {
    id: 'sci-baum', cat: 'Wissenschaft & Natur',
    q: 'Wie alt ist der älteste bekannte lebende Baum?',
    answer: 4850, unit: 'Jahre', min: 500, max: 20000, scale: 'log',
    note: 'Die Grannenkiefer „Methusalem" in Kalifornien.',
  },
  {
    id: 'sci-mond-menschen', cat: 'Wissenschaft & Natur',
    q: 'Wie viele Menschen haben bisher den Mond betreten?',
    answer: 12, unit: 'Menschen', min: 1, max: 100, scale: 'log',
  },
  {
    id: 'sci-blut', cat: 'Wissenschaft & Natur',
    q: 'Wie viel Blut hat ein erwachsener Mensch?',
    answer: 5.5, unit: 'Liter', min: 1, max: 20, scale: 'linear', step: 0.1, decimals: 1,
  },
  {
    id: 'sci-duenndarm', cat: 'Wissenschaft & Natur',
    q: 'Wie lang ist der Dünndarm eines Menschen?',
    answer: 600, unit: 'cm', min: 100, max: 2000, scale: 'linear',
  },
  {
    id: 'sci-gehirn', cat: 'Wissenschaft & Natur',
    q: 'Wie schwer ist ein menschliches Gehirn?',
    answer: 1400, unit: 'g', min: 200, max: 4000, scale: 'log',
  },

  // ------------------------------------------------------------------- Kultur
  {
    id: 'kul-klavier', cat: 'Kultur',
    q: 'Wie viele Tasten hat ein Klavier?',
    answer: 88, unit: 'Tasten', min: 20, max: 200, scale: 'linear',
  },
  {
    id: 'kul-iphone', cat: 'Kultur',
    q: 'In welchem Jahr kam das erste iPhone auf den Markt?',
    answer: 2007, unit: '', min: 1990, max: 2020, scale: 'linear', step: 1, format: 'year',
  },
  {
    id: 'kul-friends', cat: 'Kultur',
    q: 'Wie viele Folgen hat die Serie „Friends"?',
    answer: 236, unit: 'Folgen', min: 20, max: 800, scale: 'log',
  },
  {
    id: 'kul-titanic-laenge', cat: 'Kultur',
    q: 'Wie lang ist der Film „Titanic" von 1997?',
    answer: 194, unit: 'Minuten', min: 60, max: 400, scale: 'linear',
  },
  {
    id: 'kul-titanic-oscars', cat: 'Kultur',
    q: 'Wie viele Oscars gewann „Titanic"?',
    answer: 11, unit: 'Oscars', min: 1, max: 30, scale: 'linear',
    note: 'Rekord, den sich der Film mit „Ben Hur" und „Herr der Ringe: Die Rückkehr des Königs" teilt.',
  },
  {
    id: 'kul-mona-lisa', cat: 'Kultur',
    q: 'Wie hoch ist das Gemälde „Mona Lisa"?',
    answer: 77, unit: 'cm', min: 10, max: 300, scale: 'log',
    note: 'Nur 77 × 53 cm – viele Besucher sind überrascht, wie klein es ist.',
  },
  {
    id: 'kul-wikipedia', cat: 'Kultur',
    q: 'In welchem Jahr wurde Wikipedia gegründet?',
    answer: 2001, unit: '', min: 1985, max: 2015, scale: 'linear', step: 1, format: 'year',
  },
  {
    id: 'kul-bohemian', cat: 'Kultur',
    q: 'Wie lang ist der Song „Bohemian Rhapsody"?',
    answer: 355, unit: 'Sekunden', min: 60, max: 900, scale: 'log',
    note: '5 Minuten und 55 Sekunden.',
  },
  {
    id: 'kul-eiffelturm', cat: 'Kultur',
    q: 'Wie hoch ist der Eiffelturm inklusive Antennen?',
    answer: 330, unit: 'm', min: 50, max: 1000, scale: 'log',
  },
  {
    id: 'kul-burj', cat: 'Kultur',
    q: 'Wie hoch ist der Burj Khalifa in Dubai?',
    answer: 828, unit: 'm', min: 100, max: 2000, scale: 'log',
  },
  {
    id: 'kul-mario', cat: 'Kultur',
    q: 'In welchem Jahr erschien „Super Mario Bros."?',
    answer: 1985, unit: '', min: 1970, max: 2005, scale: 'linear', step: 1, format: 'year',
  },
  {
    id: 'kul-skat', cat: 'Kultur',
    q: 'Wie viele Karten hat ein Skatblatt?',
    answer: 32, unit: 'Karten', min: 12, max: 200, scale: 'log',
  },
  {
    id: 'kul-mauer', cat: 'Kultur',
    q: 'Wie lang ist die Chinesische Mauer?',
    answer: 21196, unit: 'km', min: 1000, max: 100000, scale: 'log',
    note: 'Offizielle Vermessung von 2012, inklusive aller Seitenarme.',
  },
  {
    id: 'kul-eu-sprachen', cat: 'Kultur',
    q: 'Wie viele Amtssprachen hat die Europäische Union?',
    answer: 24, unit: 'Sprachen', min: 3, max: 60, scale: 'linear',
  },

  // ------------------------------------------------------- Politik & Gesellschaft
  {
    id: 'pol-eu', cat: 'Politik & Gesellschaft',
    q: 'Wie viele Mitgliedstaaten hat die EU?',
    answer: 27, unit: 'Staaten', min: 5, max: 60, scale: 'linear',
  },
  {
    id: 'pol-bundestag', cat: 'Politik & Gesellschaft',
    q: 'Wie viele Abgeordnete hat der aktuelle Bundestag?',
    answer: 630, unit: 'Abgeordnete', min: 200, max: 1200, scale: 'linear',
    note: 'Durch die Wahlrechtsreform ist die Größe seit der Wahl 2025 auf 630 Sitze gedeckelt.',
  },
  {
    id: 'pol-nato', cat: 'Politik & Gesellschaft',
    q: 'Wie viele Mitglieder hat die NATO?',
    answer: 32, unit: 'Mitglieder', min: 5, max: 80, scale: 'linear',
    note: 'Zuletzt kamen Finnland (2023) und Schweden (2024) dazu.',
  },
  {
    id: 'pol-grundgesetz', cat: 'Politik & Gesellschaft',
    q: 'In welchem Jahr trat das Grundgesetz in Kraft?',
    answer: 1949, unit: '', min: 1930, max: 1970, scale: 'linear', step: 1, format: 'year',
  },
  {
    id: 'pol-sicherheitsrat', cat: 'Politik & Gesellschaft',
    q: 'Wie viele Mitglieder hat der UN-Sicherheitsrat?',
    answer: 15, unit: 'Mitglieder', min: 3, max: 40, scale: 'linear',
    note: '5 ständige mit Vetorecht, 10 gewählte auf zwei Jahre.',
  },
  {
    id: 'pol-atomwaffen', cat: 'Politik & Gesellschaft',
    q: 'Wie viele Staaten besitzen Atomwaffen?',
    answer: 9, unit: 'Staaten', min: 1, max: 30, scale: 'linear',
  },
  {
    id: 'pol-europarat', cat: 'Politik & Gesellschaft',
    q: 'Wie viele Mitgliedsstaaten hat der Europarat?',
    answer: 46, unit: 'Staaten', min: 10, max: 100, scale: 'linear',
    note: 'Nicht zu verwechseln mit der EU – Russland wurde 2022 ausgeschlossen.',
  },
  {
    id: 'pol-mindestlohn', cat: 'Politik & Gesellschaft',
    q: 'Wie hoch ist der gesetzliche Mindestlohn in Deutschland im Jahr 2026?',
    answer: 13.90, unit: '€', min: 5, max: 25, scale: 'linear', step: 0.05, decimals: 2,
    note: 'Zum 1. Januar 2027 steigt er auf 14,60 €.',
  },
  {
    id: 'pol-einwohner-de', cat: 'Politik & Gesellschaft',
    q: 'Wie viele Einwohner hat Deutschland?',
    answer: 83500000, unit: 'Einwohner', min: 10000000, max: 300000000, scale: 'log',
  },
  {
    id: 'pol-weltbevoelkerung', cat: 'Politik & Gesellschaft',
    q: 'Wie viele Menschen leben auf der Erde?',
    answer: 8200000000, unit: 'Menschen', min: 1000000000, max: 30000000000, scale: 'log',
  },
  {
    id: 'pol-wahlbeteiligung', cat: 'Politik & Gesellschaft',
    q: 'Wie hoch war die Wahlbeteiligung bei der Bundestagswahl 2025?',
    answer: 82.5, unit: '%', min: 40, max: 100, scale: 'linear', step: 0.5, decimals: 1,
    note: 'Höchster Wert seit der Wiedervereinigung.',
  },
  {
    id: 'pol-roemische-vertraege', cat: 'Politik & Gesellschaft',
    q: 'In welchem Jahr wurden die Römischen Verträge unterzeichnet?',
    answer: 1957, unit: '', min: 1935, max: 1985, scale: 'linear', step: 1, format: 'year',
    note: 'Der Gründungsmoment der heutigen EU.',
  },
  {
    id: 'pol-durchschnittsalter', cat: 'Politik & Gesellschaft',
    q: 'Wie hoch ist das Durchschnittsalter in Deutschland?',
    answer: 45, unit: 'Jahre', min: 25, max: 85, scale: 'linear',
  },
  {
    id: 'pol-pkw', cat: 'Politik & Gesellschaft',
    q: 'Wie viele PKW sind in Deutschland zugelassen?',
    answer: 49000000, unit: 'PKW', min: 5000000, max: 200000000, scale: 'log',
  },
  {
    id: 'pol-erneuerbare', cat: 'Politik & Gesellschaft',
    q: 'Wie hoch war 2024 der Anteil erneuerbarer Energien am deutschen Stromverbrauch?',
    answer: 54, unit: '%', min: 0, max: 100, scale: 'linear', tol: 10,
  },
  {
    id: 'pol-geburten', cat: 'Politik & Gesellschaft',
    q: 'Wie viele Kinder wurden 2023 in Deutschland geboren?',
    answer: 693000, unit: 'Kinder', min: 100000, max: 3000000, scale: 'log',
  },
  {
    id: 'pol-internet', cat: 'Politik & Gesellschaft',
    q: 'Wie viele Menschen weltweit nutzen das Internet?',
    answer: 5500000000, unit: 'Menschen', min: 500000000, max: 10000000000, scale: 'log',
    note: 'Rund ein Drittel der Menschheit ist damit noch offline.',
  },
  {
    id: 'pol-mcdonalds', cat: 'Politik & Gesellschaft',
    q: 'Wie viele McDonald\'s-Filialen gibt es weltweit?',
    answer: 43000, unit: 'Filialen', min: 1000, max: 300000, scale: 'log',
  },
  {
    id: 'pol-netflix', cat: 'Politik & Gesellschaft',
    q: 'Wie viele zahlende Abos hatte Netflix Ende 2024 weltweit?',
    answer: 300000000, unit: 'Abos', min: 10000000, max: 2000000000, scale: 'log',
  },

  // -------------------------------------------------------------------- Sport
  {
    id: 'spo-marathon', cat: 'Sport',
    q: 'Wie lang ist ein Marathon?',
    answer: 42195, unit: 'm', min: 10000, max: 100000, scale: 'log', step: 5, tol: 2500,
  },
  {
    id: 'spo-basketball', cat: 'Sport',
    q: 'Wie hoch hängt ein Basketballkorb?',
    answer: 305, unit: 'cm', min: 150, max: 600, scale: 'linear',
  },
  {
    id: 'spo-fussball', cat: 'Sport',
    q: 'Wie schwer ist ein Fußball-Spielball?',
    answer: 430, unit: 'g', min: 100, max: 1500, scale: 'log',
    note: 'Erlaubt sind laut Regelwerk 410 bis 450 g.',
  },
  {
    id: 'spo-rugby', cat: 'Sport',
    q: 'Wie viele Spieler einer Rugby-Union-Mannschaft stehen auf dem Feld?',
    answer: 15, unit: 'Spieler', min: 5, max: 30, scale: 'linear',
  },
  {
    id: 'spo-dortmund', cat: 'Sport',
    q: 'Wie viele Zuschauer fasst das größte Stadion Deutschlands?',
    answer: 81365, unit: 'Plätze', min: 20000, max: 200000, scale: 'log',
    note: 'Der Signal Iduna Park in Dortmund.',
  },
  {
    id: 'spo-monaco', cat: 'Sport',
    q: 'Wie viele Runden hat das Formel-1-Rennen in Monaco?',
    answer: 78, unit: 'Runden', min: 20, max: 200, scale: 'linear',
  },
  {
    id: 'spo-klose', cat: 'Sport',
    q: 'Wie viele Tore schoss Miroslav Klose bei Weltmeisterschaften?',
    answer: 16, unit: 'Tore', min: 1, max: 40, scale: 'linear',
    note: 'Damit ist er bis heute WM-Rekordtorschütze.',
  },
];

/** Zieht `count` zufällige, verschiedene Fragen und gibt deren IDs zurück. */
export function drawQuestionIds(count = 10) {
  const pool = QUESTIONS.map((q) => q.id);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length));
}

const BY_ID = new Map(QUESTIONS.map((q) => [q.id, q]));

export function questionById(id) {
  return BY_ID.get(id) || null;
}
