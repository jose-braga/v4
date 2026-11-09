/**
 * Converts a JavaScript Date object to an ISO date string (YYYY-MM-DD)
 * using local time getters to prevent UTC timezone shifts.
 */
export function toIsoDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function fromIsoDateString(s: string | null | undefined): Date | null {
    if (!s) return null
    const [y, m, d] = s.slice(0, 10).split('-').map(Number)
    return new Date(y, m - 1, d)
}

export function isCurrent(until: string | Date | null): boolean {
    if (!until) return true
    const day = typeof until === 'string' ? until.slice(0, 10) : toIsoDateString(until)
    return day >= toIsoDateString(new Date())
}