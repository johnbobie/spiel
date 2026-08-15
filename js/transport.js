// Verbindung zwischen den Geräten.
//
// Zwei austauschbare Backends hinter derselben API:
//   • supabase – Postgres + Realtime, damit zwei echte Geräte zusammenspielen
//   • local    – localStorage + BroadcastChannel, damit man das Spiel auch
//                ohne Supabase-Projekt in zwei Browser-Tabs ausprobieren kann
//
// Gemeinsame API:
//   createGame(code, { questionIds, host, guest? })  -> true, wenn der Code frei war
//   joinGame(code, playerId, name)                   -> 'p1' | 'p2' | 'full' | 'missing'
//   watch(code, cb)                                  -> unsubscribe
//   submitAnswer(code, slot, index, value)           -> Promise
//   setProgress(code, slot, index)                   -> Promise
//   claimRematch(code, candidate)                    -> der gültige Revanche-Code
//
// `watch` liefert das Spiel immer in dieser Form:
//   { questionIds, p1, p2, progress: { p1, p2 }, answers: { [i]: { p1, p2 } }, rematch }

import { SUPABASE_CONFIG } from './config.js';

const SDK = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.112.3/+esm';

// Realtime ist der schnelle Weg; zusätzlich wird regelmäßig nachgeschaut,
// damit ein Spiel auch dann weiterläuft, wenn die Live-Verbindung klemmt.
const POLL_MS = 5000;

export function isSupabaseConfigured() {
  const c = SUPABASE_CONFIG;
  return Boolean(
    c && c.url && c.anonKey
    && !String(c.url).startsWith('HIER_')
    && !String(c.anonKey).startsWith('HIER_'),
  );
}

export class TransportError extends Error {
  constructor(message, hint) {
    super(message);
    this.hint = hint;
  }
}

/* ------------------------------------------------------------------ Supabase */

/** Übersetzt Postgres-Fehler in etwas, das man auch ohne SQL-Kenntnisse versteht. */
function toTransportError(error, action) {
  const code = String(error.code || '');
  const text = String(error.message || '');

  if (code === '42P01' || /relation .* does not exist/i.test(text)) {
    return new TransportError(
      'Die Datenbanktabellen fehlen.',
      'supabase/schema.sql im SQL-Editor von Supabase einmal ausführen.',
    );
  }
  if (code === '42501' || /row-level security/i.test(text)) {
    return new TransportError(
      'Die Datenbank verweigert den Zugriff.',
      'Die Richtlinien aus supabase/schema.sql fehlen – Skript nochmal ausführen.',
    );
  }
  if (/JWT|API key|Invalid authentication/i.test(text)) {
    return new TransportError(
      'Der anon-Schlüssel wird nicht akzeptiert.',
      'In js/config.js den anon public key aus Project Settings → API prüfen.',
    );
  }
  if (/fetch|network|Failed to fetch/i.test(text)) {
    return new TransportError(
      'Keine Verbindung zur Datenbank.',
      'Internetverbindung prüfen und ob die Project URL in js/config.js stimmt.',
    );
  }
  return new TransportError(`${action} fehlgeschlagen: ${text}`);
}

/** Aus den beiden Tabellen wird die Spielstruktur, die die App erwartet. */
function shapeGame(row, answerRows) {
  const answers = {};
  for (const a of answerRows || []) {
    if (!answers[a.q_index]) answers[a.q_index] = {};
    answers[a.q_index][a.slot] = { value: a.value };
  }
  return {
    questionIds: row.question_ids || [],
    p1: row.p1_id ? { id: row.p1_id, name: row.p1_name } : null,
    p2: row.p2_id ? { id: row.p2_id, name: row.p2_name } : null,
    progress: { p1: row.p1_progress || 0, p2: row.p2_progress || 0 },
    answers,
    rematch: row.rematch || null,
  };
}

