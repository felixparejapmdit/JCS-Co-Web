// Dates are handled as 'YYYY-MM-DD' strings, the same format the legacy MySQL DATE columns use.

const MANILA_OFFSET_MIN = 8 * 60;

/** Today's date in the Philippines, regardless of the server's time zone. */
export function today(): string {
  const now = new Date(Date.now() + (MANILA_OFFSET_MIN + new Date().getTimezoneOffset()) * 60000);
  return toIso(now);
}

export function nowStamp(): string {
  const now = new Date(Date.now() + (MANILA_OFFSET_MIN + new Date().getTimezoneOffset()) * 60000);
  return `${toIso(now)} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
}

export function toIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function parseIso(s: string): Date {
  const [y, m, d] = String(s).slice(0, 10).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function addDays(iso: string, days: number): string {
  const d = parseIso(iso);
  d.setDate(d.getDate() + days);
  return toIso(d);
}

export function daysBetween(fromIso: string, toIsoStr: string): number {
  return Math.round((parseIso(toIsoStr).getTime() - parseIso(fromIso).getTime()) / 86400000);
}

export function ym(iso: string): { transyear: number; transmon: number } {
  const d = parseIso(iso);
  return { transyear: d.getFullYear(), transmon: d.getMonth() + 1 };
}

export function monthStart(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}-01`;
}

export function monthEnd(year: number, month: number): string {
  return toIso(new Date(year, month, 0));
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function monthName(month: number): string {
  return MONTHS[(month - 1 + 12) % 12];
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = parseIso(iso);
  return `${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}, ${d.getFullYear()}`;
}
