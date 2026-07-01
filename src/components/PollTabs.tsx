"use client";

import { useState } from "react";
import PollVotingForm from "@/components/PollVotingForm";

type PollDate = {
  id: string;
  weekday_name: string;
  poll_date: string;
  vote_count: number;
  voter_names: string[];
};

type PollTabsProps = {
  pollId: string;
  description: string | null;
  currentWeekDates: PollDate[];
  nextWeekDates: PollDate[];
};

type WeekTab = "current" | "next";

function formatWeekRange(dates: PollDate[]) {
  if (dates.length === 0) return "";
  const sorted = [...dates].sort((a, b) => a.poll_date.localeCompare(b.poll_date));
  const start = new Date(sorted[0].poll_date);
  const end = new Date(sorted[sorted.length - 1].poll_date);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  return `${fmt(start)} – ${fmt(end)}`;
}

export default function PollTabs({
  pollId,
  description,
  currentWeekDates,
  nextWeekDates,
}: PollTabsProps) {
  const [activeTab, setActiveTab] = useState<WeekTab>("current");
  const [voterName, setVoterName] = useState("");

  const tabs: { key: WeekTab; label: string; dates: PollDate[] }[] = [
    { key: "current", label: "This Week", dates: currentWeekDates },
    { key: "next", label: "Next Week", dates: nextWeekDates },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="voterName" className="block text-sm font-medium">
          Name (Required)
        </label>
        <input
          id="voterName"
          type="text"
          value={voterName}
          onChange={(e) => setVoterName(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 bg-transparent"
          placeholder="Your name"
          required
        />
      </div>

      {description && <h2 className="text-2xl font-semibold">{description}</h2>}

      <div className="space-y-4">
        <div className="flex rounded-lg border border-white/15 overflow-hidden">
          {tabs.map((tab, i) => {
            const isActive = tab.key === activeTab;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                aria-pressed={isActive}
                className={`flex-1 px-4 py-2.5 text-center transition cursor-pointer ${
                  i > 0 ? "border-l border-white/15" : ""
                } ${
                  isActive
                    ? "bg-white text-black"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <div className="text-sm font-semibold">{tab.label}</div>
                <div className={`text-xs mt-0.5 ${isActive ? "text-black/60" : "text-gray-500"}`}>
                  {formatWeekRange(tab.dates)}
                </div>
              </button>
            );
          })}
        </div>

        {tabs.map((tab) =>
          tab.key === activeTab ? (
            tab.dates.length > 0 ? (
              <PollVotingForm
                key={tab.key}
                pollId={pollId}
                pollDates={tab.dates}
                voterName={voterName}
              />
            ) : (
              <p key={tab.key} className="text-gray-400">
                No dates found for {tab.label.toLowerCase()}.
              </p>
            )
          ) : null
        )}
      </div>
    </div>
  );
}
