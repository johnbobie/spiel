// Spielsteuerung und Oberfläche.

import { drawQuestionIds, questionById } from './questions.js';
import {
  positionToValue, valueToPosition, snap, stepSize,
  formatValue, formatNumber, formatDeviation,
} from './scale.js';
import { scoreQuestion, tally, DUEL_BONUS } from './scoring.js';
import { createTransport, isFirebaseConfigured, TransportError } from './transport.js';

const QUESTIONS_PER_GAME = 10;
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // ohne I und O
const CODE_LENGTH = 4;
const TICKS = 1000; // Auflösung des Reglers

const app = document.getElementById('app');

// Spieleridentität und laufendes Spiel liegen normalerweise im localStorage,
// damit ein Gerät nach dem Schließen der App wieder dasselbe Spiel findet.
// Im Testmodus wären beide Tabs sonst derselbe Spieler – dort also sessionStorage.
const seat = () => (isFirebaseConfigured() ? localStorage : sessionStorage);

const store = {
  get id() {
    let id = seat().getItem('spiel:id');
    if (!id) {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36);
      seat().setItem('spiel:id', id);
    }
    return id;
  },
  get name() { return seat().getItem('spiel:name') || ''; },
  set name(v) { seat().setItem('spiel:name', v); },
  get code() { return seat().getItem('spiel:code') || ''; },
  set code(v) { v ? seat().setItem('spiel:code', v) : seat().removeItem('spiel:code'); },
};

const state = {
  transport: null,
  code: '',
  slot: '',
  game: null,
  unwatch: null,
  draft: null,      // aktueller Reglerwert auf dem Frageschirm
  renderKey: '',
  busy: false,
  error: '',
};

/* ------------------------------------------------------------------- Helpers */

const other = (slot) => (slot === 'p1' ? 'p2' : 'p1');

function randomCode() {
  let out = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2).toLowerCase(), v);
    else node.setAttribute(k, v === true ? '' : String(v));
  }
  for (const child of children.flat()) {
    if (child == null || child === false) continue;
    node.append(child.nodeType ? child : document.createTextNode(String(child)));
  }
  return node;
}

function gameQuestions(game) {
  return (game.questionIds || []).map(questionById).filter(Boolean);
}

function progressOf(game, slot) {
  return (game.progress && game.progress[slot]) || 0;
}

function answerOf(game, index, slot) {
  const entry = game.answers && game.answers[index];
  return entry && entry[slot] ? entry[slot] : null;
}

function nameOf(game, slot) {
  return (game[slot] && game[slot].name) || (slot === 'p1' ? 'Spieler 1' : 'Spieler 2');
}

function gameLink(code) {
  const url = new URL(window.location.href);
  url.search = `?code=${code}`;
  url.hash = '';
  return url.toString();
}

function phaseOf(game, slot) {
  if (!game) return 'loading';
  if (!game.p2) return 'lobby';
  const total = (game.questionIds || []).length;
  const i = progressOf(game, slot);
  if (i >= total) return 'final';
  const mine = answerOf(game, i, slot);
  const theirs = answerOf(game, i, other(slot));
  if (!mine) return 'question';
  if (!theirs) return 'waiting';
  return 'reveal';
}

/* ------------------------------------------------------------- Spielaktionen */

async function withBusy(fn) {
  if (state.busy) return;
  state.busy = true;
  state.error = '';
  render();
  try {
    await fn();
  } catch (err) {
    state.error = err instanceof TransportError
      ? [err.message, err.hint].filter(Boolean).join(' ')
      : (err.message || String(err));
  } finally {
    state.busy = false;
    render();
  }
}

async function startGame(name) {
  store.name = name;
  const data = {
    createdAt: Date.now(),
    questionIds: drawQuestionIds(QUESTIONS_PER_GAME),
    p1: { id: store.id, name },
    progress: { p1: 0, p2: 0 },
  };
  for (let attempt = 0; attempt < 6; attempt++) {
    const code = randomCode();
    if (await state.transport.create(code, data)) {
      await enterGame(code, 'p1');
      return;
    }
  }
  throw new Error('Es konnte kein freier Spielcode gefunden werden. Bitte nochmal versuchen.');
}

