import { createSupabaseServerClient } from "@/lib/supabase/server";
import HeavyGamesGrid from "./HeavyGamesGrid";

export const metadata = { title: "Heavy Games Poll" };
export const dynamic = "force-dynamic";

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
