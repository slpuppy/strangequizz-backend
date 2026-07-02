/**
 * Returns today's date formatted as YYYY-MM-DD.
 * @return {string} The formatted date string.
 */
export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Returns the date key for N days ago.
 * @param {number} daysAgo - Number of days to go back.
 * @return {string} The formatted date string.
 */
export function dateKeyDaysAgo(daysAgo: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}
