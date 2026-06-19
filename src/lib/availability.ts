// Weekly working-hours model + "open now" computation (Mauritius is UTC+4, no DST).
// Availability is derived from the schedule: an artisan is online only during the
// open/close window of the current Mauritius day.

export const WEEK_DAYS = [
  { key: "mon", label: "Monday" },
  { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" },
  { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" },
  { key: "sat", label: "Saturday" },
  { key: "sun", label: "Sunday" },
] as const;

export type DayKey = (typeof WEEK_DAYS)[number]["key"];
export type DayHours = { open: string; close: string };
export type WeekHours = Partial<Record<DayKey, DayHours | null>>;

const JS_DAY_TO_KEY: DayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function mauritiusNow(): { dayKey: DayKey; minutes: number } {
  const mu = new Date(Date.now() + 4 * 60 * 60 * 1000);
  return {
    dayKey: JS_DAY_TO_KEY[mu.getUTCDay()],
    minutes: mu.getUTCHours() * 60 + mu.getUTCMinutes(),
  };
}

export function toMinutes(hhmm: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const mins = Number(match[2]);
  if (hours > 23 || mins > 59) return null;
  return hours * 60 + mins;
}

/** True when the current Mauritius time falls inside today's open→close window. */
export function isOpenNow(hours: WeekHours | null | undefined): boolean {
  if (!hours) return false;
  const { dayKey, minutes } = mauritiusNow();
  const slot = hours[dayKey];
  if (!slot?.open || !slot?.close) return false;
  const open = toMinutes(slot.open);
  const close = toMinutes(slot.close);
  if (open === null || close === null || close <= open) return false;
  return minutes >= open && minutes < close;
}

/** Human label for today's hours, e.g. "08:00–17:00" or "Closed today". */
export function todayHoursLabel(hours: WeekHours | null | undefined): string {
  if (!hours) return "No hours set";
  const { dayKey } = mauritiusNow();
  const slot = hours[dayKey];
  if (!slot?.open || !slot?.close) return "Closed today";
  return `${slot.open}–${slot.close}`;
}

export function hasAnyHours(hours: WeekHours | null | undefined): boolean {
  return !!hours && Object.values(hours).some((slot) => slot?.open && slot?.close);
}

/** Sensible starting schedule for a new artisan: Mon–Sat 08:00–17:00, Sun off. */
export function defaultWeekHours(): WeekHours {
  const hours: WeekHours = {};
  for (const { key } of WEEK_DAYS) {
    hours[key] = key === "sun" ? null : { open: "08:00", close: "17:00" };
  }
  return hours;
}
