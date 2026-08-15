// Supabase-Zugangsdaten.
//
// Diese beiden Werte sind KEIN Geheimnis – der anon-Schlüssel ist dafür
// gemacht, offen im Browser zu stehen. Der Schutz kommt aus den Richtlinien
// in supabase/schema.sql und daraus, dass man den Spielcode kennen muss.
//
// So kommst du an die Werte (ausführlich in der README):
//   1. https://supabase.com  ->  Projekt anlegen
//   2. SQL Editor  ->  Inhalt von supabase/schema.sql einfügen  ->  Run
//   3. Project Settings -> API  ->  Project URL und anon public key kopieren
//   4. Unten eintragen und die Datei committen
//
// Solange hier die Platzhalter stehen, läuft das Spiel im Offline-Testmodus:
// zwei Browser-Tabs auf demselben Gerät können gegeneinander spielen.

export const SUPABASE_CONFIG = {
  url: 'HIER_PROJECT_URL_EINSETZEN',
  anonKey: 'HIER_ANON_KEY_EINSETZEN',
};