async function joinGame(name, code) {
  store.name = name;
  const outcome = await state.transport.join(code, store.id, name);
  if (outcome === 'missing') throw new Error(`Zum Code ${code} gibt es kein Spiel.`);
  if (outcome === 'full') throw new Error(`Das Spiel ${code} hat schon zwei Spieler.`);
  await enterGame(code, outcome);
}

async function enterGame(code, slot) {
  state.unwatch?.();
  state.code = code;
  state.slot = slot;
  state.game = null;
  state.draft = null;
  state.renderKey = '';
  store.code = code;
  history.replaceState(null, '', `?code=${code}`);
  state.unwatch = state.transport.watch(code, (game) => {
    state.game = game;
    render();
  });
}

function leaveGame() {
  state.unwatch?.();
  state.unwatch = null;
  state.code = '';
  state.slot = '';
  state.game = null;
  state.draft = null;
  state.renderKey = '';
  store.code = '';
  history.replaceState(null, '', window.location.pathname);
  render();
}

async function submitGuess(index, value) {
  await state.transport.set(state.code, `answers/${index}/${state.slot}`, {
    value, at: Date.now(),
  });
  state.draft = null;
}

async function advance(index) {
  state.draft = null;
  await state.transport.set(state.code, `progress/${state.slot}`, index + 1);
}

async function startRematch() {
  const winner = await state.transport.claim(state.code, 'rematch', randomCode());
  const data = {
    createdAt: Date.now(),
    questionIds: drawQuestionIds(QUESTIONS_PER_GAME),
    p1: { id: state.game.p1.id, name: state.game.p1.name },
    p2: { id: state.game.p2.id, name: state.game.p2.name },
    progress: { p1: 0, p2: 0 },
  };
  await state.transport.create(winner, data);
  await enterGame(winner, state.slot);
}

async function share(code) {
  const link = gameLink(code);
  const text = `Spiel mit mir Schätzduell! Code ${code}: ${link}`;
  if (navigator.share) {
    try { await navigator.share({ title: 'Schätzduell', text, url: link }); return; } catch { /* abgebrochen */ }
  }
  try {
    await navigator.clipboard.writeText(link);
    toast('Link kopiert');
  } catch {
    toast(link);
  }
}

let toastTimer;
function toast(message) {
  let node = document.getElementById('toast');
  if (!node) {
    node = el('div', { id: 'toast', class: 'toast' });
    document.body.append(node);
  }
  node.textContent = message;
  node.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.classList.remove('is-visible'), 2200);
}

/* ------------------------------------------------------------- Bausteine */

function scoreBar(game, slot) {
  const questions = gameQuestions(game);
  const { a, b } = tally(questions, game.answers, slot, other(slot));
  return el('div', { class: 'scorebar' },
    el('div', { class: 'scorebar__side scorebar__side--me' },
      el('span', { class: 'scorebar__name' }, 'Du'),
      el('span', { class: 'scorebar__points' }, formatNumber(a))),
    el('span', { class: 'scorebar__vs' }, ':'),
    el('div', { class: 'scorebar__side scorebar__side--them' },
      el('span', { class: 'scorebar__name' }, nameOf(game, other(slot))),
      el('span', { class: 'scorebar__points' }, formatNumber(b))));
}

/**
 * Zahlenstrahl mit beiden Schätzungen und der Wahrheit.
 * Die beiden Schätzungen liegen auf zwei Zeilen, damit sich die Fähnchen auch
 * bei fast gleichen Werten nicht überdecken; nah am Rand rutscht das Fähnchen
 * nach innen, statt aus dem Bild zu laufen.
 */
