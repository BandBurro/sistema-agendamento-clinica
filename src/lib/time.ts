/**
 * Combines the DB's split date (date-only) and startTime (time-only) fields
 * into a single UTC timestamp for past/future comparisons.
 *
 * Both fields are stored in UTC — date as YYYY-MM-DDT00:00:00Z and
 * startTime as 1970-01-01THH:mm:00Z — so we extract the UTC components
 * from each and merge them.
 */
export function getAppointmentDateTime(
  date: Date | string,
  startTime: Date | string,
): Date {
  const d = new Date(date);
  const t = new Date(startTime);
  return new Date(
    Date.UTC(
      d.getUTCFullYear(),
      d.getUTCMonth(),
      d.getUTCDate(),
      t.getUTCHours(),
      t.getUTCMinutes(),
    ),
  );
}
