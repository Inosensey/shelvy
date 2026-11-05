export const CSV_BOM = '\uFEFF'; // so Excel reads UTF-8 (₱, accents) correctly

const FORMULA_START = /^[=+\-@\t\r]/;

// text: true for free-text cells; leave numbers alone so "-5" stays a number
export function csvCell(value: unknown, opts: { text?: boolean } = {}): string {
  if (value === null || value === undefined) return '';

  let s: string;

  if (value instanceof Date) {
    s = value.toISOString();
  } else if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint'
  ) {
    s = String(value);
  } else {
    s = JSON.stringify(value);
  }

  if (opts.text && FORMULA_START.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export const csvRow = (cells: string[]) => cells.join(',') + '\r\n';

// "2026-11-04 09:25:00" in Manila time
export function manilaDateTime(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')}`;
}

export const manilaDate = (date = new Date()) =>
  manilaDateTime(date).slice(0, 10);

export const MAX_EXPORT_ROWS = 50_000;