function numberLine(q, mine, theirs, theirName) {
  const pos = (v) => valueToPosition(v, q);
  const edge = (p) => (p < 0.18 ? ' is-left' : p > 0.82 ? ' is-right' : '');
  const marker = (cls, p, ...content) => el('div', {
    class: `line__marker ${cls}${edge(p)}`,
    style: `left:${(p * 100).toFixed(2)}%`,
  }, ...content);

  const truth = marker('line__marker--truth', pos(q.answer),
    el('div', { class: 'line__flag line__flag--truth' }, formatValue(q.answer, q)),
    el('div', { class: 'line__stem' }));

  const order = mine <= theirs
    ? [['me', mine, 'Du'], ['them', theirs, theirName]]
    : [['them', theirs, theirName], ['me', mine, 'Du']];

  const guesses = order.map(([who, value, label], i) =>
    marker(`line__marker--${who} line__marker--row${i}`, pos(value),
      el('div', { class: 'line__stem' }),
      el('div', { class: `line__flag line__flag--${who}` },
        el('span', { class: 'line__who' }, label),
        el('span', {}, formatValue(value, q)))));

  return el('div', { class: 'line' },
    el('div', { class: 'line__track' }),
    truth,
    ...guesses,
    el('div', { class: 'line__bounds' },
      el('span', {}, formatValue(q.min, q)),
      el('span', {}, formatValue(q.max, q))));
}

/* --------------------------------------------------------------- Bildschirme */

function screenHome() {
  const savedCode = store.code;
  const nameInput = el('input', {
    class: 'field', id: 'name', type: 'text', maxlength: '18',
    placeholder: 'Dein Name', value: store.name, autocomplete: 'nickname',
  });
  const codeInput = el('input', {
    class: 'field field--code', id: 'code', type: 'text', maxlength: String(CODE_LENGTH),
    placeholder: 'CODE', inputmode: 'text', autocapitalize: 'characters',
    autocomplete: 'off', spellcheck: 'false',
    oninput: (e) => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z]/g, ''); },
  });

  const requireName = () => {
    const name = nameInput.value.trim();
    if (!name) { nameInput.focus(); toast('Bitte gib deinen Namen ein'); return null; }
    return name;
  };

  return el('div', { class: 'screen screen--home' },
    el('header', { class: 'hero' },
      el('div', { class: 'hero__mark' }, '◆'),
      el('h1', { class: 'hero__title' }, 'Schätzduell'),
      el('p', { class: 'hero__sub' }, '10 Fragen. Zwei Schätzungen. Wer liegt näher dran?')),

    savedCode && el('button', {
      class: 'btn btn--ghost btn--resume',
      onclick: () => withBusy(() => joinGame(store.name || 'Ich', savedCode)),
    }, `Laufendes Spiel fortsetzen · ${savedCode}`),

    el('div', { class: 'card' },
      el('label', { class: 'label', for: 'name' }, 'Wie heißt du?'),
      nameInput,
      el('button', {
        class: 'btn btn--primary',
        onclick: () => { const n = requireName(); if (n) withBusy(() => startGame(n)); },
      }, 'Neues Spiel starten')),

    el('div', { class: 'divider' }, el('span', {}, 'oder')),

    el('div', { class: 'card' },
      el('label', { class: 'label', for: 'code' }, 'Spielcode von deiner Mitspielerin'),
      codeInput,
      el('button', {
        class: 'btn',
        onclick: () => {
          const n = requireName();
          const c = codeInput.value.trim().toUpperCase();
          if (!n) return;
          if (c.length !== CODE_LENGTH) { codeInput.focus(); toast(`Der Code hat ${CODE_LENGTH} Buchstaben`); return; }
          withBusy(() => joinGame(n, c));
        },
      }, 'Spiel beitreten')),

    state.transport?.kind === 'local' && el('p', { class: 'hint' },
      'Testmodus: Firebase ist noch nicht eingerichtet, daher funktioniert das Spiel nur ',
      'zwischen zwei Tabs auf diesem Gerät. Die Einrichtung steht in der README.'));
}

function screenLobby(game) {
  return el('div', { class: 'screen screen--lobby' },
    el('h2', { class: 'screen__title' }, 'Warten auf Mitspielerin'),
    el('p', { class: 'screen__sub' }, 'Schick ihr diesen Code oder den Link — sobald sie beitritt, geht es los.'),
    el('div', { class: 'codebox' },
      el('span', { class: 'codebox__label' }, 'Spielcode'),
      el('strong', { class: 'codebox__code' }, state.code)),
    el('button', { class: 'btn btn--primary', onclick: () => share(state.code) }, 'Link teilen'),
    el('div', { class: 'waiting' }, el('span', { class: 'dots' }, el('i'), el('i'), el('i')),
      'Noch niemand beigetreten'),
    el('p', { class: 'hint' }, 'Du kannst die App zumachen — das Spiel wartet auf euch.'),
    el('button', { class: 'btn btn--ghost', onclick: leaveGame }, 'Abbrechen'));
}

