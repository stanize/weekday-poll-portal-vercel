import { createSupabaseServerClient } from "@/lib/supabase/server";
import HeavyGamesGrid from "./HeavyGamesGrid";

const description = "Choose the dates you can make it for heavy games.";

export const metadata = {
  title: "Heavy Games Poll",
  description,
  openGraph: {
    title: "Heavy Games Poll",
    description,
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
};
export const dynamic = "force-dynamic";

const fmt = (opts: Intl.DateTimeFormatOptions, date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", { ...opts, timeZone: "UTC" });

// Top 3 dates by vote count; ties go to the earlier date.
function topDates(votes: { vote_date: string; voter_name: string }[]) {
  const byDate: Record<string, string[]> = {};
  votes.forEach((v) => (byDate[v.vote_date] ??= []).push(v.voter_name));
  return Object.entries(byDate)
    .sort(([da, a], [db, b]) => b.length - a.length || da.localeCompare(db))
    .slice(0, 3)
    .map(([date, voters]) => ({ date, voters: [...voters].sort((a, b) => a.localeCompare(b)) }));
}

export default async function HeavyGamesPollPage() {
  const supabase = await createSupabaseServerClient();

  const { data: poll } = await supabase
    .from("heavy_polls")
    .select("id, title, start_date, end_date")
    .eq("slug", "heavy-games-poll")
    .maybeSingle();

  const { data: votes } = poll
    ? await supabase.from("heavy_votes").select("vote_date, voter_name").eq("poll_id", poll.id)
    : { data: [] };

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-6">
        <h1 className="text-4xl font-bold text-center">{poll?.title ?? "Heavy Games Poll"}</h1>
        {poll && topDates(votes ?? []).length > 0 && (
          <div className="border rounded-xl p-6 space-y-3">
            <h2 className="text-lg font-semibold">Top dates</h2>
            <ol className="space-y-3">
              {topDates(votes ?? []).map(({ date, voters }, i) => (
                <li key={date} className="flex gap-3">
                  <span className="text-gray-500">{i + 1}.</span>
                  <div>
                    <p>
                      <strong>{fmt({ day: "numeric", month: "long", year: "numeric" }, date)}</strong>
                      {" · "}
                      {fmt({ weekday: "long" }, date)}
                      <span className="text-gray-400">
                        {" "}({voters.length} vote{voters.length === 1 ? "" : "s"})
                      </span>
                    </p>
                    <p className="text-sm text-gray-400">{voters.join(", ")}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}
        {poll ? (
          <div className="border rounded-xl p-6">
            <HeavyGamesGrid poll={poll} votes={votes ?? []} />
          </div>
        ) : (
          <p className="text-center text-gray-400">No poll is open right now.</p>
        )}
      </div>
    </main>
  );
}
