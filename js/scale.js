// Umrechnung zwischen Reglerposition (0..1) und Schätzwert, plus Zahlenformatierung.

/** Reglerposition 0..1 -> Wert (noch ungerundet). */
export function positionToValue(t, q) {
  const clamped = Math.min(1, Math.max(0, t));
  if (q.scale === 'log') {
    const lo = Math.log(q.min);
    const hi = Math.log(q.max);
    return Math.exp(lo + clamped * (hi - lo));
  }
  return q.min + clamped * (q.max - q.min);
}

/** Wert -> Reglerposition 0..1 (Umkehrung von positionToValue). */
export function valueToPosition(v, q) {
  const clamped = Math.min(q.max, Math.max(q.min, v));
  if (q.scale === 'log') {
    const lo = Math.log(q.min);
    const hi = Math.log(q.max);
    return (Math.log(clamped) - lo) / (hi - lo);
  }
  return (clamped - q.min) / (q.max - q.min);
}

/**
 * Rundet einen Rohwert auf ein sinnvolles Raster:
 * explizites `step` gewinnt, sonst ganze Zahlen unter 1000 und
 * darüber drei signifikante Stellen.
 */
export function snap(v, q) {
  const decimals = q.decimals || 0;
  let out;
  if (q.step) {
    out = Math.round(v / q.step) * q.step;
  } else if (Math.abs(v) < 1000) {
    out = Math.round(v);
  } else {
    const magnitude = Math.floor(Math.log10(Math.abs(v)));
    const factor = 10 ** Math.max(0, magnitude - 2);
    out = Math.round(v / factor) * factor;
  }
  // Gleitkomma-Reste wie 13.900000000000002 wegputzen.
  out = Number(out.toFixed(decimals));
  return Math.min(q.max, Math.max(q.min, out));
}

/** Ein Schritt auf dem Raster – für die Feinjustier-Buttons. */
export function stepSize(v, q) {
  if (q.step) return q.step;
  if (Math.abs(v) < 1000) return 1;
  const magnitude = Math.floor(Math.log10(Math.abs(v)));
  return 10 ** Math.max(0, magnitude - 2);
}

const NF = (min, max) =>
  new Intl.NumberFormat('de-DE', { minimumFractionDigits: min, maximumFractionDigits: max });

/** Reine Zahl, ohne Einheit – große Werte werden zu „1,4 Mrd."  */
export function formatNumber(v, q = {}) {
  if (q.format === 'year') return String(Math.round(v));
  const decimals = q.decimals || 0;
  const abs = Math.abs(v);
  if (abs >= 1e9) return `${NF(0, 2).format(v / 1e9)} Mrd.`;
  if (abs >= 1e6) return `${NF(0, 2).format(v / 1e6)} Mio.`;
  return NF(decimals, decimals).format(v);
}

/** Zahl inklusive Einheit, so wie sie im Spiel angezeigt wird. */
export function formatValue(v, q = {}) {
  const num = formatNumber(v, q);
  return q.unit ? `${num} ${q.unit}` : num;
}

/** „12 % daneben" bzw. „genau richtig" – als Text für die Auflösung. */
export function formatDeviation(guess, q) {
  const diff = Math.abs(guess - q.answer);
  if (diff === 0) return 'exakt richtig';
  const pct = (diff / Math.abs(q.answer)) * 100;
  const pctText = pct >= 10 ? Math.round(pct) : Number(pct.toFixed(1));
  const dir = guess > q.answer ? 'zu hoch' : 'zu niedrig';
  return `${formatNumber(diff, { ...q, format: null })} ${q.unit || ''} ${dir} (${NF(0, 1).format(pctText)} %)`.replace(/\s+/g, ' ').trim();
}
