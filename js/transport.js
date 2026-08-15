// Verbindung zwischen den Geräten.
//
// Zwei austauschbare Backends hinter derselben API:
//   • firebase – Realtime Database, damit zwei echte Geräte zusammenspielen
//   • local    – localStorage + BroadcastChannel, damit man das Spiel auch
//                ohne Firebase-Projekt in zwei Browser-Tabs ausprobieren kann
//
// Gemeinsame API:
//   create(code, data)          -> true, wenn der Code noch frei war
//   join(code, playerId, name)  -> 'p1' | 'p2' | 'full' | 'missing'
//   watch(code, cb)             -> unsubscribe
//   set(code, path, value)      -> Promise
//   claim(code, path, value)    -> schreibt nur, wenn das Feld leer ist,
//                                  und liefert immer den gültigen Wert zurück

import { FIREBASE_CONFIG } from './config.js';

const SDK = 'https://www.gstatic.com/firebasejs/12.0.0';

export function isFirebaseConfigured() {
  const c = FIREBASE_CONFIG;
  return Boolean(c && c.apiKey && c.databaseURL && !String(c.apiKey).startsWith('HIER_'));
}

export class TransportError extends Error {
  constructor(message, hint) {
    super(message);
    this.hint = hint;
  }
}

/* ------------------------------------------------------------------ Firebase */

async function createFirebaseTransport() {
  const [appMod, authMod, dbMod] = await Promise.all([
    import(`${SDK}/firebase-app.js`),
    import(`${SDK}/firebase-auth.js`),
    import(`${SDK}/firebase-database.js`),
  ]);

  const app = appMod.initializeApp(FIREBASE_CONFIG);
  const auth = authMod.getAuth(app);

  try {
    await authMod.signInAnonymously(auth);
  } catch (err) {
    if (String(err.code || '').includes('operation-not-allowed') ||
        String(err.code || '').includes('admin-restricted-operation')) {
      throw new TransportError(
        'Anonyme Anmeldung ist in deinem Firebase-Projekt nicht aktiviert.',
        'Firebase Console → Authentication → Sign-in method → „Anonym" aktivieren.',
      );
    }
    throw new TransportError(`Anmeldung bei Firebase fehlgeschlagen: ${err.message}`);
  }

  const db = dbMod.getDatabase(app);
  const gameRef = (code, path) =>
    dbMod.ref(db, path ? `games/${code}/${path}` : `games/${code}`);

  const wrap = async (fn, action) => {
    try {
      return await fn();
    } catch (err) {
      if (String(err.message || '').toLowerCase().includes('permission')) {
        throw new TransportError(
          `Die Datenbank hat den Zugriff verweigert (${action}).`,
          'Prüfe die Regeln der Realtime Database – siehe README.',
        );
      }
      throw new TransportError(`${action} fehlgeschlagen: ${err.message}`);
    }
  };

  return {
    kind: 'firebase',

    create: (code, data) =>
      wrap(async () => {
        const res = await dbMod.runTransaction(gameRef(code), (current) =>
          current === null ? data : undefined);
        return res.committed;
      }, 'Spiel anlegen'),

    join: (code, playerId, name) =>
      wrap(async () => {
        let outcome = 'missing';
        await dbMod.runTransaction(gameRef(code), (game) => {
          if (game === null) { outcome = 'missing'; return undefined; }
          if (game.p1 && game.p1.id === playerId) {
            outcome = 'p1';
            game.p1.name = name;
            return game;
          }
          if (game.p2 && game.p2.id === playerId) {
            outcome = 'p2';
            game.p2.name = name;
            return game;
          }
          if (!game.p2) {
            outcome = 'p2';
            game.p2 = { id: playerId, name };
            return game;
          }
          outcome = 'full';
          return undefined;
        });
        return outcome;
      }, 'Spiel beitreten'),

    watch: (code, cb) => {
      const unsub = dbMod.onValue(gameRef(code), (snap) => cb(snap.val()));
      return () => unsub();
    },

    set: (code, path, value) =>
      wrap(() => dbMod.set(gameRef(code, path), value), 'Speichern'),

    claim: (code, path, value) =>
      wrap(async () => {
        let winner = value;
        await dbMod.runTransaction(gameRef(code, path), (current) => {
          if (current == null) return value;
          winner = current;
          return undefined;
        });
        return winner;
      }, 'Reservieren'),
  };
}

/* --------------------------------------------------------------------- Local */

function createLocalTransport() {
  const KEY = (code) => `spiel:game:${code}`;
  const channel = 'BroadcastChannel' in window ? new BroadcastChannel('spiel') : null;
  const watchers = new Map(); // code -> Set<cb>

  const read = (code) => {
    try { return JSON.parse(localStorage.getItem(KEY(code))); } catch { return null; }
  };
  const write = (code, game) => {
    localStorage.setItem(KEY(code), JSON.stringify(game));
    notify(code);
    channel?.postMessage(code);
  };
  const notify = (code) => {
    const game = read(code);
    watchers.get(code)?.forEach((cb) => cb(game));
  };

  channel?.addEventListener('message', (e) => notify(e.data));
  window.addEventListener('storage', (e) => {
    if (e.key?.startsWith('spiel:game:')) notify(e.key.slice('spiel:game:'.length));
  });

  return {
    kind: 'local',

    async create(code, data) {
      if (read(code)) return false;
      write(code, data);
      return true;
    },

    async join(code, playerId, name) {
      const game = read(code);
      if (!game) return 'missing';
      if (game.p1 && game.p1.id === playerId) { game.p1.name = name; write(code, game); return 'p1'; }
      if (game.p2 && game.p2.id === playerId) { game.p2.name = name; write(code, game); return 'p2'; }
      if (!game.p2) { game.p2 = { id: playerId, name }; write(code, game); return 'p2'; }
      return 'full';
    },

    watch(code, cb) {
      if (!watchers.has(code)) watchers.set(code, new Set());
      watchers.get(code).add(cb);
      queueMicrotask(() => cb(read(code)));
      return () => watchers.get(code)?.delete(cb);
    },

    async set(code, path, value) {
      const game = read(code);
      if (!game) return;
      const parts = path.split('/');
      let node = game;
      for (let i = 0; i < parts.length - 1; i++) {
        if (typeof node[parts[i]] !== 'object' || node[parts[i]] === null) node[parts[i]] = {};
        node = node[parts[i]];
      }
      node[parts[parts.length - 1]] = value;
      write(code, game);
    },

    async claim(code, path, value) {
      const game = read(code);
      if (!game) return value;
      const current = path.split('/').reduce((n, k) => (n == null ? n : n[k]), game);
      if (current != null) return current;
      await this.set(code, path, value);
      return value;
    },
  };
}

/* -------------------------------------------------------------------- Factory */

export async function createTransport() {
  if (isFirebaseConfigured()) return createFirebaseTransport();
  return createLocalTransport();
}
