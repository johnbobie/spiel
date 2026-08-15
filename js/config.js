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
  url: 'https://npbhujmryvuqnznenbjv.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wYmh1am1yeXZ1cW56bmVuYmp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3ODMwMDMsImV4cCI6MjEwMjM1OTAwM30.Ha3B8fODx1H_jgShA186mQ1IptI7RAqygtd6B5DAkRQ',
};
