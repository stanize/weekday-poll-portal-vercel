"use client";

import { useState } from "react";
import AdminPanel from "./AdminPanel";
import HeavyGamesAdmin from "./HeavyGamesAdmin";

type Poll = { id: string; title: string; description: string | null; slug: string };
type HeavyPoll = { id: string; title: string; start_date: string; end_date: string };

export default function SauronTabs({
  poll,
  heavyPoll,
  heavyVoteCount,
}: {
  poll: Poll | null;
  heavyPoll: HeavyPoll | null;
  heavyVoteCount: number;
}) {
  const [tab, setTab] = useState<"morning" | "heavy">("morning");
  const tabs = [
    { key: "morning", label: "Morning Meeples" },
    { key: "heavy", label: "Heavy Games" },
  ] as const;

  return (
    <div className="space-y-4">
      <div className="flex rounded-lg border overflow-hidden">
        {tabs.map((t, i) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            aria-pressed={tab === t.key}
            className={`flex-1 px-4 py-2.5 text-sm font-semibold transition cursor-pointer ${i > 0 ? "border-l" : ""} ${
              tab === t.key
                ? "bg-[var(--foreground)] text-[var(--background)]"
                : "text-gray-400 hover:text-[var(--foreground)] hover:bg-[var(--foreground)]/5"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "morning" ? (
        <AdminPanel poll={poll} />
      ) : (
        <HeavyGamesAdmin poll={heavyPoll} voteCount={heavyVoteCount} />
      )}
    </div>
  );
}