async function createSupabaseTransport() {
  let createClient;
  try {
    ({ createClient } = await import(SDK));
  } catch (err) {
    throw new TransportError(
      'Die Supabase-Bibliothek konnte nicht geladen werden.',
      `Internetverbindung prüfen (${err.message}).`,
    );
  }

  const db = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const unwrap = (result, action) => {
    if (result.error) throw toTransportError(result.error, action);
    return result.data;
  };

  const readGame = async (code) => {
    const row = unwrap(
      await db.from('games').select('*').eq('code', code).maybeSingle(),
      'Spiel laden',
    );
    if (!row) return null;
    const answers = unwrap(
      await db.from('answers').select('q_index, slot, value').eq('code', code),
      'Schätzungen laden',
    );
    return shapeGame(row, answers);
  };

  // Aktive Beobachter je Spielcode. Nach eigenen Schreibzugriffen wird der
  // Spielstand sofort neu geladen, statt auf Realtime oder den Takt zu warten.
  const loaders = new Map();
  const refresh = (code) => loaders.get(code)?.() ?? Promise.resolve();

  return {
    kind: 'supabase',

    async createGame(code, { questionIds, host, guest }) {
      // „ignoreDuplicates" lässt Postgres den Konflikt selbst abfangen: Ist der
      // Code schon vergeben, kommt einfach keine Zeile zurück. Das macht auch
      // die Revanche gefahrlos, bei der beide Geräte gleichzeitig anlegen.
      const rows = unwrap(
        await db.from('games')
          .upsert({
            code,
            question_ids: questionIds,
            p1_id: host.id,
            p1_name: host.name,
            p2_id: guest ? guest.id : null,
            p2_name: guest ? guest.name : null,
          }, { onConflict: 'code', ignoreDuplicates: true })
          .select('code'),
        'Spiel anlegen',
      );
      return Boolean(rows && rows.length);
    },

    async joinGame(code, playerId, name) {
      const row = unwrap(
        await db.from('games').select('code, p1_id, p2_id').eq('code', code).maybeSingle(),
        'Spiel suchen',
      );
      if (!row) return 'missing';

      // Rückkehr auf denselben Platz – nur der Name wird aufgefrischt.
      if (row.p1_id === playerId) {
        unwrap(await db.from('games').update({ p1_name: name }).eq('code', code), 'Beitreten');
        return 'p1';
      }
      if (row.p2_id === playerId) {
        unwrap(await db.from('games').update({ p2_name: name }).eq('code', code), 'Beitreten');
        return 'p2';
      }
      if (row.p2_id) return 'full';

      // Platz 2 belegen. Die Bedingung „nur wenn noch frei" macht das atomar,
      // auch wenn zwei Geräte im selben Moment beitreten.
      const claimed = unwrap(
        await db.from('games')
          .update({ p2_id: playerId, p2_name: name })
          .eq('code', code).is('p2_id', null)
          .select('p2_id'),
        'Beitreten',
      );
      if (claimed && claimed.length) return 'p2';

      const after = unwrap(
        await db.from('games').select('p2_id').eq('code', code).maybeSingle(),
        'Beitreten',
      );
      return after && after.p2_id === playerId ? 'p2' : 'full';
    },

    watch(code, cb) {
      let stopped = false;
      let running = false;
      let rerun = false;

      const load = async () => {
        if (stopped) return;
        // Läuft schon eine Abfrage, danach genau einmal nachlegen – sonst
        // ginge eine Änderung verloren, die währenddessen eingetroffen ist.
        if (running) { rerun = true; return; }
        running = true;
        try {
          do {
            rerun = false;
            const game = await readGame(code);
            if (!stopped) cb(game);
          } while (rerun && !stopped);
        } catch (err) {
          console.warn('Spielstand konnte nicht geladen werden:', err.message);
        } finally {
          running = false;
        }
      };
      loaders.set(code, load);

      const channel = db.channel(`spiel:${code}`)
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'games', filter: `code=eq.${code}` }, load)
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'answers', filter: `code=eq.${code}` }, load)
        .subscribe();

      const timer = setInterval(() => {
        if (document.visibilityState === 'visible') load();
      }, POLL_MS);

      // Nach dem Zurückholen aus dem Hintergrund sofort nachschauen.
      const onVisible = () => { if (document.visibilityState === 'visible') load(); };
      document.addEventListener('visibilitychange', onVisible);

      load();

      return () => {
        stopped = true;
        if (loaders.get(code) === load) loaders.delete(code);
        clearInterval(timer);
        document.removeEventListener('visibilitychange', onVisible);
        db.removeChannel(channel);
      };
    },

    async submitAnswer(code, slot, index, value) {
      unwrap(
        await db.from('answers')
          .upsert({ code, q_index: index, slot, value }, { onConflict: 'code,q_index,slot' }),
        'Schätzung speichern',
      );
      await refresh(code);
    },

    async setProgress(code, slot, index) {
      const column = slot === 'p1' ? 'p1_progress' : 'p2_progress';
      unwrap(
        await db.from('games').update({ [column]: index }).eq('code', code),
        'Fortschritt speichern',
      );
      await refresh(code);
    },

    async claimRematch(code, candidate) {
      const claimed = unwrap(
        await db.from('games')
          .update({ rematch: candidate })
          .eq('code', code).is('rematch', null)
          .select('rematch'),
        'Revanche starten',
      );
      if (claimed && claimed.length) return candidate;

      const row = unwrap(
        await db.from('games').select('rematch').eq('code', code).maybeSingle(),
        'Revanche starten',
      );
      return (row && row.rematch) || candidate;
    },
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
  const notify = (code) => {
    const game = read(code);
    watchers.get(code)?.forEach((cb) => cb(game));
  };
  const write = (code, game) => {
    localStorage.setItem(KEY(code), JSON.stringify(game));
    notify(code);
    channel?.postMessage(code);
  };

  channel?.addEventListener('message', (e) => notify(e.data));
  window.addEventListener('storage', (e) => {
    if (e.key?.startsWith('spiel:game:')) notify(e.key.slice('spiel:game:'.length));
  });

  return {
    kind: 'local',

    async createGame(code, { questionIds, host, guest }) {
      if (read(code)) return false;
      write(code, {
        questionIds,
        p1: { id: host.id, name: host.name },
        p2: guest ? { id: guest.id, name: guest.name } : null,
        progress: { p1: 0, p2: 0 },
        answers: {},
        rematch: null,
      });
      return true;
    },

    async joinGame(code, playerId, name) {
      const game = read(code);
      if (!game) return 'missing';
      if (game.p1 && game.p1.id === playerId) { game.p1.name = name; write(code, game); return 'p1'; }
      if (game.p2 && game.p2.id === playerId) { game.p2.name = name; write(code, game); return 'p2'; }
      if (game.p2) return 'full';
      game.p2 = { id: playerId, name };
      write(code, game);
      return 'p2';
    },

    watch(code, cb) {
      if (!watchers.has(code)) watchers.set(code, new Set());
      watchers.get(code).add(cb);
      queueMicrotask(() => cb(read(code)));
      return () => watchers.get(code)?.delete(cb);
    },

    async submitAnswer(code, slot, index, value) {
      const game = read(code);
      if (!game) return;
      if (!game.answers) game.answers = {};
      if (!game.answers[index]) game.answers[index] = {};
      game.answers[index][slot] = { value };
      write(code, game);
    },

    async setProgress(code, slot, index) {
      const game = read(code);
      if (!game) return;
      game.progress = { ...game.progress, [slot]: index };
      write(code, game);
    },

    async claimRematch(code, candidate) {
      const game = read(code);
      if (!game) return candidate;
      if (game.rematch) return game.rematch;
      game.rematch = candidate;
      write(code, game);
      return candidate;
    },
  };
}

/* -------------------------------------------------------------------- Factory */

export async function createTransport() {
  if (isSupabaseConfigured()) return createSupabaseTransport();
  return createLocalTransport();
}
