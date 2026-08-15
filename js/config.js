// Firebase-Zugangsdaten.
//
// Diese Werte sind KEIN Geheimnis – sie stehen bei jeder Firebase-Web-App
// offen im Quelltext. Der Schutz kommt aus den Datenbank-Regeln (siehe README).
//
// So kommst du an die Werte:
//   1. https://console.firebase.google.com  ->  Projekt anlegen
//   2. Build -> Realtime Database -> Datenbank erstellen (Region Europa)
//   3. Build -> Authentication -> Sign-in method -> „Anonym" aktivieren
//   4. Projektübersicht -> Web-App (</>) hinzufügen -> Config kopieren
//   5. Die Werte unten ersetzen und die Datei committen
//
// Solange hier die Platzhalter stehen, läuft das Spiel im Offline-Testmodus:
// zwei Browser-Tabs auf demselben Gerät können gegeneinander spielen.

export const FIREBASE_CONFIG = {
  apiKey: 'HIER_API_KEY_EINSETZEN',
  authDomain: 'HIER_PROJEKT.firebaseapp.com',
  databaseURL: 'https://HIER_PROJEKT-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'HIER_PROJEKT',
  appId: 'HIER_APP_ID',
};
