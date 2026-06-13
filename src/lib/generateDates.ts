export type Frequency = "daily" | "weekdays" | "weekends" | "weekly" | "custom";

export type GenerateDatesOptions = {
  weeklyDay?: number; // 0=Sun, 1=Mon ... 6=Sat — used when frequency = "weekly"
  customDates?: Date[]; // used when frequency = "custom"
};

export type GeneratedDate = {
  date: Date;
  weekday_name: string;
  poll_date: string; // YYYY-MM-DD
  time_slot?: string; // e.g. "10:00"
};

const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function toLocalMidnight(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toYMD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toGeneratedDate(date: Date, timeSlot?: string): GeneratedDate {
  return {
    date,
    weekday_name: WEEKDAY_NAMES[date.getDay()],
    poll_date: toYMD(date),
    time_slot: timeSlot,
  };
}

export function generateDates(
  startDate: Date,
  endDate: Date,
  frequency: Frequency,
  options: GenerateDatesOptions = {},
  timeSlot?: string
): GeneratedDate[] {
  const start = toLocalMidnight(startDate);
  const end = toLocalMidnight(endDate);

  if (start > end) return [];

  const results: GeneratedDate[] = [];

  if (frequency === "custom") {
    const sorted = (options.customDates ?? [])
      .map(toLocalMidnight)
      .filter((d) => d >= start && d <= end)
      .sort((a, b) => a.getTime() - b.getTime());
    return sorted.map((d) => toGeneratedDate(d, timeSlot));
  }

  const current = new Date(start);

  while (current <= end) {
    const day = current.getDay();
    let include = false;

    if (frequency === "daily") {
      include = true;
    } else if (frequency === "weekdays") {
      include = day >= 1 && day <= 5;
    } else if (frequency === "weekends") {
      include = day === 0 || day === 6;
    } else if (frequency === "weekly") {
      include = day === (options.weeklyDay ?? 1);
    }

    if (include) {
      results.push(toGeneratedDate(new Date(current), timeSlot));
    }

    current.setDate(current.getDate() + 1);
  }

  if (results.length > 365) {
    console.warn(
      `generateDates: generated ${results.length} dates — consider narrowing the range.`
    );
  }

  return results;
}
