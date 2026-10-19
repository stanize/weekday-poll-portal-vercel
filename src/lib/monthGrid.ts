export type GridMonth = {
  key: string;
  label: string;
  // Monday-first; null = padding cell outside the month
  cells: (string | null)[];
};

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

/** Months overlapping [start, end] (YYYY-MM-DD), as Monday-first grids. */
export function buildMonths(start: string, end: string): GridMonth[] {
  const [sy, sm] = start.split("-").map(Number);
  const [ey, em] = end.split("-").map(Number);
  const months: GridMonth[] = [];

  for (let y = sy, m = sm - 1; y < ey || (y === ey && m <= em - 1); m++) {
    if (m > 11) {
      m = 0;
      y++;
    }
    const first = new Date(Date.UTC(y, m, 1));
    const daysInMonth = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    const lead = (first.getUTCDay() + 6) % 7;
    const cells: (string | null)[] = Array(lead).fill(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(iso(y, m, d));
    months.push({
      key: `${y}-${pad(m + 1)}`,
      label: first.toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }),
      cells,
    });
  }
  return months;
}

export function formatDay(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}
