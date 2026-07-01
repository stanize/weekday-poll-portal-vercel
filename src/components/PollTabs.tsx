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

export default function PollTabs({ pollId, currentWeekDates, nextWeekDates }: PollTabsProps) {
  const [activeTab, setActiveTab] = useState<WeekTab>("current");
  const [voterName, setVoterName] = useState("");

  const tabs: { key: WeekTab; label: string; dates: PollDate[] }[] = [
    { key: "current", label: "This Week", dates: currentWeekDates },
    { key: "next", label: "Next Week", dates: nextWeekDates },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
              activeTab === tab.key
                ? "border-white text-white"
                : "border-transparent text-gray-500 hover:text-gray-300"
            }`}
          >
            {tab.label}
            {tab.dates.length > 0 && (
              <span className="ml-2 text-xs text-gray-500">{formatWeekRange(tab.dates)}</span>
            )}
          </button>
        ))}
      </div>

      {tabs.map((tab) =>
        tab.key === activeTab ? (
          tab.dates.length > 0 ? (
            <PollVotingForm
              key={tab.key}
              pollId={pollId}
              pollDates={tab.dates}
              voterName={voterName}
              onVoterNameChange={setVoterName}
            />
          ) : (
            <p key={tab.key} className="text-gray-400">
              No dates found for {tab.label.toLowerCase()}.
            </p>
          )
        ) : null
      )}
    </div>
  );
}
