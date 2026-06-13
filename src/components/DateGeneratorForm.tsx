"use client";

import { useState } from "react";
import { generateDates, Frequency, GeneratedDate } from "@/lib/generateDates";

type DateGeneratorFormProps = {
  onDatesGenerated: (dates: GeneratedDate[]) => void;
};

const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekdays", label: "Weekdays (Mon–Fri)" },
  { value: "weekends", label: "Weekends (Sat–Sun)" },
  { value: "weekly", label: "Weekly" },
  { value: "custom", label: "Custom" },
];

const WEEKDAY_OPTIONS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 0, label: "Sunday" },
];

function getTodayYMD() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function DateGeneratorForm({ onDatesGenerated }: DateGeneratorFormProps) {
  const today = getTodayYMD();
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [frequency, setFrequency] = useState<Frequency>("weekdays");
  const [weeklyDay, setWeeklyDay] = useState(1);
  const [sameTimeForAll, setSameTimeForAll] = useState(true);
  const [timeSlot, setTimeSlot] = useState("18:00");
  const [customDates, setCustomDates] = useState<string[]>([]);
  const [error, setError] = useState("");

  function toggleCustomDate(ymd: string) {
    setCustomDates((prev) =>
      prev.includes(ymd) ? prev.filter((d) => d !== ymd) : [...prev, ymd]
    );
  }

  function buildCustomDateRange(): string[] {
    const dates: string[] = [];
    const current = new Date(startDate + "T00:00:00");
    const end = new Date(endDate + "T00:00:00");
    while (current <= end) {
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, "0");
      const day = String(current.getDate()).padStart(2, "0");
      dates.push(`${year}-${month}-${day}`);
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }

  function handleGenerate() {
    setError("");

    if (!startDate || !endDate) {
      setError("Please select a start and end date.");
      return;
    }

    if (startDate > endDate) {
      setError("Start date must be before end date.");
      return;
    }

    const start = new Date(startDate + "T00:00:00");
    const end = new Date(endDate + "T00:00:00");

    const generated = generateDates(
      start,
      end,
      frequency,
      {
        weeklyDay,
        customDates: customDates.map((d) => new Date(d + "T00:00:00")),
      },
      sameTimeForAll ? timeSlot : undefined
    );

    if (generated.length === 0) {
      setError("No dates were generated. Try adjusting your range or frequency.");
      return;
    }

    onDatesGenerated(generated);
  }

  return (
    <div className="space-y-5">
      {/* Date range */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="block text-sm font-medium">Start date</label>
          <input
            type="date"
            value={startDate}
            min={today}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 bg-transparent"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium">End date</label>
          <input
            type="date"
            value={endDate}
            min={startDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 bg-transparent"
          />
        </div>
      </div>

      {/* Frequency */}
      <div className="space-y-1">
        <label className="block text-sm font-medium">Frequency</label>
        <div className="flex flex-wrap gap-2">
          {FREQUENCIES.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFrequency(f.value)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                frequency === f.value
                  ? "bg-white text-black"
                  : "hover:bg-white hover:text-black"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Weekly day picker */}
      {frequency === "weekly" && (
        <div className="space-y-1">
          <label className="block text-sm font-medium">Every</label>
          <select
            value={weeklyDay}
            onChange={(e) => setWeeklyDay(Number(e.target.value))}
            className="rounded-lg border px-3 py-2 bg-transparent"
          >
            {WEEKDAY_OPTIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Custom date picker */}
      {frequency === "custom" && startDate && endDate && startDate <= endDate && (
        <div className="space-y-2">
          <label className="block text-sm font-medium">Select dates</label>
          <div className="flex flex-wrap gap-2">
            {buildCustomDateRange().map((ymd) => (
              <button
                key={ymd}
                type="button"
                onClick={() => toggleCustomDate(ymd)}
                className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                  customDates.includes(ymd)
                    ? "bg-white text-black"
                    : "hover:bg-white hover:text-black"
                }`}
              >
                {ymd}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Time slot */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <label className="block text-sm font-medium">Time slot</label>
          <label className="flex items-center gap-1.5 text-sm text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              checked={sameTimeForAll}
              onChange={(e) => setSameTimeForAll(e.target.checked)}
              className="h-4 w-4"
            />
            Same for all dates
          </label>
        </div>
        {sameTimeForAll && (
          <input
            type="time"
            value={timeSlot}
            onChange={(e) => setTimeSlot(e.target.value)}
            className="rounded-lg border px-3 py-2 bg-transparent"
          />
        )}
        {!sameTimeForAll && (
          <p className="text-sm text-gray-400">
            You can set individual times in the preview step.
          </p>
        )}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="button"
        onClick={handleGenerate}
        className="rounded-lg border px-4 py-2 font-medium hover:bg-white hover:text-black transition"
      >
        Generate dates →
      </button>
    </div>
  );
}
