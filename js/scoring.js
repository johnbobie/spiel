// Punktevergabe: Genauigkeit (0–100) plus Duellbonus für die nähere Schätzung.

export const DUEL_BONUS = 50;
export const DUEL_TIE_BONUS = 25;

/** Abweichung, ab der es keine Genauigkeitspunkte mehr gibt. */
export function tolerance(q) {
  if (q.tol != null) return q.tol;
  if (q.scale === 'log') return Math.abs(q.answer) * 0.5;
  return (q.max - q.min) * 0.15;
}

/** 0–100 Punkte, linear abfallend bis zur Toleranzgrenze. */
export function accuracyPoints(guess, q) {
  if (guess == null || !Number.isFinite(guess)) return 0;
  const err = Math.abs(guess - q.answer);
  const frac = Math.min(1, err / tolerance(q));
  return Math.round(100 * (1 - frac));
}

/**
 * Wertet eine Frage für beide Spieler aus.
 * Fehlt eine Schätzung, gewinnt die vorhandene kampflos.
 */
export function scoreQuestion(guessA, guessB, q) {
  const accA = accuracyPoints(guessA, q);
  const accB = accuracyPoints(guessB, q);
  const errA = guessA == null ? Infinity : Math.abs(guessA - q.answer);
  const errB = guessB == null ? Infinity : Math.abs(guessB - q.answer);

  let duelA = 0;
  let duelB = 0;
  let winner = null; // 'a' | 'b' | 'tie'
  if (errA === Infinity && errB === Infinity) {
    winner = 'tie';
  } else if (errA < errB) {
    winner = 'a';
    duelA = DUEL_BONUS;
  } else if (errB < errA) {
    winner = 'b';
    duelB = DUEL_BONUS;
  } else {
    winner = 'tie';
    duelA = DUEL_TIE_BONUS;
    duelB = DUEL_TIE_BONUS;
  }

  return {
    winner,
    a: { guess: guessA, err: errA, accuracy: accA, duel: duelA, total: accA + duelA },
    b: { guess: guessB, err: errB, accuracy: accB, duel: duelB, total: accB + duelB },
  };
}

/** Läuft über alle bereits aufgelösten Fragen und summiert die Punkte. */
export function tally(questions, answers, slotA = 'p1', slotB = 'p2') {
  let a = 0;
  let b = 0;
  const rounds = [];
  questions.forEach((q, i) => {
    const entry = (answers && answers[i]) || {};
    const ga = entry[slotA] != null ? entry[slotA].value : null;
    const gb = entry[slotB] != null ? entry[slotB].value : null;
    if (ga == null || gb == null) return; // noch nicht aufgelöst
    const res = scoreQuestion(ga, gb, q);
    a += res.a.total;
    b += res.b.total;
    rounds.push({ index: i, q, ...res });
  });
  return { a, b, rounds };
}