function screenQuestion(game, index) {
  const questions = gameQuestions(game);
  const q = questions[index];

  if (state.draft == null) {
    state.draft = snap(positionToValue(0.5, q), q);
  }

  const valueOut = el('output', { class: 'guess__value' }, formatValue(state.draft, q));
  const slider = el('input', {
    class: 'slider', type: 'range', min: '0', max: String(TICKS), step: '1',
    value: String(Math.round(valueToPosition(state.draft, q) * TICKS)),
    'aria-label': 'Deine Schätzung',
  });

  const setValue = (v, syncSlider) => {
    state.draft = snap(v, q);
    valueOut.textContent = formatValue(state.draft, q);
    if (syncSlider) slider.value = String(Math.round(valueToPosition(state.draft, q) * TICKS));
  };

  slider.addEventListener('input', () => {
    setValue(positionToValue(Number(slider.value) / TICKS, q), false);
  });

  const nudge = (dir) => setValue(state.draft + dir * stepSize(state.draft, q), true);

  return el('div', { class: 'screen screen--question' },
    scoreBar(game, state.slot),
    el('div', { class: 'qhead' },
      el('span', { class: 'chip' }, q.cat),
      el('span', { class: 'qhead__count' }, `Frage ${index + 1} von ${questions.length}`)),
    el('h2', { class: 'question' }, q.q),
    el('div', { class: 'guess' },
      valueOut,
      el('div', { class: 'sliderwrap' },
        slider,
        el('div', { class: 'sliderwrap__bounds' },
          el('span', {}, formatValue(q.min, q)),
          el('span', {}, formatValue(q.max, q)))),
      el('div', { class: 'nudge' },
        el('button', { class: 'nudge__btn', 'aria-label': 'Weniger', onclick: () => nudge(-1) }, '−'),
        el('span', { class: 'nudge__hint' }, 'fein justieren'),
        el('button', { class: 'nudge__btn', 'aria-label': 'Mehr', onclick: () => nudge(1) }, '+'))),
    el('button', {
      class: 'btn btn--primary btn--big',
      onclick: () => withBusy(() => submitGuess(index, state.draft)),
    }, 'Schätzung abgeben'));
}

function screenWaiting(game, index) {
  const q = gameQuestions(game)[index];
  const mine = answerOf(game, index, state.slot);
  return el('div', { class: 'screen screen--waiting' },
    scoreBar(game, state.slot),
    el('div', { class: 'qhead' },
      el('span', { class: 'chip' }, q.cat),
      el('span', { class: 'qhead__count' }, `Frage ${index + 1} von ${gameQuestions(game).length}`)),
    el('h2', { class: 'question question--muted' }, q.q),
    el('div', { class: 'lockedguess' },
      el('span', { class: 'lockedguess__label' }, 'Deine Schätzung steht'),
      el('strong', { class: 'lockedguess__value' }, formatValue(mine.value, q))),
    el('div', { class: 'waiting' }, el('span', { class: 'dots' }, el('i'), el('i'), el('i')),
      `Warte auf ${nameOf(game, other(state.slot))} …`),
    el('p', { class: 'hint' }, 'Du kannst die App zumachen — sobald sie geschätzt hat, siehst du hier die Auflösung.'),
    el('button', { class: 'btn btn--ghost', onclick: () => share(state.code) }, 'Anstupsen: Link schicken'));
}

