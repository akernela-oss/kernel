/** Conversion helpers between Prisma rows and the plain domain shapes. */

/** Coerce a Prisma Decimal / number / string to a finite number (0 on failure). */
export function toNumber(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  const decimalLike = value as { toNumber?: () => number; toString(): string };
  if (typeof decimalLike.toNumber === 'function') {
    const n = decimalLike.toNumber();
    return Number.isFinite(n) ? n : 0;
  }
  const n = Number(decimalLike.toString());
  return Number.isFinite(n) ? n : 0;
}

/** Format a Date as an ISO `YYYY-MM-DD` string (null-safe). */
export function dateToIso(value: Date | null | undefined): string | null {
  if (!value) return null;
  const time = value.getTime();
  if (Number.isNaN(time)) return null;
  return value.toISOString().slice(0, 10);
}

/** Parse an ISO `YYYY-MM-DD` (or full ISO) string to a UTC Date (null-safe). */
export function isoToDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const normalized = value.length === 10 ? `${value}T00:00:00.000Z` : value;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Human-friendly code from an entity prefix and its monotonic sequence. */
export function code(prefix: string, seq: number): string {
  return `${prefix}-${String(seq).padStart(4, '0')}`;
}

/**
 * Normalise an optional foreign-key value:
 *  - `undefined` (not sent) stays `undefined` so Prisma leaves the field as-is
 *  - empty string becomes `null` so it clears the relation instead of breaking it
 */
export function optFk(value: string | null | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  return value;
}

/** Map an optional ISO date for a Prisma write (undefined → untouched). */
export function optDate(value: string | null | undefined): Date | null | undefined {
  if (value === undefined) return undefined;
  return isoToDate(value);
}
