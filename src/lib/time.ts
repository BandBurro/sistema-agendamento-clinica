/**
 * Combines the DB's split date (date-only) and startTime (time-only) fields
 * into a LOCAL Date for past/future comparisons against the real wall clock.
 *
 * date     → stored as YYYY-MM-DDT00:00:00Z  → getUTC* gives the calendar date
 * startTime → stored as 1970-01-01THH:mm:00Z → getUTC* gives the wall-clock hour
 *
 * We build a local Date (new Date without UTC) so that the result can be
 * directly compared against Date.now() / useServerTime() regardless of
 * the browser's UTC offset.
 */
export function getAppointmentDateTime(
  date: Date | string,
  startTime: Date | string,
): Date {
  const d = new Date(date);
  const t = new Date(startTime);
  return new Date(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate(),
    t.getHours(),
    t.getMinutes(),
  );
}