function screenReveal(game, index) {
  const questions = gameQuestions(game);
  const q = questions[index];
  const mine = answerOf(game, index, state.slot).value;
  const theirs = answerOf(game, index, other(state.slot)).value;
  const theirName = nameOf(game, other(state.slot));
  const res = scoreQuestion(mine, theirs, q);
  const won = res.winner === 'a';
  const tie = res.winner === 'tie';

  const row = (label, value, r, isMe) => el('div', {
    class: `result ${isMe ? 'result--me' : 'result--them'} ${r.duel > 0 && !tie ? 'is-winner' : ''}`,
  },
    el('div', { class: 'result__top' },
      el('span', { class: 'result__name' }, label),
      el('span', { class: 'result__guess' }, formatValue(value, q))),
    el('div', { class: 'result__bottom' },
      el('span', { class: 'result__dev' }, formatDeviation(value, q)),
      el('span', { class: 'result__pts' }, `+${r.total}`)));

  const headline = tie ? 'Unentschieden!' : won ? 'Du bist näher dran!' : `${theirName} ist näher dran!`;
  const bonus = tie
    ? `Gleich weit daneben — je +${res.a.duel} Bonuspunkte.`
    : `+${DUEL_BONUS} Bonuspunkte für die nähere Schätzung, dazu die Genauigkeit.`;

  return el('div', { class: 'screen screen--reveal' },
    scoreBar(game, state.slot),
    el('div', { class: 'truth' },
      el('span', { class: 'truth__label' }, 'Richtige Antwort'),
      el('strong', { class: 'truth__value' }, formatValue(q.answer, q))),
    el('p', { class: 'question question--small' }, q.q),
    numberLine(q, mine, theirs, theirName),
    el('h3', { class: `verdict ${tie ? '' : won ? 'verdict--win' : 'verdict--lose'}` }, headline),
    el('p', { class: 'verdict__sub' }, bonus),
    el('div', { class: 'results' },
      row('Du', mine, res.a, true),
      row(theirName, theirs, res.b, false)),
    q.note && el('p', { class: 'note' }, q.note),
    el('button', {
      class: 'btn btn--primary btn--big',
      onclick: () => withBusy(() => advance(index)),
    }, index + 1 >= questions.length ? 'Endstand ansehen' : 'Nächste Frage'));
}

function screenFinal(game) {
  const questions = gameQuestions(game);
  const { a, b, rounds } = tally(questions, game.answers, state.slot, other(state.slot));
  const theirName = nameOf(game, other(state.slot));
  const headline = a === b ? 'Unentschieden!' : a > b ? 'Du gewinnst!' : `${theirName} gewinnt!`;

  const breakdown = rounds.map((r) => el('li', { class: 'summary__row' },
    el('span', { class: 'summary__q' }, r.q.q),
    el('span', { class: 'summary__truth' }, formatValue(r.q.answer, r.q)),
    el('span', { class: `summary__pts ${r.a.total >= r.b.total ? 'is-lead' : ''}` }, r.a.total),
    el('span', { class: `summary__pts ${r.b.total >= r.a.total ? 'is-lead' : ''}` }, r.b.total)));

  const otherDone = progressOf(game, other(state.slot)) >= questions.length;

  return el('div', { class: 'screen screen--final' },
    el('h2', { class: `verdict verdict--final ${a === b ? '' : a > b ? 'verdict--win' : 'verdict--lose'}` }, headline),
    el('div', { class: 'finalscore' },
      el('span', { class: 'finalscore__name' }, 'Du'),
      el('span', {}),
      el('span', { class: 'finalscore__name' }, theirName),
      el('strong', { class: 'finalscore__pts finalscore__pts--me' }, formatNumber(a)),
      el('span', { class: 'finalscore__vs' }, ':'),
      el('strong', { class: 'finalscore__pts finalscore__pts--them' }, formatNumber(b))),

    el('ol', { class: 'summary' },
      el('li', { class: 'summary__row summary__row--head' },
        el('span', { class: 'summary__q' }, 'Frage'),
        el('span', { class: 'summary__truth' }, 'Antwort'),
        el('span', { class: 'summary__pts' }, 'Du'),
        el('span', { class: 'summary__pts' }, theirName.slice(0, 8))),
      ...breakdown),

    !otherDone && el('p', { class: 'hint' }, `${theirName} schaut sich die letzte Auflösung noch an.`),

    el('div', { class: 'actions' },
      el('button', { class: 'btn btn--primary', onclick: () => withBusy(startRematch) },
        game.rematch ? 'Revanche läuft — mitspielen' : 'Revanche'),
      el('button', { class: 'btn btn--ghost', onclick: leaveGame }, 'Zurück zum Start')));
}

