// Prüft den Fragenkatalog auf handwerkliche Fehler.
// Aufruf:  node tools/check-questions.mjs
//
// Sinnvoll immer dann, wenn du in js/questions.js Fragen ergänzt oder änderst.

import { QUESTIONS } from '../js/questions.js';
import { positionToValue, valueToPosition, snap, formatValue } from '../js/scale.js';
import { accuracyPoints, tolerance } from '../js/scoring.js';

const errors = [];
const warnings = [];
const seen = new Set();
const positions = [];

for (const q of QUESTIONS) {
  const tag = String(q.id).padEnd(24);
  const fail = (m) => errors.push(`${tag} ${m}`);
  const warn = (m) => warnings.push(`${tag} ${m}`);

  if (seen.has(q.id)) fail('doppelte ID');
  seen.add(q.id);

  for (const field of ['id', 'cat', 'q', 'answer', 'unit', 'min', 'max', 'scale']) {
    if (q[field] === undefined) fail(`Pflichtfeld fehlt: ${field}`);
  }
  if (!['linear', 'log'].includes(q.scale)) fail(`unbekannte Skala: ${q.scale}`);
  if (q.scale === 'log' && q.min <= 0) fail('log-Skala braucht min > 0');
  if (q.min >= q.max) fail('min ist nicht kleiner als max');
  if (!/[?]$/.test(String(q.q))) warn('Fragetext endet nicht mit einem Fragezeichen');

  if (q.answer < q.min || q.answer > q.max) {
    fail(`Antwort ${q.answer} liegt außerhalb von [${q.min}, ${q.max}]`);
    continue;
  }

  // Wo auf dem Regler liegt die richtige Antwort?
  const pos = valueToPosition(q.answer, q);
  positions.push(pos);
  if (pos < 0.06 || pos > 0.94) warn(`Antwort klebt am Reglerrand (${(pos * 100).toFixed(0)} %)`);

  // Lässt sich die richtige Antwort mit dem Raster überhaupt treffen?
  const best = snap(positionToValue(pos, q), q);
  const miss = (Math.abs(best - q.answer) / Math.abs(q.answer)) * 100;
  if (miss > 1.5) fail(`Antwort nicht treffbar – bestes Raster ${best} statt ${q.answer}`);

  // Toleranz: weder unmöglich noch geschenkt.
  const tol = tolerance(q);
  if (tol <= 0) fail('Toleranz ist 0 oder negativ');
  if (tol > (q.max - q.min) * 0.6) warn('sehr milde Toleranz');

  // Wer den Regler gar nicht anfasst, darf nicht belohnt werden.
  const lazy = snap(positionToValue(0.5, q), q);
  const lazyPoints = accuracyPoints(lazy, q);
  if (lazyPoints >= 85) {
    fail(`Mittelstellung gibt ${lazyPoints} Punkte geschenkt `
       + `(${formatValue(lazy, q)} statt ${formatValue(q.answer, q)}) – Grenzen verschieben`);
  }

  // Genug Abstufungen? Bei kleinen ganzzahligen Bereichen ist wenig normal.
  const distinct = new Set();
  for (let i = 0; i <= 1000; i++) distinct.add(snap(positionToValue(i / 1000, q), q));
  const possible = q.step ? (q.max - q.min) / q.step + 1 : q.max - q.min + 1;
  if (distinct.size < 25 && distinct.size < possible * 0.9) {
    warn(`nur ${distinct.size} einstellbare Werte`);
  }
}

const byCategory = {};
QUESTIONS.forEach((q) => { byCategory[q.cat] = (byCategory[q.cat] || 0) + 1; });

// Liegen die Antworten quer über den Regler verteilt, oder gibt es ein Muster,
// das man auswendig lernen könnte?
const buckets = [0, 0, 0, 0, 0];
positions.forEach((p) => { buckets[Math.min(4, Math.floor(p * 5))] += 1; });

console.log(`Fragen: ${QUESTIONS.length}`);
console.log('Kategorien: ' + Object.entries(byCategory).map(([k, v]) => `${k} ${v}`).join(' · '));
console.log('Antwortposition auf dem Regler: '
  + buckets.map((n, i) => `${i * 20}–${(i + 1) * 20}% ${n}`).join(' · '));

if (warnings.length) {
  console.log(`\nHinweise (${warnings.length}):`);
  warnings.forEach((w) => console.log('  · ' + w));
}
if (errors.length) {
  console.log(`\nFehler (${errors.length}):`);
  errors.forEach((e) => console.log('  ✗ ' + e));
  process.exit(1);
}
console.log('\nAlles in Ordnung.');