function screenSetupError(err) {
  return el('div', { class: 'screen' },
    el('h2', { class: 'screen__title' }, 'Firebase-Verbindung klemmt'),
    el('div', { class: 'card card--error' },
      el('p', {}, err.message),
      err.hint && el('p', { class: 'hint' }, err.hint)),
    el('p', { class: 'hint' }, 'Die Schritt-für-Schritt-Einrichtung steht in der README des Projekts.'));
}

/* ------------------------------------------------------------------- Rendern */

function render() {
  const game = state.game;
  let key;
  let view;

  if (!state.transport) {
    key = 'boot';
    view = el('div', { class: 'screen' }, el('div', { class: 'waiting' },
      el('span', { class: 'dots' }, el('i'), el('i'), el('i')), 'Verbinde …'));
  } else if (!state.code) {
    key = 'home';
    view = screenHome();
  } else if (!game) {
    key = 'load';
    view = el('div', { class: 'screen' }, el('div', { class: 'waiting' },
      el('span', { class: 'dots' }, el('i'), el('i'), el('i')), 'Lade Spiel …'));
  } else {
    const phase = phaseOf(game, state.slot);
    const index = progressOf(game, state.slot);
    key = `${phase}:${index}:${state.code}`;
    if (phase === 'lobby') view = screenLobby(game);
    else if (phase === 'question') view = screenQuestion(game, index);
    else if (phase === 'waiting') view = screenWaiting(game, index);
    else if (phase === 'reveal') view = screenReveal(game, index);
    else view = screenFinal(game);
  }

  // Den Frageschirm nicht neu aufbauen, solange dieselbe Frage offen ist –
  // sonst springt der Regler bei jedem Datenbank-Update zurück.
  if (key === state.renderKey && key.startsWith('question:')) {
    updateChrome();
    return;
  }

  state.renderKey = key;
  app.replaceChildren(view);
  updateChrome();
  window.scrollTo(0, 0);
}

function updateChrome() {
  document.body.classList.toggle('is-busy', state.busy);
  let banner = document.getElementById('error');
  if (state.error) {
    if (!banner) {
      banner = el('div', { id: 'error', class: 'errorbar' });
      document.body.prepend(banner);
    }
    banner.replaceChildren(
      el('span', {}, state.error),
      el('button', {
        class: 'errorbar__close', 'aria-label': 'Schließen',
        onclick: () => { state.error = ''; updateChrome(); },
      }, '×'));
  } else if (banner) {
    banner.remove();
  }
}

/* -------------------------------------------------------------------- Start */

async function boot() {
  render();
  try {
    state.transport = await createTransport();
  } catch (err) {
    app.replaceChildren(screenSetupError(err));
    return;
  }

  const fromLink = new URLSearchParams(window.location.search).get('code');
  const code = (fromLink || '').toUpperCase().replace(/[^A-Z]/g, '');
  const resume = code.length === CODE_LENGTH ? code : store.code;

  // Mit bekanntem Namen direkt einsteigen – egal ob über geteilten Link
  // oder über das zuletzt gespielte Spiel auf diesem Gerät.
  if (resume && store.name) {
    await withBusy(() => joinGame(store.name, resume));
    if (!state.error) return;
    history.replaceState(null, '', window.location.pathname);
    if (!fromLink) {
      // Nur ein veralteter Eintrag vom letzten Mal – kommentarlos verwerfen.
      state.error = '';
      store.code = '';
      render();
    }
    return;
  }

  render();
  if (code.length === CODE_LENGTH) {
    const field = document.getElementById('code');
    if (field) field.value = code;
  }
}

if (!isFirebaseConfigured()) {
  console.info('Schätzduell läuft im lokalen Testmodus – js/config.js ausfüllen für echtes Zwei-Geräte-Spiel.');
}

boot();
